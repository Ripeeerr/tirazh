import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Cookie, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import AuthSession, User
from app.db.session import get_db


class PasswordHash:
    def hash(self, password: str) -> str:
        salt = secrets.token_bytes(16)
        key = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
        return f"scrypt${salt.hex()}${key.hex()}"

    def verify(self, password: str, encoded: str) -> bool:
        algorithm, salt, expected = encoded.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
        return secrets.compare_digest(actual.hex(), expected)


password_hash = PasswordHash()
DUMMY_HASH = password_hash.hash("unused-dummy-password")


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def create_session(db: Session, user: User, response: Response) -> None:
    settings = get_settings()
    token = secrets.token_urlsafe(48)
    db.add(
        AuthSession(
            token_hash=digest(token),
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(hours=settings.session_hours),
        )
    )
    response.set_cookie(
        "tirazh_session",
        token,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        max_age=settings.session_hours * 3600,
        path="/api",
    )


def current_user(db: Session = Depends(get_db), tirazh_session: str | None = Cookie(None)) -> User:
    session = db.get(AuthSession, digest(tirazh_session)) if tirazh_session else None
    if session is None or session.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise HTTPException(401, "Войдите в аккаунт")
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(401, "Войдите в аккаунт")
    return user


def manager_user(user: User = Depends(current_user)) -> User:
    if user.role != "manager":
        raise HTTPException(403, "Недостаточно прав")
    return user
