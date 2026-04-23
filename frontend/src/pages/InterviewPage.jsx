import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Maximize, MessageCircle, Mic, MicOff, PhoneOff, Settings, Users, Video, VideoOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../lib/api";
import { isLoggedIn } from "../lib/auth";
import "./InterviewPage.css";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function InterviewPage() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [userName, setUserName] = useState("You");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [inCall, setInCall] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  
  // Room and Signaling State
  const [roomID, setRoomID] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [serverIp, setServerIp] = useState("127.0.0.1");
  const [showSettings, setShowSettings] = useState(false);
  const [clientId] = useState(() => `client-${Math.random().toString(36).slice(2, 6)}`);
  const [participants, setParticipants] = useState([]);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const [scheduleDateTime, setScheduleDateTime] = useState("");

  const calendarLink = useMemo(() => {
    if (!scheduleDateTime) return "";
    const start = new Date(scheduleDateTime);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const toUTC = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const title = encodeURIComponent(`Practify Interview Room - ${roomID}`);
    const details = encodeURIComponent(`Meeting ID: ${roomID}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toUTC(start)}/${toUTC(end)}&details=${details}`;
  }, [scheduleDateTime, roomID]);

  // Initial setup
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth");
      return undefined;
    }

    getMe()
      .then((profile) => {
        setUserName(profile.full_name || `User ${profile.id}`);
      })
      .catch(() => {
        setUserName("You");
      });

    return () => {
      cleanupMedia();
    };
  }, [navigate]);

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRemoteStream(null);
  }, []);

  // Attach streams to video elements using callback refs for robustness
  const setLocalVideoRef = useCallback((node) => {
    if (node && localStreamRef.current) {
      node.srcObject = localStreamRef.current;
      node.play().catch(e => console.warn("Local video play failed:", e));
    }
    localVideoRef.current = node;
  }, []);

  const setRemoteVideoRef = useCallback((node) => {
    if (node && remoteStream) {
      node.srcObject = remoteStream;
      node.play().catch(e => console.warn("Remote video play failed:", e));
    }
    remoteVideoRef.current = node;
  }, [remoteStream]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const createPeerConnection = useCallback((targetId) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: "ice_candidate",
          target_id: targetId,
          candidate: event.candidate
        }));
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log("Signaling State:", pc.signalingState);
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind, "from streams:", event.streams.length);
      setRemoteStream(event.streams[0]);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const initSignaling = useCallback(async () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${serverIp}:8001/ws/${clientId}`;
    
    console.log(`Connecting to signaling server at ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to signaling server");
      socket.send(JSON.stringify({
        type: "join",
        room_id: roomID
      }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message:", data.type);

      switch (data.type) {
        case "peer_joined":
          // If we are already here, we initiate the call to the newcomer
          const pc = createPeerConnection(data.peer_id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.send(JSON.stringify({
            type: "offer",
            target_id: data.peer_id,
            offer: offer
          }));
          setParticipants(prev => [...new Set([...prev, "Remote Peer"])]);
          break;

        case "offer":
          const pcOffer = createPeerConnection(data.from);
          await pcOffer.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pcOffer.createAnswer();
          await pcOffer.setLocalDescription(answer);
          socket.send(JSON.stringify({
            type: "answer",
            target_id: data.from,
            answer: answer
          }));
          setParticipants(prev => [...new Set([...prev, "Remote Peer"])]);
          break;

        case "answer":
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
          break;

        case "ice_candidate":
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;

        case "peer_left":
          setRemoteStream(null);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          setParticipants(prev => prev.filter(p => p !== "Remote Peer"));
          break;

        default:
          break;
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setCameraStatus("Signaling server connection failed. Check IP and port 8001.");
    };

    socket.onclose = () => {
      console.log("Disconnected from signaling server");
    };
  }, [clientId, roomID, serverIp, createPeerConnection]);

  const ensureLocalMedia = async () => {
    if (!localStreamRef.current) {
      try {
        console.log("Requesting camera and microphone...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Media stream captured:", stream.id, "Tracks:", stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
        localStreamRef.current = stream;
      } catch (err) {
        console.error("Media access error:", err);
        throw err;
      }
    }
    setMediaReady(true);
  };

  const enableCamera = async () => {
    try {
      await ensureLocalMedia();
      setCameraStatus("Camera and microphone are ready.");
    } catch (err) {
      setCameraStatus("Unable to access camera. Please check permissions.");
    }
  };

  const startCall = async () => {
    try {
      await ensureLocalMedia();
      setInCall(true);
      setParticipants([`${userName} (You)`]);
      setElapsedTime(0);
      setCameraStatus("");
      
      // Start Signaling
      initSignaling();

      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setCameraStatus("Please enable camera before starting.");
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const shareScreen = async () => {
    if (isSharingScreen) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      screenStreamRef.current = null;
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsSharingScreen(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsSharingScreen(true);
    } catch (err) {
      console.error("Screen sharing failed:", err);
    }
  };

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: "You", text }]);
    setChatText("");
  };

  const saveSchedule = () => {
    if (!scheduleDateTime) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "System", text: `Meeting scheduled for ${new Date(scheduleDateTime).toLocaleString()}` },
    ]);
  };

  const endCall = () => {
    cleanupMedia();
    setInCall(false);
    setIsRecording(false);
    setIsSharingScreen(false);
    navigate("/interview");
  };

  if (!inCall) {
    return (
      <div className="interview-lobby glass-card">
        <header className="lobby-header">
          <h2>Practify Interview Room</h2>
          <button className="settings-toggle-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} />
          </button>
        </header>
        
        {showSettings && (
          <div className="settings-panel glass-card">
            <h3>Signaling Settings</h3>
            <label>
              Signaling Server IP
              <input 
                type="text" 
                value={serverIp} 
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="e.g. 192.168.1.100"
              />
            </label>
            <p className="hint">Set this to the IP showing in the video server terminal.</p>
          </div>
        )}

        <p className="muted">Enable camera, then start or join a meeting.</p>

        <div className="interview-lobby-grid">
          <section className="glass-card">
            <h3>Meeting Details</h3>
            <div className="field-group">
              <label>Room ID</label>
              <input 
                type="text" 
                value={roomID} 
                onChange={(e) => setRoomID(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
              />
            </div>
            <div className="inline-actions">
              <button className="ghost-btn compact" onClick={enableCamera}>Enable Camera</button>
              <button className="cta-btn compact" onClick={startCall} disabled={!mediaReady}>Start Call</button>
            </div>
            {cameraStatus ? <p className="status-msg">{cameraStatus}</p> : null}
          </section>

          <section className="glass-card">
            <h3>Schedule meeting</h3>
            <label>
              Date and time
              <input type="datetime-local" value={scheduleDateTime} onChange={(e) => setScheduleDateTime(e.target.value)} />
            </label>
            <div className="inline-actions">
              <button className="ghost-btn compact" onClick={saveSchedule}>Schedule</button>
              <a className="cta-btn compact" href={calendarLink || "#"} target="_blank" rel="noreferrer">
                Add to Calendar
              </a>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const isInterviewerJoined = !!remoteStream;
  const isCandidateJoined = false; // For now, we only support 1:1

  return (
    <div className="zoom-call-container">
      <header className="zoom-topbar">
        <div className="zoom-topbar-left">
          <div className="zoom-meeting-icon">
            <Users size={16} />
          </div>
          <span className="zoom-meeting-title">Practify Interview: {roomID}</span>
        </div>
        <div className="zoom-topbar-right">
          <span className="zoom-timer">{formatTime(elapsedTime)}</span>
          <div className="zoom-participants-badge">
            <Users size={14} />
            <span>{participants.length}</span>
          </div>
        </div>
      </header>

      <main className="zoom-video-area">
        <div className={`zoom-video-grid ${remoteStream ? 'dual-video' : 'single-video'}`}>
          {/* Local Video */}
          <div className="zoom-video-tile zoom-tile-local">
            <video
              ref={setLocalVideoRef}
              autoPlay
              playsInline
              muted
              className="zoom-video-element"
            />
            {isVideoOff && (
              <div className="zoom-video-off-overlay">
                <div className="zoom-avatar-circle">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="zoom-video-name-tag">
              <span className="zoom-live-dot" />
              {isSharingScreen ? `${userName} (Sharing screen)` : `${userName} (You)`}
            </div>
            {isMuted && (
              <div className="zoom-muted-indicator">
                <MicOff size={14} />
              </div>
            )}
          </div>

          {/* Remote Video */}
          {remoteStream && (
            <div className="zoom-video-tile zoom-tile-remote">
              <video
                ref={setRemoteVideoRef}
                autoPlay
                playsInline
                className="zoom-video-element"
              />
              <div className="zoom-video-name-tag">
                <span className="zoom-live-dot" />
                Remote Participant
              </div>
            </div>
          )}

          {!remoteStream && (
            <div className="zoom-video-tile zoom-tile-waiting">
              <div className="waiting-placeholder">
                <Users size={48} className="waiting-icon" />
                <p>Waiting for someone to join...</p>
                <p className="room-hint">Share Room ID: <b>{roomID}</b></p>
              </div>
            </div>
          )}
        </div>

        <aside className="zoom-info-panel">
            <div className="zoom-side-panel">
              <h4>Participants</h4>
              <ul className="participants-list">
                <li className="participant-item">
                  <span className="status-dot online"></span>
                  {userName} (You)
                </li>
                <li className="participant-item">
                  <span className={`status-dot ${remoteStream ? "online" : "waiting"}`}></span>
                  {remoteStream ? "Interviewer" : "Interviewer (Waiting)"}
                </li>
                <li className="participant-item">
                  <span className="status-dot waiting"></span>
                  Candidate (Waiting)
                </li>
              </ul>
            </div>
          <div className="zoom-side-panel">
            <h4><MessageCircle size={14} /> Chat</h4>
            <div className="zoom-chat-box">
              {chatMessages.map((message) => (
                <p key={message.id}>
                  <b>{message.sender}:</b> {message.text}
                </p>
              ))}
            </div>
            <div className="zoom-chat-input">
              <input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Type message..." />
              <button className="ghost-btn compact" onClick={sendChat}>Send</button>
            </div>
          </div>
        </aside>
      </main>

      <footer className="zoom-controls-bar">
        <div className="zoom-controls-center">
          <button
            className={`zoom-ctrl-btn ${isMuted ? "zoom-ctrl-off" : ""}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            <div className="zoom-ctrl-icon">
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </div>
            <span className="zoom-ctrl-label">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
          <button
            className={`zoom-ctrl-btn ${isVideoOff ? "zoom-ctrl-off" : ""}`}
            onClick={toggleVideo}
            title={isVideoOff ? "Start Video" : "Stop Video"}
          >
            <div className="zoom-ctrl-icon">
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </div>
            <span className="zoom-ctrl-label">{isVideoOff ? "Start Video" : "Stop Video"}</span>
          </button>
          <button className={`zoom-ctrl-btn ${isSharingScreen ? "zoom-ctrl-off" : ""}`} onClick={shareScreen} title="Share Screen">
            <div className="zoom-ctrl-icon">
              <Video size={22} />
            </div>
            <span className="zoom-ctrl-label">{isSharingScreen ? "Stop Share" : "Share Screen"}</span>
          </button>
          <button className={`zoom-ctrl-btn ${isRecording ? "zoom-ctrl-off" : ""}`} onClick={() => setIsRecording((s) => !s)} title="Record Meeting">
            <div className="zoom-ctrl-icon">
              <MessageCircle size={22} />
            </div>
            <span className="zoom-ctrl-label">{isRecording ? "Stop Record" : "Record Meeting"}</span>
          </button>
          <button className="zoom-ctrl-btn" onClick={toggleFullScreen} title="Full screen">
            <div className="zoom-ctrl-icon">
              <Maximize size={22} />
            </div>
            <span className="zoom-ctrl-label">Full Screen</span>
          </button>
          <button
            className="zoom-ctrl-btn zoom-ctrl-end"
            onClick={endCall}
            title="End Call"
          >
            <div className="zoom-ctrl-icon">
              <PhoneOff size={22} />
            </div>
            <span className="zoom-ctrl-label">End Call</span>
          </button>
        </div>
      </footer>
    </div>
  );
}