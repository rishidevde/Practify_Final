# 🎥 Video Calling Setup Guide

This guide explains how to set up video calling between two computers (Windows, Mac, or mixed).

---

## ✨ Features

- ✅ **P2P Video Calls** - Direct peer-to-peer connection
- ✅ **Same Network** - Quick setup for local connections
- ✅ **Cross-Network** - Connect with friends on different networks/computers
- ✅ **Cross-Platform** - Works on Windows, Mac, Linux
- ✅ **HD Quality** - Up to 1280x720 resolution
- ✅ **WebRTC** - Built on industry-standard WebRTC protocol

---

## 🚀 Quick Start (Same Network)

### Person A (Windows):
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Terminal 1: Start video server
python app/video_server.py

# Terminal 2: Start main backend
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

### Person B (Same Network):
- Open the app on your computer (same local network)
- Go to **Interview** page
- Note Person A's **IP Address** and **Room ID**
- Click **"Start Call"**
- Video connects automatically!

---

## 🌐 Cross-Network Setup (Windows → Mac or Mac → Windows)

### Step 1: Both Users - Start the Servers

**Person A (Windows):**
```bash
# Terminal 1: Video Signaling Server
cd backend
.\run_video.ps1
# Or manually:
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app/video_server.py
```

This will show output like:
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

```bash
# Terminal 2: Main Backend
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**Person B (Mac):**
```bash
# Terminal 1: Video Signaling Server
cd backend
source .venv/bin/activate  # Or python3 -m venv .venv first
pip install -r requirements.txt
python app/video_server.py
```

**Note: Each person needs to run their own video server!**

```bash
# Terminal 2: Main Backend
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

---

### Step 2: Find Each Other's IP Addresses

When you run `python app/video_server.py`, it shows your local IP.

**On Windows:**
- Open Command Prompt
- Run: `ipconfig`
- Look for "IPv4 Address" (usually `192.168.x.x` or `10.0.x.x`)

**On Mac:**
- Open Terminal
- Run: `ifconfig | grep "inet "`
- Look for `inet 192.168.x.x` (skip 127.0.0.1)

**Example IPs:**
- Person A (Windows): `192.168.1.100`
- Person B (Mac): `192.168.1.50`

---

### Step 3: Connect on Interview Page

**Person A (Windows):**

1. Open app: `http://localhost:5173`
2. Go to **Interview** page
3. You'll see:
   - ✅ Local IP Address: `192.168.1.100`
   - ✅ Your Room ID: (auto-generated, e.g., `ABC123XYZ`)
   - ✅ Your Client ID: (auto-generated)

4. **Share these details:**
   - Your IP: `192.168.1.100`
   - Your Room ID: (copy using the button)

**Person B (Mac):**

1. Open app: `http://localhost:5173`
2. Go to **Interview** page
3. Click **"Custom Server IP"** settings button
4. Enter Person A's IP: `192.168.1.100`
5. The **Room ID field** at top should show
6. Enter Person A's Room ID: `ABC123XYZ`
7. Click **"Start Call"**

**Person A:**
- Will see "Peer joined" message
- Click **"Start Call"** when ready
- Video stream will establish!

---

## 🔧 Troubleshooting

### ❌ "Connection error: Cannot reach IP:8001"

**Solutions:**
1. ✅ Verify the IP address is correct
   - Run `ipconfig` (Windows) or `ifconfig` (Mac)
   - Make sure it's the 192.168.x.x or 10.0.x.x address

2. ✅ Check firewall
   - **Windows:** Allow Python through Windows Firewall
     - Windows Security → Firewall & Network Protection
     - Allow app through firewall
   - **Mac:** Go to System Preferences → Security & Privacy → Firewall Options
     - Add Python to allowed apps

3. ✅ Verify video server is running
   - Check Terminal 1 shows "Server is ready for connections!"
   - Look for the "Connection URLs" section

4. ✅ Check port 8001 is not in use
   - Windows: `netstat -ano | findstr :8001`
   - Mac: `lsof -i :8001`

### ❌ "Cannot access camera/microphone"

**Solutions:**
1. ✅ Grant permission when browser asks
   - Click "Allow" for camera and microphone
2. ✅ Check browser permissions
   - Firefox/Chrome Settings → Privacy & Security → Permissions
   - Allow camera and microphone for `localhost:5173`
3. ✅ Make sure no other app is using camera
   - Close other video apps (Zoom, Teams, etc.)

### ❌ One-way video (can see them, they can't see you)

**Solutions:**
1. ✅ Check camera access on your computer
   - Make sure you granted permission
2. ✅ Restart the browser
3. ✅ Check firewall isn't blocking traffic

### ❌ "Peer disconnected" or "Connection closed"

**Solutions:**
1. ✅ Verify internet connection
2. ✅ Restart video server on both computers
3. ✅ Check if friend's video server is still running

---

## 📋 Checklist for Cross-Machine Calling

- [ ] **Person A:** Started video_server.py and noted IP (e.g., 192.168.1.100)
- [ ] **Person A:** Started main backend on port 8000
- [ ] **Person A:** Frontend running on http://localhost:5173
- [ ] **Person B:** Started video_server.py and noted IP
- [ ] **Person B:** Started main backend on port 8000
- [ ] **Person B:** Frontend running on http://localhost:5173
- [ ] **Person B:** Entered Person A's IP in "Custom Server IP"
- [ ] **Person B:** Entered Person A's Room ID
- [ ] **Person A:** Clicked "Start Call"
- [ ] **Person B:** Clicked "Start Call"
- [ ] ✅ **Video connected!**

---

## 🔒 Security Notes

- WebRTC connections are **encrypted by default** (DTLS-SRTP)
- Signaling server (port 8001) is **not encrypted** (add SSL in production)
- Room IDs are **random** and unique to each session
- Peers need to **exchange Room IDs** to find each other

---

## 📱 Mobile Support

The app is responsive but WebRTC mobile support varies:
- ✅ iOS Safari (iOS 11+)
- ✅ Android Chrome (Android 5+)
- Note: Some mobile networks block P2P connections

---

## 🎯 Advanced: Using TURN Servers (Optional)

For **very restricted networks** that block P2P:

Edit `backend/app/video_server.py` or `frontend/src/pages/InterviewPage.jsx`:

```javascript
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { 
      urls: "turn:your-turn-server.com:3478",
      username: "user",
      credential: "pass"
    }
  ]
};
```

Popular free TURN servers:
- `turn:numb.viagenie.ca`
- `turn:openrelay.metered.ca`

---

## 📞 Still Having Issues?

1. ✅ Check console logs (F12 → Console tab)
2. ✅ Verify both machines are on the same network (or have internet access)
3. ✅ Make sure Python >= 3.8
4. ✅ Make sure Node >= 16
5. ✅ Clear browser cache and try again

---

## 🎉 Happy Video Calling!

Enjoy your interview practice sessions! 🎥✨

