# 🏢 OB Office Management: Universe Core
### *The Advanced AI-Driven Operational Intelligence System*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black.svg?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-7.7.0-2D3748.svg?style=flat-square)

---

## 🚀 Overview
**OB Office Management** is a state-of-the-art office automation and project orchestration platform designed for high-performance teams. It leverages advanced AI integration to transform informal requirements into structured technical architecture, automating ticket creation and optimizing operational workflows through real-time telemetry.

Built as a central hub for the **OtherBrain Ecosystem**, it combines minimalist aesthetics with brutalist efficiency, ensuring that every second of operational time is tracked, analyzed, and optimized.

---

## ✨ Key Features

### 🤖 AI Assistant (Requirement Orchestrator)
- **Informal-to-Technical Conversion**: An AI that parses natural language and voice dictation into structured architectural proposals and clickable tickets.
- **Persistent Conversations**: Synchronized chat history with URL persistence and title auto-generation.
- **Voice-Enabled Workflow**: Hands-free dictation support using Web Speech API integration.
- **Architecture Proposals**: Generates JSON-based structured data for automatic ticket injection into projects.

### 📋 Precision Project Management
- **Hierarchical Structure**: Organize work into Projects and highly specialized Modules.
- **Dynamic Kanban Board**: A real-time ticket management system with state-aware controls (Start, Pause, Resume, Complete).
- **Subtask Granularity**: Every ticket supports nested subtasks for extreme precision.

### ⏱️ Operational Telemetry (Speedrun Tracking)
- **Active Timing System**: Persistent, database-level telemetry for ticket and subtask execution.
- **Master Chronometer**: Visual color-coded feedback (Red/Yellow/Green) based on estimated vs. actual execution time.
- **Pause/Resume Shift**: A global control system to atomically stop all active timers during breaks.

### 📊 Intelligence & Settings
- **Live Analytics**: Real-time insights into project progress, ticket completion rates, and team performance.
- **User Personas**: Context-aware UI and AI behavior based on roles: CEO, Developer, or Client.
- **Dynamic Themes**: Seamless switching between Dark and Light mode with persistent preferences.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS 4 |
| **Logic** | Server Components (RSC), Server Actions |
| **UI Components** | shadcn/ui (Radix UI) |
| **Database** | Prisma (ORM), PostgreSQL |
| **AI Engine** | AI SDK + Vercel AI, OpenRouter Integration |
| **Icons & Media** | Lucide React |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (Latest LTS)
- PostgreSQL Instance
- OpenRouter API Key

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/otherbraintech/ob-office-management.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env`):
   ```env
   DATABASE_URL="postgresql://..."
   OPENROUTER_API_KEY="sk-or-..."
   AUTH_SECRET="your-secret"
   ```
4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

---

## 👤 User Roles & AI Logic
- **CEO**: Focuses on business metrics, profitability, and high-level project health.
- **Developer**: Direct, technical communication with code-level insights and subtask precision.
- **Client**: Jargon-free, cordial assistance focusing on requirement capturing.

---

## 🛠️ Development Standards
- **Clean Code**: Strict Typing, no `any`, modular components.
- **Performance**: Heavy use of React Server Components and minimized client-side state.
- **UX**: Mandatory `cursor-pointer` on interactive elements, smooth CSS transitions, and mobile-first layouts.

---

**Developed with ❤️ by the OtherBrain Team.**
*"De la idea al ticket en segundos."*
