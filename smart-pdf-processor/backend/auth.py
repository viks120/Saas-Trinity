"""Authentication and session management."""

import os
import hashlib
import json
import base64
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request, Response, HTTPException, Depends
from sqlalchemy.orm import Session
import bcrypt
from cryptography.fernet import Fernet
from database import get_db
from models import User

# Session encryption
SESSION_SECRET = os.getenv("SESSION_SECRET", "change-this-secret-key-in-production-must-be-32-bytes-long")
# Ensure key is 32 bytes for Fernet
SESSION_KEY = hashlib.sha256(SESSION_SECRET.encode()).digest()
fernet = Fernet(base64.urlsafe_b64encode(SESSION_KEY))

SESSION_EXPIRATION_HOURS = int(os.getenv("SESSION_EXPIRATION_HOURS", "24"))


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # bcrypt requires bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_session(user_id: int, is_admin: bool, request: Request) -> str:
    """Create an encrypted session cookie value."""
    # Extract client information for session binding
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    user_agent_hash = hashlib.sha256(user_agent.encode()).hexdigest()
    
    # Create session data
    session_data = {
        "user_id": user_id,
        "is_admin": is_admin,
        "created_at": datetime.utcnow().timestamp(),
        "ip_address": ip_address,
        "user_agent_hash": user_agent_hash
    }
    
    # Encrypt session data
    session_json = json.dumps(session_data)
    encrypted = fernet.encrypt(session_json.encode())
    return encrypted.decode()


def decrypt_session(cookie_value: str) -> Optional[dict]:
    """Decrypt and parse session data."""
    try:
        decrypted = fernet.decrypt(cookie_value.encode())
        return json.loads(decrypted.decode())
    except Exception:
        return None


def validate_session(session_data: dict, request: Request) -> bool:
    """Validate session binding and expiration."""
    # Check expiration
    created_at = datetime.fromtimestamp(session_data["created_at"])
    expiration = created_at + timedelta(hours=SESSION_EXPIRATION_HOURS)
    if datetime.utcnow() > expiration:
        return False
    
    # Verify IP address
    current_ip = request.client.host if request.client else "unknown"
    if session_data["ip_address"] != current_ip:
        return False
    
    # Verify user agent hash
    current_user_agent = request.headers.get("user-agent", "")
    current_hash = hashlib.sha256(current_user_agent.encode()).hexdigest()
    if session_data["user_agent_hash"] != current_hash:
        return False
    
    return True


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Extract and validate user from session cookie."""
    # Get session cookie
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Decrypt session
    session_data = decrypt_session(session_cookie)
    if not session_data:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Validate session
    if not validate_session(session_data, request):
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    # Load user from database
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require admin privileges."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


def set_session_cookie(response: Response, session_value: str) -> None:
    """Set HTTP-only session cookie on response."""
    secure = os.getenv("SECURE_COOKIES", "false").lower() == "true"
    
    response.set_cookie(
        key="session",
        value=session_value,
        httponly=True,
        secure=secure,
        samesite="strict",
        max_age=SESSION_EXPIRATION_HOURS * 3600,
        path="/"
    )


def clear_session_cookie(response: Response) -> None:
    """Clear session cookie."""
    response.set_cookie(
        key="session",
        value="",
        httponly=True,
        secure=False,
        samesite="strict",
        max_age=0,
        path="/"
    )
