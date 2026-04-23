from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

engine = create_engine(f"sqlite:///{settings.sqlite_path}", echo=False, connect_args={"check_same_thread": False})


def _ensure_sqlite_column(table: str, column: str, column_def: str) -> None:
    with engine.begin() as conn:
        existing_rows = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
        existing_columns = {row[1] for row in existing_rows}
        if column not in existing_columns:
            conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {column_def}")


def _run_lightweight_migrations() -> None:
    # Keep existing local SQLite databases compatible with newly added analytics/profile fields.
    _ensure_sqlite_column("attempt", "attempted_questions", "INTEGER")
    _ensure_sqlite_column("attempt", "max_score", "INTEGER")
    _ensure_sqlite_column("attempt", "goal_score", "INTEGER")
    _ensure_sqlite_column("attempt", "avg_time_per_question", "REAL")
    _ensure_sqlite_column("attempt", "time_correct_seconds", "INTEGER")
    _ensure_sqlite_column("attempt", "time_wrong_seconds", "INTEGER")
    _ensure_sqlite_column("attempt", "topic_accuracy_json", "TEXT")
    _ensure_sqlite_column("attempt", "difficulty_breakdown_json", "TEXT")
    _ensure_sqlite_column("attempt", "question_feedback_json", "TEXT")
    _ensure_sqlite_column("attempt", "behavior_insights_json", "TEXT")
    _ensure_sqlite_column("attempt", "recommendations_json", "TEXT")


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _run_lightweight_migrations()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

