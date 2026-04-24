/**
 * Interview Connection Service
 * Handles finding and connecting with interview partners through the backend
 */

import { apiCall } from "./api";

/**
 * Create an interview request to find a practice partner
 * @param {string} examType - The exam type (JEE, NEET, NDA, etc.)
 * @returns {Promise<Object>} Interview request response
 */
export async function createInterviewRequest(examType) {
  return apiCall("/interview/request", {
    method: "POST",
    body: JSON.stringify({ exam_type: examType }),
  });
}

/**
 * Get the user's active interview session if one exists
 * @returns {Promise<Object|null>} Interview session details or null
 */
export async function getActiveSession() {
  try {
    return await apiCall("/interview/active", {
      method: "GET",
    });
  } catch (error) {
    if (error.message?.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get information about the current interview partner
 * @returns {Promise<Object|null>} Partner information or null
 */
export async function getPartnerInfo() {
  try {
    return await apiCall("/interview/partner", {
      method: "GET",
    });
  } catch (error) {
    if (error.message?.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * End an active interview session
 * @param {number} sessionId - The session ID to end
 * @returns {Promise<Object>} Confirmation response
 */
export async function endInterviewSession(sessionId) {
  return apiCall("/interview/end", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

/**
 * Cancel an interview request
 * @param {number} requestId - The request ID to cancel
 * @returns {Promise<Object>} Confirmation response
 */
export async function cancelInterviewRequest(requestId) {
  return apiCall(`/interview/request/${requestId}`, {
    method: "DELETE",
  });
}

/**
 * Get interview session history for the user
 * @returns {Promise<Array>} List of past interview sessions
 */
export async function getInterviewHistory() {
  return apiCall("/interview/history", {
    method: "GET",
  });
}

/**
 * Poll for active session (used to check if a match was found)
 * @param {number} pollInterval - Time in ms between polls (default 2000)
 * @param {number} maxAttempts - Maximum number of poll attempts (default 60 = 2 mins)
 * @returns {Promise<Object>} Interview session when found
 */
export async function pollForMatch(pollInterval = 2000, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const session = await getActiveSession();
    if (session) {
      return session;
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error("No interview partner found within timeout period");
}
