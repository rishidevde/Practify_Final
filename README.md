# 🎯 Practify

<p align="center">
  <strong>💻 AI-Powered Full-Stack Interview & Video Calling Platform</strong><br/>
  <em>Practice interviews, connect through real-time video calls, and simulate professional interview environments.</em>
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Python-Backend-3776AB?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/WebRTC-Video%20Calling-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/WebSocket-Realtime-black?style=for-the-badge" />
</p>

---

<p align="center">
  🎥 Real-Time Video Calling &nbsp; • &nbsp;
  ⚡ FastAPI Backend &nbsp; • &nbsp;
  🌐 Cross-Platform Support &nbsp; • &nbsp;
  💬 WebRTC Peer Connections
</p>

---

# 🚀 What is Practify?

Practify is a **full-stack interview practice and real-time video calling platform** built with a Python backend and modern JavaScript frontend.

The platform focuses on:
- 🎥 Real-time peer-to-peer video interviews
- 🌐 Cross-platform communication
- ⚡ Fast & responsive UI
- 🔗 WebRTC-based calling
- 💻 Developer-friendly setup
- 🧠 Interview simulation workflows

Designed for:
- 🎓 Students
- 💼 Job seekers
- 🧠 Interview preparation
- 👨‍💻 Developers learning WebRTC
- 🚀 Full-stack portfolio projects

---

# ✨ Major Video Calling Updates (Apr 2026)

The interview calling flow has been significantly upgraded for:
- Cleaner UI/UX
- Better cross-platform reliability
- Stronger call-state handling
- Improved multi-device support

---

# 🔥 What's New

### 🎨 UI Improvements
- Removed unnecessary setup notes panel
- Refreshed interview page color palette
- Improved layout consistency using:
  - `--bg`
  - `--panel`
  - `--gold`
  - `--brown`

---

### 🎥 Video Calling Improvements
- Stable WebRTC peer connections
- Better STUN signaling reliability
- Improved same-device multi-tab support
- Better peer targeting logic
- Reliable mute/unmute handling
- Improved join/leave notifications

---

### 🔐 Authentication & Flow
- Logged-in call guard added
- Unauthenticated users redirected to `/auth`
- Better session handling during calls

---

### 📡 Real-Time Call State Indicators
Added:
- 🟢 Connected
- 🟡 Connecting
- 🔴 Failed
- ⚫ Disconnected

---

### 👤 Better Participant Experience
- Local user ID labels
- Remote user ID labels
- Join/leave activity feed
- Automatic disconnect handling

---

# 🎛️ Current Video Call Controls

| Feature | Supported |
|---|---|
| 🎤 Mute / Unmute | ✅ |
| 📹 Camera Toggle | ✅ |
| ☎️ End Call | ✅ |
| 🌐 Connect by IP | ✅ |
| ⚙️ Custom Signaling Server IP | ✅ |

---

# 🌍 Cross-Platform Support

Practify supports:

| Platform | Status |
|---|---|
| Windows ↔ Windows | ✅ |
| Mac ↔ Mac | ✅ |
| Windows ↔ Mac | ✅ |
| Linux Support | ✅ |

---

# 📡 Same-WiFi & IP-Based Calling

### ✔️ Important Changes
- Room ID no longer required
- Users connect directly using signaling server IP
- Only shared IP needed for same-network calling

---

### 💡 Same Device Testing
You can:
- Open 2 browser tabs/windows
- Use 2 different accounts
- Connect both through same signaling IP

---

# 🏗️ System Architecture

```text
 ┌────────────────────────────┐
 │      Frontend (Vite)       │
 └─────────────┬──────────────┘
               │ HTTP / WS
               ▼
 ┌────────────────────────────┐
 │      FastAPI Backend       │
 └─────────────┬──────────────┘
               │ WebSocket
               ▼
 ┌────────────────────────────┐
 │ Video Signaling Server     │
 │ (WebRTC + STUN Handling)   │
 └────────────────────────────┘
```

---

# 📦 Prerequisites

Install the following before setup:

- Python >= 3.8
- Node.js >= 16
- npm
- Git

---

# 📁 Project Structure

```text
practify/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── video_server.py
│   │   └── routes/
│   │
│   ├── requirements.txt
│   └── .venv/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── package.json
│
└── README.md
```

---

# ▶️ Running the Project

You need to run **3 terminals simultaneously**:

| Terminal | Purpose |
|---|---|
| 1️⃣ | Video Signaling Server |
| 2️⃣ | FastAPI Backend |
| 3️⃣ | Frontend |

---

# 💻 WINDOWS SETUP

---

