import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Copy, Wifi, Settings, AlertCircle } from "lucide-react";
import { useAppContext } from "../shared/AppContext";
import { InterviewMatchingPanel } from "../components/InterviewMatchingPanel";
import { endInterviewSession } from "../lib/interviewConnection";
import "./InterviewPage.css";

export function InterviewPage() {
  const { t } = useAppContext();
  const [serverIp, setServerIp] = useState("");
  const [customServerIp, setCustomServerIp] = useState("");
  const [roomId, setRoomId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [remoteIp, setRemoteIp] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);
  
  // New state for interview matching
  const [showMatchingPanel, setShowMatchingPanel] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentExamType, setCurrentExamType] = useState("JEE");
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const generateId = () => Math.random().toString(36).substring(2, 12).toUpperCase();
  
  const getActiveServerIp = () => customServerIp || serverIp;
  
  /**
   * Handle when interview match is found
   * This is called from the InterviewMatchingPanel component
   */
  const handleInterviewMatchFound = (matchData) => {
    console.log("🎉 Interview match found!", matchData);
    setShowMatchingPanel(false);
    setCurrentSessionId(matchData.sessionId);
    setRoomId(matchData.roomId);
    setStatus("Partner found! Starting video connection...");
    setStatusType("info");
    
    // Automatically start the video call with the matched room ID
    setTimeout(() => {
      startCall(matchData.roomId);
    }, 500);
  };
  
  useEffect(() => {
    // Fetch local IP
    fetch("http://localhost:8001/ip")
      .then(res => res.json())
      .then(data => {
        setServerIp(data.ip);
        setRemoteIp(data.ip);
      })
      .catch(() => {
        setServerIp("localhost");
        setRemoteIp("localhost");
      });
    
    const newPeerId = generateId();
    setPeerId(newPeerId);
    setRoomId(generateId());
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Effect to assign remote stream when video ref or stream is ready
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("📺 Assigning remote stream to video element");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  const startCall = async (roomToJoin = null) => {
    const roomIdToUse = roomToJoin || roomId;
    if (!roomIdToUse || !peerId) {
      console.error("Missing roomId or peerId");
      return;
    }
    
    const activeIp = getActiveServerIp();
    console.log(`🚀 Starting call - peerId: ${peerId}, room: ${roomIdToUse}, server: ${activeIp}:8001`);
    setStatus("Connecting to signaling server...");
    setStatusType("info");
    
    try {
      const wsUrl = `ws://${activeIp}:8001/ws/${peerId}`;
      console.log("Connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        setStatus("Connected to server");
        setStatusType("success");
        console.log("Joining room:", roomIdToUse);
        ws.send(JSON.stringify({ type: "join", room_id: roomIdToUse }));
      };
      
      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log("📨 WebSocket message received:", message.type);
        
        if (message.type === "joined") {
          console.log("Joined room with peers:", message.peers);
          if (message.peers && message.peers.length > 1) {
            const otherPeer = message.peers.find(p => p !== peerId);
            if (otherPeer) {
              setRemotePeerId(otherPeer);
              console.log("Other peer is already in room:", otherPeer);
              setStatus("Waiting for peer to initiate call...");
              setStatusType("info");
            }
          }
        } else if (message.type === "peer_joined") {
          console.log("Peer joined:", message.peer_id);
          setRemotePeerId(message.peer_id);
          // Immediately initiate call when peer joins (as the host)
          setStatus("Peer joined! Initiating call...");
          setStatusType("info");
          console.log("Initiating call to newly joined peer:", message.peer_id);
          await initiateCall(message.peer_id);
        } else if (message.type === "offer") {
          setRemotePeerId(message.from);
          console.log("Received offer from:", message.from);
          setStatus("Receiving offer...");
          setStatusType("info");
          await handleOffer(message.offer, message.from);
        } else if (message.type === "answer") {
          console.log("Received answer from:", message.from);
          await handleAnswer(message.answer);
        } else if (message.type === "ice_candidate") {
          console.log("Received ICE candidate from:", message.from);
          await handleIceCandidate(message.candidate);
        } else if (message.type === "peer_left") {
          console.log("Peer left the call");
          setStatus("🔴 Peer ended the call - Disconnecting...");
          setStatusType("error");
          setTimeout(() => {
            endCall();
          }, 1000);
        }
      };
      
      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setStatus(`Connection error: Cannot reach ${activeIp}:8001`);
        setStatusType("error");
      };
      
      ws.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsCallActive(false);
        if (status !== "Peer disconnected") {
          setStatus("Disconnected from server");
          setStatusType("warning");
        }
      };
    } catch (error) {
      console.error("Error starting call:", error);
      setStatus("Failed to start call");
      setStatusType("error");
    }
  };
  
  const initiateCall = async (targetPeerId = null) => {
    const targetId = targetPeerId || remotePeerId;
    if (!targetId) {
      console.error("Cannot initiate call: No target peer ID");
      return;
    }

    try {
      setStatus("🎥 Accessing camera and microphone...");
      setStatusType("info");
      setIsCallActive(true); // Show video screen first
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      try {
        const local_stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true 
        });
        
        console.log("Local stream acquired, remotePeerId:", remotePeerId);
        
        // Assign stream to local video ref with multiple attempts
        let attempts = 0;
        const assignStream = () => {
          if (localVideoRef.current && attempts < 5) {
            localVideoRef.current.srcObject = local_stream;
            setStatus("✅ Camera enabled - waiting for peer to join...");
            setStatusType("success");
          } else if (attempts < 5) {
            attempts++;
            setTimeout(assignStream, 100);
          }
        };
        assignStream();
        
        // Add tracks to peer connection with logging
        local_stream.getTracks().forEach((track, index) => {
          console.log(`📊 Adding track ${index}: kind=${track.kind}, enabled=${track.enabled}`);
          pc.addTrack(track, local_stream);
        });
        console.log("✅ All local tracks added to peer connection");
        
        pc.onicecandidate = (event) => {
          if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("Sending ICE candidate to:", targetId);
            wsRef.current.send(JSON.stringify({
              type: "ice_candidate",
              target_id: targetId,
              candidate: event.candidate
            }));
          }
        };
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log("Sending offer to:", targetId);
        wsRef.current.send(JSON.stringify({
          type: "offer",
          target_id: targetId,
          offer: offer
        }));
        setStatus("📱 Offer sent - waiting for peer response...");
      } catch (mediaError) {
        setStatus(`❌ Camera/Microphone error: ${mediaError.message}`);
        setStatusType("error");
        setIsCallActive(false);
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      setStatus(`❌ Error: ${error.message}`);
      setStatusType("error");
      setIsCallActive(false);
    }
  };
  
  const handleOffer = async (offer, offerFrom) => {
    try {
      console.log("Received offer from:", offerFrom);
      setStatus("📱 Peer is calling... Accessing camera and microphone...");
      setStatusType("info");
      setIsCallActive(true); // Show video screen first
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      try {
        const local_stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true 
        });
        
        console.log("Local stream acquired for answer");
        
        // Assign stream to local video ref with multiple attempts
        let attempts = 0;
        const assignStream = () => {
          if (localVideoRef.current && attempts < 5) {
            localVideoRef.current.srcObject = local_stream;
            setStatus("✅ Camera enabled - answering call...");
            setStatusType("success");
          } else if (attempts < 5) {
            attempts++;
            setTimeout(assignStream, 100);
          }
        };
        assignStream();
        
        // Add tracks to peer connection with logging
        local_stream.getTracks().forEach((track, index) => {
          console.log(`📊 Adding track ${index}: kind=${track.kind}, enabled=${track.enabled}`);
          pc.addTrack(track, local_stream);
        });
        console.log("✅ All local tracks added to peer connection for answer");
        
        pc.onicecandidate = (event) => {
          if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("Sending ICE candidate to:", offerFrom);
            wsRef.current.send(JSON.stringify({
              type: "ice_candidate",
              target_id: offerFrom,
              candidate: event.candidate
            }));
          }
        };
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log("Sending answer to:", offerFrom);
        wsRef.current.send(JSON.stringify({
          type: "answer",
          target_id: offerFrom,
          answer: answer
        }));
        setStatus("✅ Answer sent - waiting for connection...");
      } catch (mediaError) {
        setStatus(`❌ Camera/Microphone error: ${mediaError.message}`);
        setStatusType("error");
        setIsCallActive(false);
      }
    } catch (error) {
      console.error("Error handling offer:", error);
      setStatus(`❌ Error: ${error.message}`);
      setStatusType("error");
      setIsCallActive(false);
    }
  };
  
  const handleAnswer = async (answer) => {
    console.log("Handling answer, connectionState:", peerConnectionRef.current?.connectionState);
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Remote description set (answer received)");
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    } else {
      console.warn("No peer connection to handle answer");
    }
  };
  
  const handleIceCandidate = async (candidate) => {
    console.log("Handling ICE candidate");
    if (peerConnectionRef.current && candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ ICE candidate added");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    } else {
      console.warn("No peer connection or candidate");
    }
  };
  
  const createPeerConnection = () => {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };
    
    const pc = new RTCPeerConnection(config);
    
    pc.onconnectionstatechange = () => {
      console.log("🔗 Connection state:", pc.connectionState);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);
    };
    
    pc.onsignalingstatechange = () => {
      console.log("📡 Signaling state:", pc.signalingState);
    };
    
    pc.onaddstream = (event) => {
      console.log("📹 onaddstream event fired:", event.stream);
    };
    
    pc.ontrack = (event) => {
      console.log("🎬 ontrack event fired - track kind:", event.track.kind, "streams:", event.streams.length);
      if (event.streams && event.streams.length > 0) {
        console.log("Remote stream received, saving to state");
        setRemoteStream(event.streams[0]);
        setStatus("✅ Call connected! Peer video received!");
        setStatusType("success");
      }
    };
    
    return pc;
  };
  
  const endCall = () => {
    console.log("Ending call...");
    
    // Stop all video tracks
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped remote ${track.kind} track`);
      });
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log("Peer connection closed");
    }
    
    // Send leave message to other peer
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: "leave", 
        room_id: roomId 
      }));
      console.log("Leave message sent");
    }
    
    // Close websocket
    if (wsRef.current) {
      wsRef.current.close();
      console.log("WebSocket closed");
    }
    
    // Notify backend that interview session has ended
    if (currentSessionId) {
      endInterviewSession(currentSessionId).catch(err => {
        console.error("Error ending interview session:", err);
      });
    }
    
    // Reset all states
    setIsConnected(false);
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setRemotePeerId("");
    setStatus("");
    setStatusType("info");
    setShowMatchingPanel(true); // Show matching panel again for next call
    setCurrentSessionId(null);
    setRemoteStream(null);
  };
  
  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const joinExistingRoom = (e) => {
    e.preventDefault();
    if (joinRoomId) {
      console.log("Joining room:", joinRoomId);
      startCall(joinRoomId);
    }
  };
  
  return (
    <div className="interview-container">
      {/* Hero Section */}
      <section className="interview-hero">
        <div className="hero-content">
          <h1>Video Interview Practice</h1>
          <p>Connect with peers for mock interviews and practice sessions</p>
        </div>
      </section>

      {/* Interview Matching Panel - NEW CONNECTION LOGIC */}
      {showMatchingPanel && !isCallActive && (
        <section className="interview-matching-section">
          <InterviewMatchingPanel 
            onMatchFound={handleInterviewMatchFound}
            currentExamType={currentExamType}
            isVisible={true}
          />
        </section>
      )}

      {/* Main Video Section */}
      {isCallActive ? (
        <section className="interview-active">
          <div className="video-section">
            <div className="video-grid">
              <div className="video-remote">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="video-label">
                  <span></span>
                  Remote Participant
                </div>
              </div>
              <div className="video-local">
                <video ref={localVideoRef} autoPlay playsInline muted />
                <div className="video-label">
                  <span></span>
                  You
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="call-controls">
              <button
                className={`control-btn ${isMuted ? "active" : ""}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                <div className="control-btn-label">{isMuted ? "Unmute" : "Mute"}</div>
              </button>
              <button
                className={`control-btn ${isVideoOff ? "active" : ""}`}
                onClick={toggleVideo}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                <div className="control-btn-label">{isVideoOff ? "Camera" : "Camera"}</div>
              </button>
              <button 
                className="control-btn hang-up" 
                onClick={endCall} 
                title="End Call"
              >
                <PhoneOff size={28} />
              </button>
            </div>

            {/* Status */}
            {status && (
              <div className={`status-banner status-${statusType}`}>
                {statusType === "error" && <AlertCircle size={20} />}
                {statusType === "success" && <Wifi size={20} />}
                <span>{status}</span>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="interview-setup">
          <div className="setup-content">
            {/* Connection Info */}
            <div className="info-panel">
              <h2>🎥 Interview Video Call</h2>
              
              <div className="info-boxes">
                <div className="info-box">
                  <div className="info-label">📍 Your IP Address</div>
                  <div className="info-value">{serverIp}</div>
                </div>
                
                <div className="info-box">
                  <div className="info-label">🆔 Room ID</div>
                  <div className="info-value-with-copy">
                    <span className="info-value">{roomId}</span>
                    <button className="copy-btn" onClick={copyRoomId} title="Copy Room ID">
                      <Copy size={20} />
                      {copied && <span className="copy-toast">✓ Copied!</span>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Toggle */}
              {showSettings && (
                <div className="settings-panel">
                  <div className="setting-group">
                    <label>🌐 Custom Server IP Address</label>
                    <input
                      type="text"
                      value={customServerIp}
                      onChange={(e) => setCustomServerIp(e.target.value)}
                      placeholder={`e.g., ${serverIp}`}
                      className="settings-input"
                    />
                    <p className="setting-help">
                      ⚡ Enter your friend's IP address for cross-network calls (e.g., 192.168.1.100)
                    </p>
                  </div>
                </div>
              )}

              {/* Connection Modes */}
              <div className="connection-modes">
                <h3>📱 How to Connect</h3>
                
                {/* Host Your Own Call */}
                <div className="mode-card">
                  <h4>🎤 Host a Call</h4>
                  <p>Be the host and wait for others to join</p>
                  <div className="info-small">
                    <strong>Your Room ID:</strong> <code className="code-display">{roomId}</code>
                  </div>
                  <button className="start-btn" onClick={() => startCall()}>
                    <Phone size={20} />
                    Start Hosting
                  </button>
                </div>

                {/* Join Existing Call */}
                <div className="mode-card">
                  <h4>👤 Join a Call</h4>
                  <p>Paste the Room ID from your friend to join their call</p>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    placeholder="Paste Room ID here (e.g., ABC123XYZ)"
                    className="settings-input join-input"
                  />
                  <button 
                    className="start-btn" 
                    onClick={() => {
                      if (joinRoomId.trim()) {
                        startCall(joinRoomId.trim());
                      } else {
                        setStatus("Please enter a Room ID");
                        setStatusType("error");
                      }
                    }}
                    disabled={!joinRoomId.trim()}
                  >
                    <Phone size={20} />
                    Join Call
                  </button>
                </div>

                {/* Different Networks */}
                <div className="mode-card">
                  <h4>🌍 Different Networks (Optional)</h4>
                  <p>Only needed if connecting across networks</p>
                  <button 
                    className="settings-toggle"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings size={20} />
                    <span>{showSettings ? "Hide Settings" : "Custom Server IP"}</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="instructions-box">
                <h3>⚙️ Important Setup Notes</h3>
                <ul>
                  <li>Your IP Address: <strong>{serverIp}</strong></li>
                  <li>Your Room ID: <strong>{roomId}</strong></li>
                  <li>Video server must run on port <code>8001</code></li>
                  <li>Command: <code>python app/video_server.py</code></li>
                </ul>
              </div>
            </div>

            {/* Status Messages */}
            {status && (
              <div className={`status-banner status-${statusType}`}>
                {statusType === "error" && <AlertCircle size={20} />}
                {statusType === "info" && <Wifi size={20} />}
                <span>{status}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}