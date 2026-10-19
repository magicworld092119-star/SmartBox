from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models import UserRole, OrderStatus

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole

class UserCreate(UserBase):
    google_id: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Merchant Schemas
class MerchantBase(BaseModel):
    shop_name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class MerchantCreate(MerchantBase):
    pass

class MerchantResponse(MerchantBase):
    merchant_id: int
    user_id: int
    class Config:
        from_attributes = True

# Agent Schemas
class AgentBase(BaseModel):
    employee_id: str = Field(..., min_length=2, max_length=50)
    city: str = Field(..., min_length=2, max_length=80)
    zone: str = Field(..., min_length=1, max_length=80)
    online_status: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    last_online_at: Optional[datetime] = None

class AgentCreate(BaseModel):
    employee_id: str = Field(..., min_length=2, max_length=50)
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    city: Optional[str] = Field(default="Unknown", min_length=2, max_length=80)
    zone: Optional[str] = Field(default="Unknown", min_length=1, max_length=80)
    online_status: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AgentLoginRequest(BaseModel):
    employee_id: str = Field(..., min_length=2, max_length=50)
    password: Optional[str] = Field(default=None, max_length=128)

class AgentResponse(AgentBase):
    agent_id: int
    user_id: int
    user: UserResponse
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    provider: str = Field(..., min_length=2, max_length=80)
    device_type: str = Field(..., min_length=2, max_length=80)
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    shop_name: Optional[str] = None
    merchant_name: Optional[str] = None
    phone: Optional[str] = None

class OrderCreate(OrderBase):
    merchant_id: int

class OrderResponse(OrderBase):
    order_id: int
    merchant_id: int
    status: OrderStatus
    assigned_agent_id: Optional[int] = None
    created_at: datetime
    merchant: Optional[MerchantResponse] = None
    class Config:
        from_attributes = True

class OrderFullResponse(OrderBase):
    order_id: int
    merchant_id: int
    status: OrderStatus
    assigned_agent_id: Optional[int] = None
    created_at: datetime
    merchant_shop_name: Optional[str] = None
    agent_name: Optional[str] = None
    class Config:
        from_attributes = True

# Merchant full response with user info
class MerchantFullResponse(MerchantBase):
    merchant_id: int
    user_id: int
    user: Optional[UserResponse] = None
    class Config:
        from_attributes = True

# Combined Merchant + Order creation (used by merchant app)
class MerchantOrderCreate(BaseModel):
    shop_name: str
    merchant_name: str
    phone: str
    email: Optional[str] = None
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    provider: str
    device_type: str

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

# Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