## 1️⃣ Terminal 1 — Video Signaling Server

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate environment
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start signaling server
python app/video_server.py
```

---

### ✅ Expected Output

```text
============================================================
🎥  VIDEO CALL SIGNALING SERVER
============================================================
📍 Connection URLs:
   localhost      → ws://127.0.0.1:8001/ws/{client_id}
   Network IP     → ws://192.168.1.100:8001/ws/{client_id}
```

---

## 2️⃣ Terminal 2 — Backend API

```bash
cd backend

.\.venv\Scripts\activate

uvicorn app.main:app --reload --port 8000
```

---

### ✅ Expected Output

```text
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## 3️⃣ Terminal 3 — Frontend

```bash
cd frontend

npm install

npm run dev
```

---

### ✅ Expected Output

```text
VITE v5.x.x ready

➜ Local: http://localhost:5173/
```

---

# 🍎 MAC SETUP

---

## 1️⃣ Terminal 1 — Video Signaling Server

```bash
cd backend

python3 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

python app/video_server.py
```

---

## 2️⃣ Terminal 2 — Backend API

```bash
cd backend

source .venv/bin/activate

uvicorn app.main:app --reload --port 8000
```

---

## 3️⃣ Terminal 3 — Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🎥 Video Calling Workflow

---

## 📱 Start Calling

1. Open browser:
```text
http://localhost:5173
```

2. Navigate to:
- Interview Page

3. You will see:
- Your IP Address
- Connection controls
- Video call controls

---

# 🧪 Testing Video Calls on Same Device

You can test locally using **4 terminals**.

---

# 🖥️ Required Terminals

| Terminal | Purpose |
|---|---|
| 1️⃣ | Video Signaling Server |
| 2️⃣ | Backend API |
| 3️⃣ | Frontend Instance #1 |
| 4️⃣ | Frontend Instance #2 |

---

## ▶️ Terminal Commands

---

### 1️⃣ Video Server

```bash
cd backend
.\.venv\Scripts\activate
python app/video_server.py
```

---

### 2️⃣ Backend

```bash
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

---

### 3️⃣ Frontend Instance #1

```bash
cd frontend
npm run dev
```

---

### 4️⃣ Frontend Instance #2

```bash
cd frontend
npm run dev -- --port 5174
```

---

# 🔗 Connection Flow

```text
Browser 1 (5173)
        │
        │ API Calls
        ▼
FastAPI Backend (8000)
        │
        │ WebSocket Signaling
        ▼
Video Signaling Server (8001)
        ▲
        │
Browser 2 (5174)
```

---

# 📱 Video Call Controls

| Button | Function |
|---|---|
| 🎤 Mute | Toggle microphone |
| 📹 Camera | Toggle video |
| ☎️ End Call | Disconnect call |

---

# 🔧 Troubleshooting

---

## ❌ Cannot Reach IP:8001
### Solutions:
- Verify correct IP
- Ensure signaling server is running
- Allow Python through firewall
- Check same network connectivity

---

## ❌ Camera/Microphone Access Denied
### Solutions:
- Allow browser permissions
- Check system privacy settings
- Restart browser

---

## ❌ Module Not Found
### Solutions:
```bash
pip install -r requirements.txt
```

---

## ❌ Port Already in Use
### Solution:
```bash
uvicorn app.main:app --reload --port 8001
```

---

# 📚 Features

---

## 🎥 Real-Time Video Calling
- P2P WebRTC
- HD video
- Crystal-clear audio
- Low latency communication

---

## 🌐 Cross-Platform Connectivity
- Windows support
- macOS support
- Linux compatibility

---

## 🎨 Modern User Interface
- Responsive design
- Real-time status indicators
- Smooth UI transitions
- Interview-focused experience

---

## ⚡ Developer-Friendly Setup
- Simple commands
- Fast local setup
- Easy debugging
- Multi-instance testing support

---

# 🚀 Future Improvements

- 🤖 AI mock interview system
- 📄 Resume analysis
- 🎙️ Speech evaluation
- 📊 Interview analytics dashboard
- ☁️ Cloud deployment support
- 🧠 AI-generated interview questions

---

# 📖 Full Setup Guide

For advanced setup & troubleshooting:

```text
VIDEO_CALLING_GUIDE.md
```

---

# ⚖️ License

MIT License — Built for educational, learning, and interview preparation purposes.

Users are responsible for ethical and appropriate usage.

---

<p align="center">
  <strong>🎯 Practice Interviews. Connect Instantly. Build Confidence.</strong>
  <br/><br/>
  <strong>Practify • Version 1.0.0</strong>
</p>
