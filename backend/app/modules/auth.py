from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import DUMMY_HASH, create_session, current_user, digest, password_hash
from app.db.models import AuthSession, User
from app.db.session import get_db
from app.modules.schemas import Credentials, ProfileUpdate, Registration, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: Registration, response: Response, db: Session = Depends(get_db)):
    user = User(
        email=payload.email,
        name=payload.name.strip(),
        password_hash=password_hash.hash(payload.password),
    )
    db.add(user)
    try:
        db.flush()
        create_session(db, user, response)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Этот email уже зарегистрирован") from exc
    return user


@router.post("/login", response_model=UserOut)
def login(payload: Credentials, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    valid = password_hash.verify(payload.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        raise HTTPException(401, "Неверный email или пароль")
    create_session(db, user, response)
    db.commit()
    return user


@router.post("/logout", status_code=204)
def logout(
    response: Response, db: Session = Depends(get_db), tirazh_session: str | None = Cookie(None)
):
    if tirazh_session:
        db.execute(delete(AuthSession).where(AuthSession.token_hash == digest(tirazh_session)))
        db.commit()
    response.delete_cookie("tirazh_session", path="/api")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    user.name = payload.name.strip()
    user.phone = payload.phone.strip()
    db.commit()
    return user
