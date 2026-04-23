# Practify

Practify is a full-stack web application with a Python backend and a modern JavaScript frontend.

---

## Video Calling Updates (Apr 2026)

The interview calling flow has been upgraded for cleaner UX, better cross-platform reliability, and stronger call-state handling.

### What Changed

- Removed the **Important Setup Notes** panel from the interview UI.
- Refreshed interview page colors to match the app palette (`--bg`, `--panel`, `--gold`, `--brown`) for a cleaner and more consistent design.
- Kept WebRTC peer calling + STUN signaling compatible for **Mac <-> Windows** users over IP-only signaling.
- Added logged-in call guard in interview flow; unauthenticated users are redirected to `/auth`.
- Added clear **User ID labels** on local and remote video cards during calls.
- Added reliable **Mute / Unmute** behavior for local microphone track control.
- Added visible **connection state** badge (`connecting`, `connected`, `disconnected`, `failed`).
- Added in-call **join/leave notification feed** for participant activity.
- Improved peer targeting logic to support two accounts in two tabs on the same device joining the same IP lobby reliably.
- Added leave behavior so when one participant exits, the other is notified and redirected back to home/dashboard flow.

### Current Call Controls

- Mute / Unmute microphone
- Camera on/off
- End call
- Connect by IP (no Room ID field)
- Optional custom signaling server IP for network-based calls

### Cross-Platform and Same-WiFi Notes

- Works across macOS and Windows as long as both clients can reach the signaling server IP (`ws://<ip>:8001`).
- Room ID is no longer required in the interview UI.
- Both users only need to connect to the same signaling server IP and click **Connect by IP**.
- For same-device testing, open two browser tabs/windows with different logged-in accounts and connect both tabs by IP.
- For same-WiFi testing, share only the host machine IP address.

---

---

## 🚀 Getting Started

Follow these steps to run the project locally.

---

## 📦 Prerequisites

Make sure you have installed:

- Python (>= 3.8)
- Node.js (>= 16)
- npm (comes with Node.js)
- Git

---

## 📁 Project Structure




---

## ▶️ Running the Project

You need to run **3 terminals** simultaneously for full functionality (1 for video server, 1 for backend, 1 for frontend).

---
D:\B\Practify-main (1)\Practify-main\practify-web\backend

# 💻 WINDOWS SETUP

## 🔹 Terminal 1 — Video Signaling Server (Windows)

```bash
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start video signaling server
python app/video_server.py
```

**Expected Output:**
```
============================================================
🎥  VIDEO CALL SIGNALING SERVER
============================================================
📍 Connection URLs:
   localhost      → ws://127.0.0.1:8001/ws/{client_id}
   Network IP     → ws://192.168.1.100:8001/ws/{client_id}

💡 For Windows & Mac connection:
   → Share your IP: 192.168.1.100
```

**Note your IP address** (e.g., `192.168.1.100`)

---

## 🔹 Terminal 2 — Backend Server (Windows)

```bash
cd backend

# Activate virtual environment
.\.venv\Scripts\activate

# Start FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## 🔹 Terminal 3 — Frontend (Windows)

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## 🎥 VIDEO CALLING on Windows

1. **Open Browser:** `http://localhost:5173`
2. **Go to:** Interview page
3. **You will see:**
   - ✅ Local IP Address: `192.168.1.100` (your Windows IP)
   - ✅ Your Room ID: `ABC123XYZ` (auto-generated)
   - ✅ Buttons to customize server IP

### Same Network (Windows ↔ Windows)
- Share your **Room ID** with friend
- Friend clicks **"Start Call"** with your Room ID
- Click **"Start Call"** when ready
- ✅ Video connects!

### Cross Network (Windows ↔ Mac)
- Share your **IP Address**: `192.168.1.100`
- Share your **Room ID**: `ABC123XYZ`
- Friend enters your IP in **"Custom Server IP"** field
- Friend enters your **Room ID**
- Friend clicks **"Start Call"**
- Click **"Start Call"** when notified
- ✅ Video connects!

