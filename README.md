# 📚 AI Study Scheduler

> AI-powered personalized study planner built in 90 minutes at a college vibe coding competition.

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=flat&logo=google&logoColor=white)

---

## What it does

Enter your subjects, exam dates, available hours, and optionally attach your syllabus (text or photo). The app sends everything to the **Gemini AI API** and gets back a personalized day-by-day study schedule built around your actual topics.

---

## Features

- 🤖 **AI Schedule Generation** — Gemini builds a daily plan with topics, hours & motivational tips
- 📄 **Syllabus Attachment** — paste text or upload a photo; Gemini Vision extracts the topics
- 👤 **Multi-User Auth** — login/signup stored in browser localStorage, SHA-256 hashed passwords
- 🕓 **Schedule History** — saves last 5 schedules per user, restorable anytime
- 🎨 **Glassmorphism UI** — animated gradient bg, frosted glass cards, Framer Motion transitions

---

## Getting Started

```bash
git clone https://github.com/your-username/ai-study-scheduler.git
cd ai-study-scheduler
npm install
```

Create a `.env` file:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

```bash
npm run dev
```

---

## Tech Stack

| | |
|---|---|
| React 18 + Vite | UI + dev server |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Gemini 2.5 Flash | AI + Vision OCR |
| localStorage | User database (no backend) |
| Web Crypto API | Password hashing (SHA-256) |

---

## Data Storage

No backend. No MongoDB. Everything lives in the **browser's localStorage** — two keys:
- `sched_users` — all user accounts + schedules
- `sched_current_user` — currently logged in user ID

Data is per-device and per-browser.

---

## Project Structure

```
src/
├── hooks/useAuth.js          # Auth logic
├── pages/
│   ├── AuthPage.jsx          # Login / Signup
│   ├── InputFormPage.jsx     # Subject + syllabus form
│   ├── LoadingPage.jsx       # 2-stage AI loading
│   └── ScheduleDashboard.jsx # Schedule + history panel
├── services/claude.js        # Gemini API calls
└── App.jsx                   # Auth gate + routing
```

---

> ⚠️ Client-side SHA-256 hashing is fine for a demo. For production, use a real backend with bcrypt and a proper database.

---


