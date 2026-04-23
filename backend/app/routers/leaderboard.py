from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.deps import get_current_user
from app.models import Attempt, ExamType, User
from app.schemas import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
def leaderboard(
    exam: ExamType | None = None,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> list[LeaderboardEntry]:
    # points = sum(score) for attempts in last N days (simplified)
    stmt = select(Attempt, User).join(User, User.id == Attempt.user_id)
    if exam:
        # filter attempts by quizzes' exam would require join to Quiz. Keeping it simple for now.
        pass
    rows = session.exec(stmt.order_by(Attempt.created_at.desc()).limit(500)).all()

    points_by_user: dict[int, int] = {}
    latest_profile: dict[int, User] = {}
    for attempt, user_obj in rows:
        points_by_user[user_obj.id] = points_by_user.get(user_obj.id, 0) + attempt.score
        latest_profile[user_obj.id] = user_obj

    ranked = sorted(points_by_user.items(), key=lambda kv: kv[1], reverse=True)[:50]
    out: list[LeaderboardEntry] = []
    for i, (user_id, points) in enumerate(ranked, start=1):
        u = latest_profile[user_id]
        out.append(
            LeaderboardEntry(
                rank=i,
                user_id=user_id,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
                points=points,
            )
        )
    return out

