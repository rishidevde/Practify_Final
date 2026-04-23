from sqlmodel import Session, select

from app.models import ExamType, Quiz, User


def seed_if_empty(session: Session) -> None:
    # We intentionally do NOT seed users (auth flows create users via API).
    # We *do* ensure a baseline quiz catalog exists on every startup.
    _ensure_quizzes(session)


def _ensure_quizzes(session: Session) -> None:
    removed_titles = {
        "Types of Sets",
        "Compound Angles",
        "Motion in a Straight Line",
        "Reaction Mechanisms Sprint",
    }

    removed = 0
    for title in removed_titles:
        existing = session.exec(select(Quiz).where(Quiz.title == title)).first()
        if not existing:
            continue
        session.delete(existing)
        removed += 1

    quizzes: list[Quiz] = [
        Quiz(exam=ExamType.NEET, subject="Biology", topic="Genetics", title="Mendelian Genetics Drill", difficulty="Medium"),
        Quiz(exam=ExamType.NEET, subject="Physics", topic="Current Electricity", title="Ohm's Law & Circuits", difficulty="Easy"),
        Quiz(
            exam=ExamType.NEET,
            subject="Physics",
            topic="Sectional",
            title="NEET Physics Sectional Mock Test",
            question_count=50,
            time_limit_seconds=50 * 60,
            difficulty="Mixed",
        ),
        Quiz(
            exam=ExamType.NEET,
            subject="Chemistry",
            topic="Sectional",
            title="NEET Chemistry Sectional Mock Test",
            question_count=50,
            time_limit_seconds=50 * 60,
            difficulty="Mixed",
        ),
        Quiz(
            exam=ExamType.NEET,
            subject="Biology",
            topic="Sectional",
            title="NEET Biology Sectional Mock Test",
            question_count=50,
            time_limit_seconds=50 * 60,
            difficulty="Mixed",
        ),
        Quiz(exam=ExamType.NDA_CDS, subject="GAT", topic="Current Affairs", title="Weekly Current Affairs Mock", difficulty="Mixed"),
        Quiz(exam=ExamType.NDA_CDS, subject="Maths", topic="Algebra", title="Quadratic Equations & Expressions", difficulty="Medium"),
        Quiz(
            exam=ExamType.NDA_CDS,
            subject="Maths",
            topic="Sectional",
            title="CDS / NDA Mathematics Sectional Mock Test",
            question_count=50,
            time_limit_seconds=50 * 60,
            difficulty="Mixed",
        ),
        Quiz(
            exam=ExamType.NDA_CDS,
            subject="English",
            topic="Sectional",
            title="CDS / NDA English Sectional Mock Test",
            question_count=50,
            time_limit_seconds=50 * 60,
            difficulty="Mixed",
        ),
        Quiz(
            exam=ExamType.NDA_CDS,
            subject="GK",
            topic="Sectional",
            title="CDS / NDA GK Sectional Mock Test",
            question_count=50,
            time_limit_seconds=50 * 60,
            difficulty="Mixed",
        ),
        Quiz(exam=ExamType.GATE, subject="Aptitude", topic="Quant", title="Aptitude: Arithmetic Mix", difficulty="Easy"),
        Quiz(exam=ExamType.GATE, subject="Core", topic="Digital Logic", title="Gates & Boolean Algebra", difficulty="Medium"),
        # New mock test requested
        Quiz(
            exam=ExamType.JEE,
            subject="Physics",
            topic="Sectional",
            title="JEE Physics Sectional Mock Test",
            question_count=20,
            time_limit_seconds=30 * 60,
            difficulty="Mixed",
        ),
        Quiz(
            exam=ExamType.JEE,
            subject="Chemistry",
            topic="Sectional",
            title="JEE Chemistry Sectional Mock Test",
            question_count=20,
            time_limit_seconds=30 * 60,
            difficulty="Mixed",
        ),
        Quiz(
            exam=ExamType.JEE,
            subject="Maths",
            topic="Sectional",
            title="JEE Mathematics Sectional Mock Test",
            question_count=20,
            time_limit_seconds=30 * 60,
            difficulty="Mixed",
        ),
    ]

    added = 0
    for q in quizzes:
        exists = session.exec(select(Quiz).where(Quiz.title == q.title)).first()
        if exists:
            continue
        session.add(q)
        added += 1

    if removed or added:
        session.commit()

