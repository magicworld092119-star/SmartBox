import hmac
import os
import math
from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware

from fastapi import FastAPI, Depends, HTTPException, Query, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, date
from authlib.integrations.starlette_client import OAuth

import models, schemas, auth
from database import engine, get_db

# Load environment variables
load_dotenv()
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'email profile'},
)

def calculate_distance(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

models.Base.metadata.create_all(bind=engine)

# Ensure new nullable columns exist in SQLite (simple dev-time migration)
from sqlalchemy import text
with engine.connect() as conn:
    try:
        cols = [r[1] for r in conn.execute(text("PRAGMA table_info('agents')")).fetchall()]
        if 'last_online_at' not in cols:
            conn.execute(text("ALTER TABLE agents ADD COLUMN last_online_at DATETIME"))
            
        order_cols = [r[1] for r in conn.execute(text("PRAGMA table_info('orders')")).fetchall()]
        if 'address' not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN address VARCHAR"))
        if 'latitude' not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN latitude FLOAT"))
        if 'longitude' not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN longitude FLOAT"))
        if 'shop_name' not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN shop_name VARCHAR"))
        if 'merchant_name' not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN merchant_name VARCHAR"))
        if 'phone' not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN phone VARCHAR"))
    except Exception:
        pass

app = FastAPI(title="SmartBox API", version="1.0.0")

# Add SessionMiddleware required for OAuth
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "dev-secret-key-change-in-production"))

cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:8081",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartBox API"}

# --- Agent Auth ---

