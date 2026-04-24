from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.deps import get_current_user
from app.models import Attempt, User
from app.schemas import AttemptCreateRequest, AttemptResponse

router = APIRouter(prefix="/attempts", tags=["attempts"])


def _with_percentile(attempt: Attempt, session: Session) -> AttemptResponse:
    all_for_quiz = session.exec(select(Attempt.score).where(Attempt.quiz_id == attempt.quiz_id)).all()
    percentile = None
    if all_for_quiz:
        below_or_equal = sum(1 for score in all_for_quiz if score <= attempt.score)
        percentile = int(round((below_or_equal / len(all_for_quiz)) * 100))
    payload = attempt.model_dump()
    payload["percentile"] = percentile
    return AttemptResponse.model_validate(payload)


@router.post("", response_model=AttemptResponse)
def create_attempt(
    payload: AttemptCreateRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> AttemptResponse:
    attempt = Attempt(user_id=user.id, **payload.model_dump())
    session.add(attempt)
    session.commit()
    session.refresh(attempt)
    return _with_percentile(attempt, session)


@router.get("", response_model=list[AttemptResponse])
def list_my_attempts(
    limit: int = 20,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[AttemptResponse]:
    attempts = session.exec(
        select(Attempt).where(Attempt.user_id == user.id).order_by(Attempt.created_at.desc()).limit(limit)
    ).all()
    return [_with_percentile(a, session) for a in attempts]

