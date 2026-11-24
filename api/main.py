from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
import random
import string
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Tourley API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URL)
db = client.tourley

# Collections
users_collection = db.users
destinations_collection = db.destinations
bookings_collection = db.bookings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings (simplified for demo)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")

# Pydantic models
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str

class UserLogin(BaseModel):
    email_or_mobile: str
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class DestinationCreate(BaseModel):
    name: str
    description: str
    images: list[str]
    price: float
    location: str
    category: str

class DestinationUpdate(BaseModel):
    name: str = None
    description: str = None
    images: list[str] = None
    price: float = None
    location: str = None
    category: str = None

class BookingCreate(BaseModel):
    destination_id: str

# Helper functions
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to Tourley API"}

@app.post("/signup")
def signup(user: UserSignup):
    # Check if user already exists
    existing_user = users_collection.find_one({"$or": [{"email": user.email}, {"mobile": user.mobile}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or mobile already registered")
    
    # Generate OTP
    otp = generate_otp()
    
    # Hash password
    hashed_password = hash_password(user.password)
    
    # Create user document
    user_doc = {
        "name": user.name,
        "email": user.email,
        "mobile": user.mobile,
        "password": hashed_password,
        "is_verified": False,
        "email_verification_code": otp,
        "reset_password_code": None,
        "role": "user",
        "created_at": datetime.utcnow()
    }
    
    # Insert user
    result = users_collection.insert_one(user_doc)
    
    # Note: In a real application, you would send the OTP via email here
    # For demo purposes, we'll just return it
    
    return {"message": "User created successfully. Please check your email for verification code.", "user_id": str(result.inserted_id), "otp": otp}

@app.post("/verify-email")
def verify_email(verification: OTPVerification):
    user = users_collection.find_one({"email": verification.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["email_verification_code"] != verification.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Update user as verified
    users_collection.update_one(
        {"email": verification.email},
        {"$set": {"is_verified": True, "email_verification_code": None}}
    )
    
    return {"message": "Email verified successfully"}

@app.post("/login")
def login(user_login: UserLogin):
    # Find user by email or mobile
    user = users_collection.find_one({
        "$or": [
            {"email": user_login.email_or_mobile},
            {"mobile": user_login.email_or_mobile}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user["is_verified"]:
        raise HTTPException(status_code=400, detail="Email not verified")
    
    if not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Create simple token for demo (in production, use proper JWT)
    token = f"demo_token_{user['email']}"
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@app.post("/admin/login")
def admin_login(admin_login: AdminLogin):
    # Find admin user
    user = users_collection.find_one({"email": admin_login.email, "role": "admin"})
    
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(admin_login.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Create simple token for demo
    token = f"demo_admin_token_{user['email']}"
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@app.post("/forgot-password")
def forgot_password(forgot_pass: ForgotPassword):
    user = users_collection.find_one({"email": forgot_pass.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate reset OTP
    reset_otp = generate_otp()
    
    # Update user with reset code
    users_collection.update_one(
        {"email": forgot_pass.email},
        {"$set": {"reset_password_code": reset_otp}}
    )
    
    # Note: In a real application, you would send the OTP via email here
    # For demo purposes, we'll just return it
    
    return {"message": "Password reset code sent to your email", "otp": reset_otp}

@app.post("/verify-reset-code")
def verify_reset_code(reset_data: ResetPassword):
    user = users_collection.find_one({"email": reset_data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["reset_password_code"] != reset_data.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Hash new password
    hashed_password = hash_password(reset_data.new_password)
    
    # Update password and clear reset code
    users_collection.update_one(
        {"email": reset_data.email},
        {"$set": {"password": hashed_password, "reset_password_code": None}}
    )
    
    return {"message": "Password reset successfully"}

@app.get("/destinations")
def get_destinations():
    destinations = list(destinations_collection.find())
    for dest in destinations:
        dest["_id"] = str(dest["_id"])
    return destinations

@app.get("/destinations/{destination_id}")
def get_destination(destination_id: str):
    from bson import ObjectId
    destination = destinations_collection.find_one({"_id": ObjectId(destination_id)})
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    destination["_id"] = str(destination["_id"])
    return destination

@app.post("/destinations")
def create_destination(destination: DestinationCreate):
    dest_doc = destination.dict()
    dest_doc["created_at"] = datetime.utcnow()
    result = destinations_collection.insert_one(dest_doc)
    dest_doc["_id"] = str(result.inserted_id)
    return dest_doc

@app.put("/destinations/{destination_id}")
def update_destination(destination_id: str, destination: DestinationUpdate):
    from bson import ObjectId
    update_data = {k: v for k, v in destination.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = destinations_collection.update_one(
        {"_id": ObjectId(destination_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    updated_destination = destinations_collection.find_one({"_id": ObjectId(destination_id)})
    updated_destination["_id"] = str(updated_destination["_id"])
    return updated_destination

@app.delete("/destinations/{destination_id}")
def delete_destination(destination_id: str):
    from bson import ObjectId
    result = destinations_collection.delete_one({"_id": ObjectId(destination_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Destination not found")
    return {"message": "Destination deleted successfully"}

@app.post("/bookings")
def create_booking(booking: BookingCreate):
    # Check if destination exists
    from bson import ObjectId
    destination = destinations_collection.find_one({"_id": ObjectId(booking.destination_id)})
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    # For demo, we'll use a fixed user ID
    booking_doc = {
        "user_id": "demo_user_id",
        "destination_id": booking.destination_id,
        "booking_date": datetime.utcnow(),
        "status": "confirmed"
    }
    
    result = bookings_collection.insert_one(booking_doc)
    booking_doc["_id"] = str(result.inserted_id)
    return booking_doc

@app.get("/bookings")
def get_user_bookings():
    # For demo, we'll use a fixed user ID
    bookings = list(bookings_collection.find({"user_id": "demo_user_id"}))
    for booking in bookings:
        booking["_id"] = str(booking["_id"])
        # Get destination details
        from bson import ObjectId
        destination = destinations_collection.find_one({"_id": ObjectId(booking["destination_id"])})
        if destination:
            destination["_id"] = str(destination["_id"])
            booking["destination"] = destination
    return bookings

@app.get("/profile")
def get_profile():
    # For demo, we'll use a fixed user
    user = users_collection.find_one({"email": "demo@example.com"})
    if not user:
        # Create demo user if not exists
        user_doc = {
            "name": "Demo User",
            "email": "demo@example.com",
            "mobile": "1234567890",
            "password": hash_password("demo123"),
            "is_verified": True,
            "email_verification_code": None,
            "reset_password_code": None,
            "role": "user",
            "created_at": datetime.utcnow()
        }
        result = users_collection.insert_one(user_doc)
        user = user_doc
    
    user_data = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "mobile": user["mobile"],
        "role": user["role"],
        "created_at": user["created_at"]
    }
    return user_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)