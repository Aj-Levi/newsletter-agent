# 📰 AI Newsletter Agent

An agentic, automated newsletter platform designed to compile deeply researched, highly personalized summaries on the topics you care about, and deliver them directly to your inbox.

Professionals, students, and researchers struggle to stay updated on fast-moving topics. Reading dozens of articles daily is time-consuming, and generic newsletter feeds lack personalization. The **AI Newsletter Agent** solves this by autonomously researching, filtering, writing, formatting, and delivering custom briefs based on your specifications.

---

## 🎯 Use Case Scenario

Imagine you are a software engineer wanting to stay updated on the latest AI agent frameworks and policies every Monday morning:
1. **Configure Once**: You log in and create a subscription for the topic "Artificial Intelligence" with subtopics like "LLMs, AI agents, AI policy".
2. **Set Preferences**: You set the depth as "Intermediate", the tone as "Casual", and pin `techcrunch.com` while blacklisting `reddit.com`.
3. **Automated Schedule**: You schedule it for every Monday at 8:00 AM UTC.
4. **Direct Delivery**: Every Monday, a beautifully formatted, cited HTML email lands in your inbox containing a Deep Dive summary, top stories, and emerging trends—completely automated by the agent.

---

## ✨ Key Features

### 🔍 Agentic Search & Curation
* **Query Planner**: Translates your topic and subtopics into 4–6 targeted search queries based on your selected depth (broader terms for beginners, research-heavy terms for experts).
* **Smart Filter & Ranker**: Gathers results, deduplicates findings, and scores each article based on recency, length, source credibility, and relevance.
* **Auto-Requerying**: If initial search results are too sparse or irrelevant, the agent automatically adapts its search terms and tries again.

### ✍️ Intelligent Synthesis & Delivery
* **Custom Synthesis**: The agent writes a cohesive digest in sections (Subject Line, Top Stories with links, a Deep Dive, and Worth Watching trends) matching your preferred tone (Technical, Casual, or Executive Summary).
* **Responsive Email Formatting**: Compiles content into clean, responsive HTML emails matching modern formatting standards.
* **Reliable Delivery**: Emails are dispatched via Resend API, with one-click unsubscribe links and browser-view links automatically embedded.

### 📊 Dashboard & Performance Metrics
* **Subscription Management**: Create, edit, pause, duplicate, or delete topic configurations.
* **Manual Run Triggers**: Click "Run Now" to trigger the agent immediately and watch live compiling states.
* **Newsletter Previews**: Read compiled newsletters directly in your browser using a sandboxed preview drawer.
* **Citations & Metrics**: Analyze the total reports generated, delivery success rates, runs timeline, and the most cited web domains.

---

## 🛠️ Tech Stack

### Frontend Client
* **Next.js**: 16.2.9 (App Router)
* **React**: 19.2.4
* **NextAuth.js**: v5 (beta.31) with JWT session cookies
* **Prisma Client**: 7.8.0
* **Tailwind CSS & daisyUI**: styling layout framework
* **ApexCharts**: interactive data visualizations

### Backend Compiler Agent
* **FastAPI**: Python gateway router
* **LangGraph**: Orchestrates the multi-agentic newsletter compilation nodes
* **Tavily API**: Purpose-built web search for LLM agents
* **Resend API**: Email delivery service
* **APScheduler**: Hourly cron scheduler for active subscriptions
* **prisma-client-py**: Direct DB client bindings for Python

---

## 📁 Project Structure

```
├── backend/                  # FastAPI & LangGraph agent backend
│   ├── app/
│   │   ├── agent/            # LangGraph workflow nodes & state definition
│   │   ├── api/              # API router (runs agent compilations, health checks)
│   │   ├── scheduler/        # APScheduler cron tick handler
│   │   └── services/         # Tavily search & Resend email integrations
├── frontend/                 # Next.js 16.2.9 web client
│   ├── prisma/               # Schema configuration
│   ├── src/
│   │   ├── app/              # Next.js App Router layout, page components, & API endpoints
│   │   ├── components/       # Modular UI components (auth, analytics, subscriptions)
│   │   └── lib/              # Database connection, auth exports, & schedule helpers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Neon PostgreSQL database (or other PostgreSQL instance)

### 1. Database Setup
Ensure PostgreSQL connection URL is configured in both `.env` configurations.

### 2. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file containing:
   ```env
   DATABASE_URL="your-postgresql-url"
   AUTH_SECRET="your-nextauth-secret"
   AUTH_GITHUB_ID="github-id"
   AUTH_GITHUB_SECRET="github-secret"
   AUTH_GOOGLE_ID="google-id"
   AUTH_GOOGLE_SECRET="google-secret"
   RESEND_API_KEY="resend-api-key"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   ```
4. Push the database schema and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Run the Next.js development server:
   ```bash
   npm run dev
   ```

### 3. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up virtual environment and install packages:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Generate the python prisma client:
   ```bash
   PATH=.venv/bin:$PATH .venv/bin/prisma generate --schema=../frontend/prisma/schema.prisma --generator=client_py
   ```
4. Create a `.env` file containing:
   ```env
   DATABASE_URL="your-postgresql-url"
   FASTAPI_SECRET="your-fastapi-shared-secret"
   TAVILY_API_KEY="tavily-api-key"
   RESEND_API_KEY="resend-api-key"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   AI_API_KEY="inference-api-key"
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

---

## 📬 Contact and Feedback

If you have questions, feedback, or would like to connect:
- **GitHub**: [Abhijeet Jain (Aj-Levi)](https://github.com/Aj-Levi)
- **LinkedIn**: [Abhijeet Jain Profile](https://www.linkedin.com/in/abhijeet-jain-84486a313/)

---

## 😁 Thanks for Visiting!
Thank you for checking out the AI Newsletter Agent. Feel free to star the repo or raise issues/feature requests!
