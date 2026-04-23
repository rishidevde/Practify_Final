from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac
from hmac import compare_digest
from secrets import token_hex
from typing import Any

from jose import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, stored = password_hash.split("$", maxsplit=1)
    except ValueError:
        return False
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000).hex()
    return compare_digest(stored, digest)


def create_access_token(*, subject: str, extra: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.access_token_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