@app.post("/api/agents/register", response_model=schemas.AgentResponse)
def register_agent(
    agent: schemas.AgentCreate,
    db: Session = Depends(get_db),
):
    db_agent = db.query(models.Agent).filter(models.Agent.employee_id == agent.employee_id).first()
    if db_agent:
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    if agent.email:
        db_user = db.query(models.User).filter(models.User.email == agent.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    email_value = agent.email
    if not email_value:
        email_value = f"{agent.employee_id.lower().replace(' ', '_')}@smartbox.app"
        base_email = email_value
        counter = 1
        while db.query(models.User).filter(models.User.email == email_value).first():
            email_value = f"{base_email.split('@')[0]}{counter}@smartbox.app"
            counter += 1

    password_value = agent.password or agent.employee_id
    hashed_password = auth.get_password_hash(password_value)
    new_user = models.User(
        email=email_value,
        name=agent.name or f"Agent {agent.employee_id}",
        phone=agent.phone,
        role=models.UserRole.agent
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_agent = models.Agent(
        user=new_user,
        employee_id=agent.employee_id,
        password_hash=hashed_password,
        city=agent.city,
        zone=agent.zone
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    return new_agent

@app.post("/api/admin/login", response_model=schemas.Token)
def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@smartbox.app")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_password:
        if ENVIRONMENT == "production":
            raise HTTPException(status_code=500, detail="Admin password is not configured")
        admin_password = "admin12345"

    valid_admin_emails = {admin_email.lower(), "admin@smartbox.app", "admin@smartbox.local"}
    if form_data.username.lower() not in valid_admin_emails or not hmac.compare_digest(form_data.password, admin_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    user = db.query(models.User).filter(models.User.email == form_data.username.lower()).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == admin_email).first()
    if user and user.role != models.UserRole.admin:
        raise HTTPException(status_code=409, detail="Configured admin email is already used")
    if not user:
        user = models.User(
            email=admin_email,
            name="SmartBox Admin",
            role=models.UserRole.admin,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/merchants/login", response_model=schemas.Token)
def merchant_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Allow login via email or phone as username
    user = db.query(models.User).filter(
        (models.User.email == form_data.username) | (models.User.phone == form_data.username)
    ).first()
    if not user or user.role != models.UserRole.merchant:
        raise HTTPException(status_code=400, detail="Merchant not found")
    
    # For now, since merchants don't have passwords (created via /api/orders/merchant), 
    # let's allow login with any password, or we can add password field later
    # For demo purposes, we'll just create a token
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/merchants/me", response_model=schemas.MerchantFullResponse)
def get_current_merchant_profile(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_merchant)):
    merchant = db.query(models.Merchant).filter(models.Merchant.user_id == current_user.id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")
    return merchant


@app.get("/api/merchants/orders")
def get_merchant_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_merchant)):
    merchant = db.query(models.Merchant).filter(models.Merchant.user_id == current_user.id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant profile not found")
    orders = db.query(models.Order).filter(models.Order.merchant_id == merchant.merchant_id).order_by(models.Order.created_at.desc()).all()
    result = []
    for o in orders:
        agent_name = o.assigned_agent.user.name if o.assigned_agent and o.assigned_agent.user else None
        result.append({
            "order_id": o.order_id,
            "provider": o.provider,
            "device_type": o.device_type,
            "status": o.status,
            "created_at": o.created_at,
            "agent_name": agent_name,
            "address": o.address,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "shop_name": o.shop_name,
            "merchant_name": o.merchant_name,
            "phone": o.phone,
        })
    return result

@app.get("/api/agents", response_model=List[schemas.AgentResponse])
def get_all_agents(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    return agents

@app.post("/api/agents/login", response_model=schemas.Token)
async def login_for_access_token(request: Request, db: Session = Depends(get_db)):
    employee_id = None
    password = None

    content_type = request.headers.get("content-type", "")
    try:
        if "application/json" in content_type:
            body = await request.json()
            if isinstance(body, dict):
                employee_id = body.get("employee_id")
                password = body.get("password")
        else:
            form_data = await request.form()
            employee_id = form_data.get("employee_id") or form_data.get("username")
            password = form_data.get("password")
    except Exception:
        employee_id = None
        password = None

    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")

    agent = db.query(models.Agent).filter(models.Agent.employee_id == employee_id).first()
    if not agent or not agent.user or agent.user.role != models.UserRole.agent:
        raise HTTPException(status_code=400, detail="Incorrect employee ID")

    if password and agent.password_hash:
        if not auth.verify_password(password, agent.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect password")

    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": agent.user.email, "role": agent.user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Agent Routes ---

@app.get("/api/agents/me", response_model=schemas.AgentResponse)
def get_current_agent_profile(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_agent)):
    agent = db.query(models.Agent).filter(models.Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")
    return agent

@app.put("/api/agents/status")
def update_agent_status(status: bool = Query(...), latitude: float = Query(None), longitude: float = Query(None), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_agent)):
    agent = db.query(models.Agent).filter(models.Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")
    agent.online_status = status
    if latitude is not None:
        agent.latitude = latitude
    if longitude is not None:
        agent.longitude = longitude
    # Track when agent went online to prefer longer-online agents during assignment
    if status:
        agent.last_online_at = datetime.utcnow()
    else:
        agent.last_online_at = None
    db.commit()

    # If the agent just came online, try to assign nearby pending orders to them.
    if status:
        try:
            assigned = assign_pending_orders_for_agent(db, agent, max_assign=5)
            return {"status": "updated", "online": agent.online_status, "latitude": agent.latitude, "longitude": agent.longitude, "assigned": assigned}
        except Exception:
            # Don't fail the status update if assignment has an issue
            return {"status": "updated", "online": agent.online_status, "latitude": agent.latitude, "longitude": agent.longitude, "assigned": 0}

    return {"status": "updated", "online": agent.online_status, "latitude": agent.latitude, "longitude": agent.longitude}

@app.get("/api/agents/orders")
def get_agent_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_agent)):
    agent = db.query(models.Agent).filter(models.Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")
    orders = db.query(models.Order).filter(models.Order.assigned_agent_id == agent.agent_id).all()
    result = []
    for o in orders:
        result.append({
            "order_id": o.order_id,
            "merchant_id": o.merchant_id,
            "provider": o.provider,
            "device_type": o.device_type,
            "status": o.status,
            "assigned_agent_id": o.assigned_agent_id,
            "created_at": o.created_at,
            "address": o.address,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "shop_name": o.shop_name,
            "merchant_name": o.merchant_name,
            "phone": o.phone,
            "merchant": {
                "shop_name": o.merchant.shop_name if o.merchant else None,
                "address": o.merchant.address if o.merchant else None,
                "latitude": o.merchant.latitude if o.merchant else None,
                "longitude": o.merchant.longitude if o.merchant else None,
            } if o.merchant else None,
        })
    return result

@app.patch("/api/agents/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_agent_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_agent),
):
    agent = db.query(models.Agent).filter(models.Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")

    order = db.query(models.Order).filter(
        models.Order.order_id == order_id,
        models.Order.assigned_agent_id == agent.agent_id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    db.add(models.OrderHistory(order_id=order.order_id, action=f"Status changed to {payload.status.value}"))
    db.commit()
    db.refresh(order)
    return order

# --- Dashboard Stats ---

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    total_orders_today = db.query(func.count(models.Order.order_id)).filter(
        func.date(models.Order.created_at) == today
    ).scalar()
    pending = db.query(func.count(models.Order.order_id)).filter(
        models.Order.status == models.OrderStatus.pending
    ).scalar()
    completed = db.query(func.count(models.Order.order_id)).filter(
        models.Order.status.in_([models.OrderStatus.installed, models.OrderStatus.delivered])
    ).scalar()
    active_agents = db.query(func.count(models.Agent.agent_id)).filter(
        models.Agent.online_status == True
    ).scalar()
    return {
        "total_orders_today": total_orders_today,
        "pending_dispatches": pending,
        "completed_installations": completed,
        "active_agents": active_agents
    }

@app.get("/api/orders")
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).limit(50).all()
    result = []
    for o in orders:
        merchant_shop = o.merchant.shop_name if o.merchant else None
        agent_nm = o.assigned_agent.user.name if o.assigned_agent and o.assigned_agent.user else None
        result.append({
            "order_id": o.order_id,
            "merchant_id": o.merchant_id,
            "provider": o.provider,
            "device_type": o.device_type,
            "status": o.status,
            "assigned_agent_id": o.assigned_agent_id,
            "created_at": o.created_at,
            "address": o.address,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "shop_name": o.shop_name,
            "merchant_name": o.merchant_name,
            "phone": o.phone,
            "merchant_shop_name": merchant_shop,
            "agent_name": agent_nm,
        })
    return result

# --- Merchant Routes ---

@app.get("/api/merchants", response_model=List[schemas.MerchantFullResponse])
def get_all_merchants(db: Session = Depends(get_db)):
    return db.query(models.Merchant).all()

@app.post("/api/merchants/register", response_model=schemas.MerchantResponse)
def register_merchant(user: schemas.UserCreate, merchant: schemas.MerchantCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        new_user = models.User(email=user.email, name=user.name, phone=user.phone, role=models.UserRole.merchant)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        db_user = new_user
    
    db_merchant = models.Merchant(
        user_id=db_user.id,
        shop_name=merchant.shop_name,
        address=merchant.address,
        latitude=merchant.latitude,
        longitude=merchant.longitude
    )
    db.add(db_merchant)
    db.commit()
    db.refresh(db_merchant)
    return db_merchant

def find_nearest_agent(db: Session, lat: float, lon: float):
    """Find the nearest online agent to (lat, lon) within a radius (km).

    Preference: pick the agent with smallest distance. If multiple agents are
    effectively tied, prefer the agent with earlier `last_online_at` (i.e. has
    been online longer). If `lat` or `lon` is None, return None (no automatic
    assignment without coordinates).
    """
    radius_km = 5.0
    online_agents = db.query(models.Agent).filter(models.Agent.online_status == True).all()
    if not online_agents:
        return None

    if lat is None or lon is None:
        return None

    nearest = None
    min_dist = float('inf')
    for agent in online_agents:
        if agent.latitude is not None and agent.longitude is not None:
            dist = calculate_distance(lat, lon, agent.latitude, agent.longitude)
            if dist <= radius_km:
                if dist < min_dist - 1e-6:
                    min_dist = dist
                    nearest = agent
                elif abs(dist - min_dist) <= 1e-6 and nearest is not None:
                    # Tie-breaker: prefer earlier last_online_at (smaller datetime)
                    a_time = agent.last_online_at or datetime.max
                    n_time = nearest.last_online_at or datetime.max
                    if a_time < n_time:
                        nearest = agent

    return nearest


def assign_pending_orders_for_agent(db: Session, agent: models.Agent, max_assign: int = 5):
    """Assign up to `max_assign` pending orders to `agent` when they come online.

    For each pending order (unassigned), we compute the nearest online agent using
    `find_nearest_agent`. If the nearest agent is this agent, we assign the order.
    This keeps assignment deterministic: ties fall through to whichever agent is
    returned by `find_nearest_agent` (which picks the first when distances equal).
    """
    if not agent or not agent.online_status:
        return 0

    pending_orders = db.query(models.Order).filter(
        models.Order.status == models.OrderStatus.pending,
        (models.Order.assigned_agent_id == None)
    ).all()

    assigned_count = 0
    for o in pending_orders:
        if assigned_count >= max_assign:
            break

        # Use order specific coordinates if available, otherwise fallback to merchant
        lat = o.latitude if o.latitude is not None else (o.merchant.latitude if o.merchant else None)
        lon = o.longitude if o.longitude is not None else (o.merchant.longitude if o.merchant else None)

        nearest = find_nearest_agent(db, lat, lon)
        if nearest and nearest.agent_id == agent.agent_id:
            # Double-check order still unassigned (avoid race)
            fresh = db.query(models.Order).filter(models.Order.order_id == o.order_id).first()
            if fresh and (fresh.assigned_agent_id is None):
                fresh.assigned_agent_id = agent.agent_id
                fresh.status = models.OrderStatus.assigned
                db.add(models.OrderHistory(order_id=fresh.order_id, action=f"Assigned to agent {agent.employee_id}"))
                db.commit()
                assigned_count += 1

    return assigned_count

@app.post("/api/orders/merchant", response_model=schemas.OrderResponse)
def create_order_for_merchant(payload: schemas.MerchantOrderCreate, db: Session = Depends(get_db)):
    """Register a new merchant (or find existing) and place an order in one call."""
    db_user = db.query(models.User).filter(models.User.phone == payload.phone).first()
    if not db_user:
        db_user = models.User(
            email=payload.email or f"{payload.phone}@merchant.smartbox",
            name=payload.merchant_name,
            phone=payload.phone,
            role=models.UserRole.merchant
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    db_merchant = db.query(models.Merchant).filter(models.Merchant.user_id == db_user.id).first()
    if not db_merchant:
        db_merchant = models.Merchant(
            user_id=db_user.id,
            shop_name=payload.shop_name,
            address=payload.address,
            latitude=payload.latitude,
            longitude=payload.longitude
        )
        db.add(db_merchant)
        db.commit()
        db.refresh(db_merchant)

    available_agent = find_nearest_agent(db, payload.latitude, payload.longitude)
    new_order = models.Order(
        merchant_id=db_merchant.merchant_id,
        provider=payload.provider,
        device_type=payload.device_type,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        shop_name=payload.shop_name,
        merchant_name=payload.merchant_name,
        phone=payload.phone,
        status=models.OrderStatus.pending if not available_agent else models.OrderStatus.assigned,
        assigned_agent_id=available_agent.agent_id if available_agent else None
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    history = models.OrderHistory(
        order_id=new_order.order_id,
        action="Order Created" if not available_agent else "Order Assigned"
    )
    db.add(history)
    db.commit()
    return new_order

@app.post("/api/orders", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_merchant)):
    merchant = db.query(models.Merchant).filter(
        models.Merchant.merchant_id == order.merchant_id,
        models.Merchant.user_id == current_user.id,
    ).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    available_agent = find_nearest_agent(db, merchant.latitude, merchant.longitude)

    new_order = models.Order(
        merchant_id=order.merchant_id,
        provider=order.provider,
        device_type=order.device_type,
        address=order.address,
        latitude=order.latitude,
        longitude=order.longitude,
        shop_name=order.shop_name,
        merchant_name=order.merchant_name,
        phone=order.phone,
        status=models.OrderStatus.pending if not available_agent else models.OrderStatus.assigned,
        assigned_agent_id=available_agent.agent_id if available_agent else None
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Add to history
    history = models.OrderHistory(
        order_id=new_order.order_id,
        action="Order Created" if not available_agent else "Order Assigned"
    )
    db.add(history)
    db.commit()

    return new_order

@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == models.UserRole.admin:
        return order
    if current_user.role == models.UserRole.merchant:
        merchant = db.query(models.Merchant).filter(models.Merchant.user_id == current_user.id).first()
        if merchant and order.merchant_id == merchant.merchant_id:
            return order
    if current_user.role == models.UserRole.agent:
        agent = db.query(models.Agent).filter(models.Agent.user_id == current_user.id).first()
        if agent and order.assigned_agent_id == agent.agent_id:
            return order

    raise HTTPException(status_code=403, detail="Not allowed to access this order")


@app.get("/api/orders/{order_id}/track")
def track_order(order_id: int, db: Session = Depends(get_db)):
    """Public tracking endpoint used by the merchant app to get live status updates."""
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    agent_name = order.assigned_agent.user.name if order.assigned_agent and order.assigned_agent.user else None
    return {
        "order_id": order.order_id,
        "merchant_id": order.merchant_id,
        "provider": order.provider,
        "device_type": order.device_type,
        "status": order.status,
        "assigned_agent_id": order.assigned_agent_id,
        "agent_name": agent_name,
        "created_at": order.created_at,
        "address": order.address,
        "latitude": order.latitude,
        "longitude": order.longitude,
        "shop_name": order.shop_name,
        "merchant_name": order.merchant_name,
        "phone": order.phone,
    }


@app.get("/api/orders/by-phone/{phone}")
def get_orders_by_phone(phone: str, db: Session = Depends(get_db)):
    """Fetch recent orders by merchant phone number for synchronizing the merchant app."""
    clean_phone = phone.strip()
    orders = db.query(models.Order).filter(models.Order.phone == clean_phone).order_by(models.Order.created_at.desc()).limit(20).all()
    result = []
    for o in orders:
        agent_name = o.assigned_agent.user.name if o.assigned_agent and o.assigned_agent.user else None
        result.append({
            "order_id": o.order_id,
            "merchant_id": o.merchant_id,
            "provider": o.provider,
            "device_type": o.device_type,
            "status": o.status,
            "assigned_agent_id": o.assigned_agent_id,
            "agent_name": agent_name,
            "created_at": o.created_at,
            "address": o.address,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "shop_name": o.shop_name,
            "merchant_name": o.merchant_name,
            "phone": o.phone,
        })
    return result


# --- Google OAuth ---
@app.get("/api/auth/google")
async def google_login(request: Request):
    redirect_uri = request.url_for('google_auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/api/auth/google/callback")
async def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        # Redirect to frontend with error
        return RedirectResponse(f"{os.getenv('FRONTEND_URL', 'http://localhost:5175')}/auth/callback?error=auth_failed")

    user_info = await oauth.google.get('userinfo', token=token)
    user_data = user_info.json()
    google_id = user_data['id']
    email = user_data['email']
    name = user_data.get('name', email.split('@')[0])

    # Check if user exists
    user = db.query(models.User).filter((models.User.google_id == google_id) | (models.User.email == email)).first()
    if not user:
        # Create new user
        user = models.User(
            google_id=google_id,
            email=email,
            name=name,
            role=models.UserRole.merchant
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        # Create merchant profile (with placeholder data for now)
        merchant = models.Merchant(
            user_id=user.id,
            shop_name=f"{name}'s Shop",
            address="Add your address"
        )
        db.add(merchant)
        db.commit()
    else:
        # Update google_id if not set
        if not user.google_id:
            user.google_id = google_id
            db.commit()

    # Create access token
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )

    # Redirect to frontend with token
    return RedirectResponse(f"{os.getenv('FRONTEND_URL', 'http://localhost:5175')}/auth/callback?token={access_token}")
