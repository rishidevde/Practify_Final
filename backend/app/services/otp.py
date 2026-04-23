from __future__ import annotations

from datetime import datetime, timedelta
from random import randint

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models import OtpChallenge


def _generate_otp() -> str:
    return f"{randint(0, 999999):06d}"


def create_challenge(*, session: Session, phone: str, purpose: str) -> OtpChallenge:
    now = datetime.utcnow()
    otp = _generate_otp()
    ch = OtpChallenge(
        phone=phone,
        purpose=purpose,
        otp_code=otp,
        expires_at=now + timedelta(minutes=5),
        used=False,
    )
    session.add(ch)
    session.commit()
    session.refresh(ch)
    return ch


def verify_challenge(*, session: Session, challenge_id: int, phone: str, purpose: str, otp: str) -> None:
    ch = session.exec(select(OtpChallenge).where(OtpChallenge.id == challenge_id)).first()
    if not ch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP challenge")
    if ch.used:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP already used")
    if ch.phone != phone or ch.purpose != purpose:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP challenge mismatch")
    if datetime.utcnow() > ch.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")
    if ch.otp_code != otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    ch.used = True
    session.add(ch)
    session.commit()

