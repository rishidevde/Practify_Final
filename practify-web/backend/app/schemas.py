from datetime import datetime

from pydantic import BaseModel

from app.models import ExamType


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str | None
    target_exam: ExamType
    avatar_url: str | None
    coins: int
    created_at: datetime
    profile_details: "ProfileDetailsResponse | None" = None
    education_details: "EducationDetailsResponse | None" = None


class OtpSendRequest(BaseModel):
    phone: str
    purpose: str  # signup | login


class OtpSendResponse(BaseModel):
    challenge_id: int
    dev_otp: str
    expires_at: datetime


class SignupRequest(BaseModel):
    full_name: str
    phone: str
    email: str | None = None
    password: str
    target_exam: ExamType
    challenge_id: int
    otp: str


class LoginRequest(BaseModel):
    phone: str
    password: str
    challenge_id: int
    otp: str


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    target_exam: ExamType | None = None
    avatar_url: str | None = None
    password: str | None = None
    confirm_password: str | None = None
    profile_details: "UpdateProfileDetailsRequest | None" = None
    education_details: "UpdateEducationDetailsRequest | None" = None


class QuizListItem(BaseModel):
    id: int
    exam: ExamType
    subject: str
    topic: str
    title: str
    question_count: int
    time_limit_seconds: int
    difficulty: str


class AttemptCreateRequest(BaseModel):
    quiz_id: int
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


class AttemptResponse(BaseModel):
    id: int
    quiz_id: int
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
    percentile: int | None = None
    created_at: datetime


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    full_name: str
    avatar_url: str | None
    points: int


class WishlistCreateRequest(BaseModel):
    quiz_id: int


class WishlistItemResponse(BaseModel):
    id: int
    quiz_id: int
    created_at: datetime


class ProfileDetailsResponse(BaseModel):
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


class EducationDetailsResponse(BaseModel):
    school_or_college: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    graduation_year: int | None = None
    gpa: str | None = None
    certifications: str | None = None


class UpdateProfileDetailsRequest(BaseModel):
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
    followers_count: int | None = None
    friends_count: int | None = None
    groups_count: int | None = None
    leaderboard_rank: int | None = None
    achievements: str | None = None


class UpdateEducationDetailsRequest(BaseModel):
    school_or_college: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    graduation_year: int | None = None
    gpa: str | None = None
    certifications: str | None = None


# Interview Connection Schemas
class InterviewRequestCreateRequest(BaseModel):
    exam_type: ExamType


class InterviewRequestResponse(BaseModel):
    id: int
    requester_id: int
    exam_type: ExamType
    status: str
    session_id: int | None
    created_at: datetime


class InterviewSessionResponse(BaseModel):
    id: int
    initiator_id: int
    partner_id: int
    initiator_name: str | None = None
    partner_name: str | None = None
    initiator_avatar: str | None = None
    partner_avatar: str | None = None
    exam_type: ExamType
    status: str
    room_id: str
    started_at: datetime | None
    ended_at: datetime | None
    duration_seconds: int | None
    created_at: datetime


class InterviewPartnerResponse(BaseModel):
    user_id: int
    full_name: str
    avatar_url: str | None
    target_exam: ExamType
    current_level: str | None


class InterviewMatchResponse(BaseModel):
    session_id: int
    partner: InterviewPartnerResponse
    room_id: str


class InterviewEndRequest(BaseModel):
    session_id: int


MeResponse.model_rebuild()
UpdateProfileRequest.model_rebuild()