---

---

# 🍎 MAC SETUP

## 🔹 Terminal 1 — Video Signaling Server (Mac)

```bash
cd backend

# Create virtual environment (first time only)
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start video signaling server
python app/video_server.py
```

**Expected Output:**
```
============================================================
🎥  VIDEO CALL SIGNALING SERVER
============================================================
📍 Connection URLs:
   localhost      → ws://127.0.0.1:8001/ws/{client_id}
   Network IP     → ws://192.168.1.50:8001/ws/{client_id}

💡 For Windows & Mac connection:
   → Share your IP: 192.168.1.50
```

**Note your IP address** (e.g., `192.168.1.50`)

---

## 🔹 Terminal 2 — Backend Server (Mac)

```bash
cd backend

# Activate virtual environment
source .venv/bin/activate

# Start FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## 🔹 Terminal 3 — Frontend (Mac)

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## 🎥 VIDEO CALLING on Mac

1. **Open Browser:** `http://localhost:5173`
2. **Go to:** Interview page
3. **You will see:**
   - ✅ Local IP Address: `192.168.1.50` (your Mac IP)
   - ✅ Your Room ID: `XYZ789ABC` (auto-generated)
   - ✅ Buttons to customize server IP

### Same Network (Mac ↔ Mac)
- Share your **Room ID** with friend
- Friend clicks **"Start Call"** with your Room ID
- Click **"Start Call"** when ready
- ✅ Video connects!

### Cross Network (Mac ↔ Windows)
- Share your **IP Address**: `192.168.1.50`
- Share your **Room ID**: `XYZ789ABC`
- Friend enters your IP in **"Custom Server IP"** field
- Friend enters your **Room ID**
- Friend clicks **"Start Call"**
- Click **"Start Call"** when notified
- ✅ Video connects!

---

---

## 🔧 Troubleshooting

### ❌ "Connection error: Cannot reach IP:8001"
- Verify IP address is correct (not 127.0.0.1)
- Check firewall allows Python
- Ensure video server is running in Terminal 1
- Check both machines are on same network (for local) or have internet

### ❌ "Cannot access camera/microphone"
- Grant browser permission when asked
- Check System Preferences → Security & Privacy → Camera/Microphone

### ❌ "Module not found" error
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

### ❌ "Port 8000 already in use"
- Close other apps using port 8000
- Or change port: `uvicorn app.main:app --reload --port 8001`

---

## 📚 Features

✨ **Full Video Calling**
- P2P WebRTC connections
- HD video (up to 1280x720)
- Crystal clear audio
- Mute/Camera controls

🌐 **Cross-Platform**
- Windows ↔ Windows ✅
- Mac ↔ Mac ✅
- Windows ↔ Mac ✅
- Linux compatible

🎨 **Modern UI**
- Beautiful gradient design
- Responsive layout (mobile, tablet, desktop)
- Real-time status updates
- Easy IP/Room ID sharing

🚀 **Easy Setup**
- Same code for all platforms
- Auto-generates Room IDs
- Shows IP automatically
- Clear on-screen instructions

---

## 🎬 Testing Video Calling on Same Device (4 Terminals)

Want to test video calling without another device? Run **4 terminals simultaneously** to test both instances locally!

### 📋 Complete Terminal Setup

Open **4 PowerShell/Command Prompt windows** in the project root and run these commands:

#### **Terminal 1 — Video Signaling Server**
```powershell
cd backend
.\.venv\Scripts\activate
python app/video_server.py
```

**Expected Output:**
```
============================================================
🎥  VIDEO CALL SIGNALING SERVER
============================================================
📍 Connection URLs:
   localhost      → ws://127.0.0.1:8001/ws/{client_id}
   Network IP     → ws://192.168.1.xxx:8001/ws/{client_id}
```

#### **Terminal 2 — Backend API Server**
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

