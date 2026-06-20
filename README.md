# SmartMatch

AI-powered matching platform.

## Project Structure

```
smartmatch/
  docker-compose.yml
  frontend/       → React + TypeScript + Tailwind CSS
  backend/        → Node.js + Express + TypeScript
  ai-service/     → Python + FastAPI
  db/             → PostgreSQL migrations
```

## Getting Started

```bash
docker-compose up
```

| Service      | URL                    |
|--------------|------------------------|
| Frontend     | http://localhost:3000   |
| Backend API  | http://localhost:5000   |
| AI Service   | http://localhost:8000   |
| PostgreSQL   | localhost:5432          |
