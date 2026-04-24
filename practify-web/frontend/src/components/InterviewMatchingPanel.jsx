import { useEffect, useRef, useState } from "react";
import { Users, Loader, AlertCircle, UserCheck } from "lucide-react";
import { useAppContext } from "../shared/AppContext";
import {
  createInterviewRequest,
  getActiveSession,
  getPartnerInfo,
  cancelInterviewRequest,
} from "../lib/interviewConnection";
import "./InterviewMatchingPanel.css";

/**
 * InterviewMatchingPanel Component
 * Handles finding and connecting with interview partners
 * Works independently from video logic
 */
export function InterviewMatchingPanel({
  onMatchFound,
  currentExamType,
  isVisible = true,
}) {
  const { t } = useAppContext();
  const [state, setState] = useState("idle"); // idle | searching | matched | error
  const [message, setMessage] = useState("");
  const [partner, setPartner] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pollIntervalRef = useRef(null);
  const pollAttemptsRef = useRef(0);

  /**
   * Start searching for an interview partner
   */
  const handleStartSearch = async () => {
    if (!currentExamType) {
      setMessage("Please select an exam type first");
      return;
    }

    setIsLoading(true);
    setState("searching");
    setMessage("Searching for an interview partner...");
    pollAttemptsRef.current = 0;

    try {
      // Create interview request on backend
      const request = await createInterviewRequest(currentExamType);
      setRequestId(request.id);

      // If immediately matched
      if (request.status === "matched") {
        handleMatchFound(request);
      } else {
        // Start polling for match
        startPollingForMatch(request.id);
      }
    } catch (error) {
      console.error("Error creating interview request:", error);
      setState("error");
      setMessage("Failed to search for partner: " + error.message);
      setIsLoading(false);
    }
  };

  /**
   * Poll for interview match
   */
  const startPollingForMatch = (reqId) => {
    const maxAttempts = 60; // 2 minutes with 2 second intervals

    const poll = async () => {
      try {
        const session = await getActiveSession();

        if (session) {
          console.log("✅ Interview partner found!", session);
          handleMatchFound(session);
          clearInterval(pollIntervalRef.current);
        } else {
          pollAttemptsRef.current++;
          if (pollAttemptsRef.current >= maxAttempts) {
            setState("error");
            setMessage("No partner found. Request timed out.");
            clearInterval(pollIntervalRef.current);
            
            // Cancel the request
            if (reqId) {
              try {
                await cancelInterviewRequest(reqId);
              } catch (err) {
                console.error("Error cancelling request:", err);
              }
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error polling for match:", error);
      }
    };

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(poll, 2000);
    // Also run once immediately
    poll();
  };

  /**
   * Handle when a match is found
   */
  const handleMatchFound = async (sessionData) => {
    setState("matched");
    setSessionId(sessionData.id);
    setMessage("Interview partner found! ✨");

    // Get partner info
    try {
      const partnerInfo = await getPartnerInfo();
      if (partnerInfo) {
        setPartner(partnerInfo);
      }
    } catch (error) {
      console.error("Error fetching partner info:", error);
    }

    setIsLoading(false);

    // Notify parent component with match details
    if (onMatchFound) {
      onMatchFound({
        sessionId: sessionData.id,
        roomId: sessionData.room_id,
        partner: partnerInfo,
      });
    }
  };

  /**
   * Cancel search
   */
  const handleCancelSearch = async () => {
    clearInterval(pollIntervalRef.current);

    if (requestId) {
      try {
        await cancelInterviewRequest(requestId);
      } catch (error) {
        console.error("Error cancelling request:", error);
      }
    }

    setState("idle");
    setMessage("");
    setRequestId(null);
    setPartner(null);
    setSessionId(null);
    setIsLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="interview-matching-panel">
      <div className="matching-card">
        <div className="matching-header">
          <Users size={24} />
          <h3>Find Interview Partner</h3>
        </div>

        <div className="matching-content">
          {state === "idle" && (
            <div className="state-idle">
              <p>Ready to practice interviews?</p>
              <button
                onClick={handleStartSearch}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Start Searching"}
              </button>
            </div>
          )}

          {state === "searching" && (
            <div className="state-searching">
              <div className="spinner">
                <Loader size={32} className="rotating" />
              </div>
              <p>{message}</p>
              <p className="sub-text">
                Waiting for another user to join... ({pollAttemptsRef.current * 2} seconds)
              </p>
              <button
                onClick={handleCancelSearch}
                className="btn-secondary"
              >
                Cancel Search
              </button>
            </div>
          )}

          {state === "matched" && (
            <div className="state-matched">
              <UserCheck size={32} className="success-icon" />
              <p className="message">{message}</p>
              {partner && (
                <div className="partner-info">
                  {partner.avatar_url && (
                    <img src={partner.avatar_url} alt={partner.full_name} />
                  )}
                  <div className="partner-details">
                    <h4>{partner.full_name}</h4>
                    <p className="exam-type">{partner.target_exam}</p>
                    {partner.current_level && (
                      <p className="level">Level: {partner.current_level}</p>
                    )}
                  </div>
                </div>
              )}
              <p className="ready-text">Ready to start video call!</p>
            </div>
          )}

          {state === "error" && (
            <div className="state-error">
              <AlertCircle size={32} />
              <p>{message}</p>
              <button
                onClick={handleCancelSearch}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="matching-status">
          <span className="status-badge">{state}</span>
        </div>
      </div>
    </div>
  );
}
