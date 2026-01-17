from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pw_bytes = plain_password.encode("utf-8")
    secret_bytes = hashlib.sha256(pw_bytes).digest() if len(pw_bytes) > 72 else pw_bytes
    return pwd_context.verify(secret_bytes, hashed_password)


def get_password_hash(password: str) -> str:
    pw_bytes = password.encode("utf-8")
    # bcrypt has a 72-byte input limit; if longer, pre-hash with SHA-256 to a fixed-size 32-byte digest
    secret_bytes = hashlib.sha256(pw_bytes).digest() if len(pw_bytes) > 72 else pw_bytes
    return pwd_context.hash(secret_bytes)


def create_access_token(subject: str, is_admin: bool, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "is_admin": is_admin, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise ValueError("Invalid token, could not be decoded")
