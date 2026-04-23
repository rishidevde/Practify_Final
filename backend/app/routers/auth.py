from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_session
from app.models import User
from app.schemas import (
    LoginRequest,
    OtpSendRequest,
    OtpSendResponse,
    SignupRequest,
    TokenResponse,
)
from app.services.otp import create_challenge, verify_challenge

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp/send", response_model=OtpSendResponse)
def send_otp(payload: OtpSendRequest, session: Session = Depends(get_session)) -> OtpSendResponse:
    ch = create_challenge(session=session, phone=payload.phone, purpose=payload.purpose)
    return OtpSendResponse(challenge_id=ch.id, dev_otp=ch.otp_code, expires_at=ch.expires_at)


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, session: Session = Depends(get_session)) -> TokenResponse:
    verify_challenge(
        session=session,
        challenge_id=payload.challenge_id,
        phone=payload.phone,
        purpose="signup",
        otp=payload.otp,
    )

    existing = session.exec(select(User).where(User.phone == payload.phone)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already registered")

    user = User(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        password_hash=hash_password(payload.password),
        target_exam=payload.target_exam,
        avatar_url=None,
        coins=160,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    verify_challenge(
        session=session,
        challenge_id=payload.challenge_id,
        phone=payload.phone,
        purpose="login",
        otp=payload.otp,
    )

    user = session.exec(select(User).where(User.phone == payload.phone)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone or password")

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)

