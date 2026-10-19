from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
import datetime
from database import Base

class UserRole(str, enum.Enum):
    merchant = "merchant"
    agent = "agent"
    admin = "admin"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    accepted = "accepted"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    installed = "installed"
    cancelled = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.merchant)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    merchant_profile = relationship("Merchant", back_populates="user", uselist=False)
    agent_profile = relationship("Agent", back_populates="user", uselist=False)

class Merchant(Base):
    __tablename__ = "merchants"

    merchant_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    shop_name = Column(String)
    address = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    user = relationship("User", back_populates="merchant_profile")
    orders = relationship("Order", back_populates="merchant")

class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    employee_id = Column(String, unique=True, index=True)
    password_hash = Column(String)
    city = Column(String)
    zone = Column(String)
    online_status = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    last_online_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="agent_profile")
    orders = relationship("Order", back_populates="assigned_agent")

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.merchant_id"))
    provider = Column(String) # PhonePe, Paytm, etc.
    device_type = Column(String) # Smart Box, Scanner, etc.
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    shop_name = Column(String, nullable=True)
    merchant_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    assigned_agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="orders")
    assigned_agent = relationship("Agent", back_populates="orders")
    history = relationship("OrderHistory", back_populates="order")
    proofs = relationship("UploadedProof", back_populates="order")

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, index=True)
    otp = Column(String)
    expiry_time = Column(DateTime)

class OrderHistory(Base):
    __tablename__ = "order_history"

    history_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="history")

class UploadedProof(Base):
    __tablename__ = "uploaded_proofs"

    image_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    image_url = Column(String)
    uploaded_by = Column(Integer, ForeignKey("users.id"))

    order = relationship("Order", back_populates="proofs")
