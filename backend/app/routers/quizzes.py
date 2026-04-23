from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.deps import get_current_user
from app.models import ExamType, Quiz, User
from app.schemas import QuizListItem

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("", response_model=list[QuizListItem])
def list_quizzes(
    exam: ExamType | None = None,
    subject: str | None = None,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> list[QuizListItem]:
    stmt = select(Quiz)
    if exam:
        stmt = stmt.where(Quiz.exam == exam)
    if subject:
        stmt = stmt.where(Quiz.subject == subject)
    quizzes = session.exec(stmt.order_by(Quiz.created_at.desc())).all()
    return [QuizListItem.model_validate(q, from_attributes=True) for q in quizzes]

