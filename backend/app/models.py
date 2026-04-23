from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class ExamType(str, Enum):
    JEE = "JEE"
    NEET = "NEET"
    NDA = "NDA"
    NDA_CDS = "NDA/CDS"
    GATE = "GATE"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    full_name: str
    phone: str = Field(index=True, unique=True)
    email: str | None = Field(default=None, index=True)

    password_hash: str
    target_exam: ExamType = Field(default=ExamType.JEE)
    avatar_url: str | None = None

    coins: int = 0


class OtpChallenge(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    phone: str = Field(index=True)
    purpose: str = Field(index=True)  # "signup" | "login"

    otp_code: str
    expires_at: datetime
    used: bool = False


class Quiz(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    exam: ExamType = Field(index=True)
    subject: str = Field(index=True)
    topic: str = Field(index=True)

    title: str
    question_count: int = 20
    time_limit_seconds: int = 20 * 60
    difficulty: str = "Mixed"  # Easy | Medium | Hard | Mixed


class Attempt(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    user_id: int = Field(index=True, foreign_key="user.id")
    quiz_id: int = Field(index=True, foreign_key="quiz.id")

    score: int
    correct: int
    wrong: int
    skipped: int
    time_taken_seconds: int
    attempted_questions: int | None = None
    max_score: int | None = None
    goal_score: int | None = None
    avg_time_per_question: float | None = None
    time_correct_seconds: int | None = None
    time_wrong_seconds: int | None = None
    topic_accuracy_json: str | None = None
    difficulty_breakdown_json: str | None = None
    question_feedback_json: str | None = None
    behavior_insights_json: str | None = None
    recommendations_json: str | None = None


class WishlistItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    user_id: int = Field(index=True, foreign_key="user.id")
    quiz_id: int = Field(index=True, foreign_key="quiz.id")


class UserProfile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id", unique=True)

    profile_picture_url: str | None = None
    gender: str | None = None
    date_of_birth: str | None = None
    bio: str | None = None

    street: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    zip_code: str | None = None

    language_preferences: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None

    current_level: str | None = None
    weak_areas: str | None = None
    strong_areas: str | None = None
    study_hours_per_day: float | None = None
    preferred_difficulty: str | None = None

    followers_count: int = 0
    friends_count: int = 0
    groups_count: int = 0
    leaderboard_rank: int | None = None
    achievements: str | None = None


class UserEducation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id", unique=True)

    school_or_college: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    graduation_year: int | None = None
    gpa: str | None = None
    certifications: str | None = None

