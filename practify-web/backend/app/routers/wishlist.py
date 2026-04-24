from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, delete, select

from app.db import get_session
from app.deps import get_current_user
from app.models import Quiz, User, WishlistItem
from app.schemas import WishlistCreateRequest, WishlistItemResponse

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[WishlistItemResponse])
def list_wishlist(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[WishlistItemResponse]:
    rows = session.exec(
        select(WishlistItem)
        .where(WishlistItem.user_id == user.id)
        .order_by(WishlistItem.created_at.desc())
    ).all()
    return [WishlistItemResponse.model_validate(row, from_attributes=True) for row in rows]


@router.post("", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    payload: WishlistCreateRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> WishlistItemResponse:
    quiz = session.get(Quiz, payload.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    existing = session.exec(
        select(WishlistItem).where(
            WishlistItem.user_id == user.id, WishlistItem.quiz_id == payload.quiz_id
        )
    ).first()
    if existing:
        return WishlistItemResponse.model_validate(existing, from_attributes=True)

    row = WishlistItem(user_id=user.id, quiz_id=payload.quiz_id)
    session.add(row)
    session.commit()
    session.refresh(row)
    return WishlistItemResponse.model_validate(row, from_attributes=True)


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    quiz_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    session.exec(
        delete(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.quiz_id == quiz_id)
    )
    session.commit()