#### **Terminal 3 — Frontend Instance #1 (Port 5173)**
```powershell
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

#### **Terminal 4 — Frontend Instance #2 (Port 5174)**
```powershell
cd frontend
npm run dev -- --port 5174
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5174/
```

---

### 🧪 Testing Video Call (Step-by-Step)

#### **Step 1: Open Two Browsers**
- **Browser 1**: Open `http://localhost:5173`
- **Browser 2**: Open `http://localhost:5174`

#### **Step 2: Navigate to Interview Page**
In both browsers:
1. Log in or sign up
2. Go to **"Interview"** page from sidebar

#### **Step 3: Host a Call (Browser 1)**
1. Look at **"Your Connection Details"**
2. Copy your **Room ID** (e.g., `ABC123XYZ`)
3. Click **"Start Hosting"** button
4. Status should change to **"Connected to server"** ✅

#### **Step 4: Join the Call (Browser 2)**
1. Find the **"Join a Call"** section
2. Paste the **Room ID** from Browser 1 in the input field
3. Click **"Join Call"** button
4. Wait for connection...

#### **Step 5: Video Connects!**
- Both browsers will show **video grid** with your camera
- You'll see yourself and the "remote participant" (other browser)
- Use **Mute/Camera buttons** to control your stream
- Click **End Call** to disconnect

---

### 📱 Video Call Controls

| Button | Function |
|--------|----------|
| 🎤 Mute | Toggle audio on/off |
| 📹 Camera | Toggle video on/off |
| ☎️ End Call | Disconnect and stop call |

---

### ⚡ Quick Copy-Paste Commands

If you want to copy-paste all commands at once, here's the reference:

```bash
# Terminal 1
cd backend; .\.venv\Scripts\activate; python app/video_server.py

# Terminal 2
cd backend; .\.venv\Scripts\activate; uvicorn app.main:app --reload --port 8000

# Terminal 3
cd frontend; npm run dev

# Terminal 4
cd frontend; npm run dev -- --port 5174
```

---

### 🔗 Connection Overview

```
Browser 1 (5173)          Backend Server          Browser 2 (5174)
      |                   (Port 8000)                    |
      |--------API Calls------->|<------API Calls---------|
      |                         |                        |
      |                                                  |
      |----------WebSocket (Port 8001)----------->|
      |<----------WebSocket (Port 8001)-----------|
      |      Video Signaling Server (P2P)         |
```

---

### ✅ What You Should See

| Stage | Browser 1 | Browser 2 |
|-------|-----------|----------|
| Start | "Your Room ID: ABC123" | "Your Room ID: XYZ789" |
| Host Click | Status: "Connected" | Status: Waiting |
| Join Click | Status: "Waiting" | Status: "Connecting..." |
| Connected | 2 Video Feeds | 2 Video Feeds ✅ |

---

### 🐛 Troubleshooting Multi-Terminal Setup

| Problem | Solution |
|---------|----------|
| Backend says "Port 8000 already in use" | Kill previous backend: `Get-Process python \| Stop-Process` |
| Video server won't start on port 8001 | Check firewall allows Python or kill process using port 8001 |
| Browser can't reach API (CORS error) | Make sure Backend (Terminal 2) is running |
| "Unable to send OTP" | Backend CORS is configured for both ports 5173 and 5174 ✅ |
| Video doesn't connect | Ensure **all 4 terminals** are running without errors |

---

## 📖 Full Setup Guide

For detailed troubleshooting and advanced setup, see: [VIDEO_CALLING_GUIDE.md](VIDEO_CALLING_GUIDE.md)








# TERMINAL 1 - Video Server
cd backend
.\.venv\Scripts\activate
python app/video_server.py

# TERMINAL 2 - Backend
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# TERMINAL 3 - Frontend 1
cd frontend
npm run dev

# TERMINAL 4 - Frontend 2
cd frontend
npm run dev -- --port 5174