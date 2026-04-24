# Practify

Practify is a full-stack web application with a Python backend and a modern JavaScript frontend.

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

You need to run **2 terminals** simultaneously:

---

### 🔹 Terminal 1 — Backend

```bash
cd D:\RD_badminton\Design\practify-web\backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --reload --port 8000



cd D:\RD_badminton\Design\practify-web\frontend

# Install dependencies
npm install

# Start development server
npm run dev
