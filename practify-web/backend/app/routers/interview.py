"""
Interview Connection Router
Handles finding and connecting users for interview practice sessions
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.deps import get_current_user
from app.db import get_session
from app.models import (
    ExamType,
    InterviewRequest,
    InterviewSession,
    User,
    UserProfile,
)
from app.schemas import (
    InterviewEndRequest,
    InterviewMatchResponse,
    InterviewPartnerResponse,
    InterviewRequestCreateRequest,
    InterviewRequestResponse,
    InterviewSessionResponse,
)

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/request", response_model=InterviewRequestResponse)
def create_interview_request(
    request_data: InterviewRequestCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create an interview request to find a practice partner
    Automatically matches with an available partner if one exists
    """
    # Check if user already has an active request
    existing_request = session.exec(
        select(InterviewRequest).where(
            (InterviewRequest.requester_id == current_user.id)
            & (InterviewRequest.status == "waiting")
        )
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active interview request",
        )

    # Look for waiting requests from other users with same exam type
    matching_request = session.exec(
        select(InterviewRequest).where(
            (InterviewRequest.exam_type == request_data.exam_type)
            & (InterviewRequest.status == "waiting")
            & (InterviewRequest.requester_id != current_user.id)
        )
    ).first()

    # Create new interview request
    new_request = InterviewRequest(
        requester_id=current_user.id,
        exam_type=request_data.exam_type,
        status="waiting",
    )
    session.add(new_request)

    # If matching request found, create interview session
    if matching_request:
        room_id = str(uuid.uuid4())
        interview_session = InterviewSession(
            initiator_id=current_user.id,
            partner_id=matching_request.requester_id,
            exam_type=request_data.exam_type,
            room_id=room_id,
            status="active",
            started_at=datetime.utcnow(),
        )
        session.add(interview_session)
        session.flush()  # Flush to get the session ID

        # Update both requests with session reference
        new_request.status = "matched"
        new_request.session_id = interview_session.id
        matching_request.status = "matched"
        matching_request.session_id = interview_session.id

    session.commit()
    session.refresh(new_request)

    return new_request


@router.get("/active", response_model=Optional[InterviewSessionResponse])
def get_active_session(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get the user's active interview session if one exists
    """
    active_session = session.exec(
        select(InterviewSession).where(
            (
                (InterviewSession.initiator_id == current_user.id)
                | (InterviewSession.partner_id == current_user.id)
            )
            & (InterviewSession.status == "active")
        )
    ).first()

    if not active_session:
        return None

    # Get partner info
    partner_id = (
        active_session.partner_id
        if active_session.initiator_id == current_user.id
        else active_session.initiator_id
    )
    partner_user = session.get(User, partner_id)
    partner_profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == partner_id)
    ).first()

    initiator_user = session.get(User, active_session.initiator_id)
    initiator_profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == active_session.initiator_id)
    ).first()

    return InterviewSessionResponse(
        id=active_session.id,
        initiator_id=active_session.initiator_id,
        partner_id=active_session.partner_id,
        initiator_name=initiator_user.full_name if initiator_user else None,
        partner_name=partner_user.full_name if partner_user else None,
        initiator_avatar=initiator_profile.profile_picture_url
        if initiator_profile
        else None,
        partner_avatar=partner_profile.profile_picture_url if partner_profile else None,
        exam_type=active_session.exam_type,
        status=active_session.status,
        room_id=active_session.room_id,
        started_at=active_session.started_at,
        ended_at=active_session.ended_at,
        duration_seconds=active_session.duration_seconds,
        created_at=active_session.created_at,
    )


@router.get("/partner", response_model=Optional[InterviewPartnerResponse])
def get_partner_info(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get information about the current interview partner
    """
    active_session = session.exec(
        select(InterviewSession).where(
            (
                (InterviewSession.initiator_id == current_user.id)
                | (InterviewSession.partner_id == current_user.id)
            )
            & (InterviewSession.status == "active")
        )
    ).first()

    if not active_session:
        return None

    partner_id = (
        active_session.partner_id
        if active_session.initiator_id == current_user.id
        else active_session.initiator_id
    )
    partner_user = session.get(User, partner_id)
    partner_profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == partner_id)
    ).first()

    return InterviewPartnerResponse(
        user_id=partner_user.id,
        full_name=partner_user.full_name,
        avatar_url=partner_profile.profile_picture_url if partner_profile else None,
        target_exam=partner_user.target_exam,
        current_level=partner_profile.current_level if partner_profile else None,
    )


@router.post("/end", response_model=dict)
def end_interview_session(
    request_data: InterviewEndRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    End an active interview session
    """
    interview_session = session.get(InterviewSession, request_data.session_id)

    if not interview_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    # Verify user is part of this session
    if (
        interview_session.initiator_id != current_user.id
        and interview_session.partner_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not part of this interview session",
        )

    # Update session
    interview_session.status = "ended"
    interview_session.ended_at = datetime.utcnow()
    if interview_session.started_at:
        duration = (interview_session.ended_at - interview_session.started_at).total_seconds()
        interview_session.duration_seconds = int(duration)

    session.add(interview_session)
    session.commit()

    return {
        "status": "success",
        "message": "Interview session ended",
        "duration_seconds": interview_session.duration_seconds,
    }


@router.delete("/request/{request_id}", response_model=dict)
def cancel_interview_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Cancel an interview request (can only be done by the requester)
    """
    interview_request = session.get(InterviewRequest, request_id)

    if not interview_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview request not found",
        )

    if interview_request.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own requests",
        )

    session.delete(interview_request)
    session.commit()

    return {"status": "success", "message": "Interview request cancelled"}


@router.get("/history", response_model=list[InterviewSessionResponse])
def get_interview_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get all past interview sessions for the user
    """
    past_sessions = session.exec(
        select(InterviewSession).where(
            (
                (InterviewSession.initiator_id == current_user.id)
                | (InterviewSession.partner_id == current_user.id)
            )
            & (InterviewSession.status == "ended")
        )
    ).all()

    result = []
    for interview_session in past_sessions:
        # Get partner info
        partner_id = (
            interview_session.partner_id
            if interview_session.initiator_id == current_user.id
            else interview_session.initiator_id
        )
        partner_user = session.get(User, partner_id)
        partner_profile = session.exec(
            select(UserProfile).where(UserProfile.user_id == partner_id)
        ).first()

        initiator_user = session.get(User, interview_session.initiator_id)
        initiator_profile = session.exec(
            select(UserProfile).where(UserProfile.user_id == interview_session.initiator_id)
        ).first()

        result.append(
            InterviewSessionResponse(
                id=interview_session.id,
                initiator_id=interview_session.initiator_id,
                partner_id=interview_session.partner_id,
                initiator_name=initiator_user.full_name if initiator_user else None,
                partner_name=partner_user.full_name if partner_user else None,
                initiator_avatar=initiator_profile.profile_picture_url
                if initiator_profile
                else None,
                partner_avatar=partner_profile.profile_picture_url
                if partner_profile
                else None,
                exam_type=interview_session.exam_type,
                status=interview_session.status,
                room_id=interview_session.room_id,
                started_at=interview_session.started_at,
                ended_at=interview_session.ended_at,
                duration_seconds=interview_session.duration_seconds,
                created_at=interview_session.created_at,
            )
        )

    return result
