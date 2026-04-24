from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.security import hash_password
from app.db import get_session
from app.deps import get_current_user
from app.models import User, UserEducation, UserProfile
from app.schemas import MeResponse, UpdateProfileRequest

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MeResponse)
def get_me(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MeResponse:
    profile = session.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    education = session.exec(select(UserEducation).where(UserEducation.user_id == user.id)).first()
    payload = {
        **user.model_dump(),
        "profile_details": profile.model_dump(exclude={"id", "user_id"}) if profile else None,
        "education_details": education.model_dump(exclude={"id", "user_id"}) if education else None,
    }
    return MeResponse.model_validate(payload)


@router.patch("", response_model=MeResponse)
def update_me(
    payload: UpdateProfileRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MeResponse:
    data = payload.model_dump(exclude_unset=True)
    profile_data = data.pop("profile_details", None)
    education_data = data.pop("education_details", None)
    password = data.pop("password", None)
    confirm_password = data.pop("confirm_password", None)

    if password is not None:
        if not password:
            raise HTTPException(status_code=400, detail="Password cannot be empty")
        if password != confirm_password:
            raise HTTPException(status_code=400, detail="Password and confirm password do not match")
        user.password_hash = hash_password(password)

    for k, v in data.items():
        setattr(user, k, v)

    if profile_data is not None:
        profile = session.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
        if not profile:
            profile = UserProfile(user_id=user.id)
        for k, v in profile_data.items():
            setattr(profile, k, v)
        session.add(profile)

    if education_data is not None:
        education = session.exec(select(UserEducation).where(UserEducation.user_id == user.id)).first()
        if not education:
            education = UserEducation(user_id=user.id)
        for k, v in education_data.items():
            setattr(education, k, v)
        session.add(education)

    session.add(user)
    session.commit()
    session.refresh(user)
    return get_me(session=session, user=user)

