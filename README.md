# Diagramr

AI-powered flowchart generator — describe any process in plain English and get a visual diagram instantly.

## Setup

### 1. Get a free Groq API key

Go to [console.groq.com](https://console.groq.com), sign up for free, and create an API key.

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and paste your key:

```
VITE_GROQ_API_KEY=your_groq_api_key_here
USE_REAL_API=true
```

### 3. Install and run

```bash
npm install
npm start
```

Open [http://localhost:5173](http://localhost:5173).

## Stack

- **Frontend:** React 18, ReactFlow, Vite, Tailwind CSS, Roughjs
- **Backend:** Express.js (port 3001)
- **AI:** Groq API — `llama-3.3-70b-versatile`

## Features

- Natural language → flowchart in seconds
- Hand-drawn sketch aesthetic
- Swimlane, roadmap, decision tree, planning diagrams
- Undo/redo, dark mode, export PNG/PDF
- Share via URL, presenter/fullscreen mode
- AI-powered diagram refinement
