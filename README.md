# Case Management (Church Case Desk)

Case intake and tracking for churches: users and roles, churches, cases with several issues per person, and an admin dashboard with reports.

```
backend/    Spring Boot 3 (Java 21), PostgreSQL, Flyway, JWT
frontend/   React + Vite
docker-compose.yml   PostgreSQL for local development
```

## Run locally
1. `docker compose up -d`   (PostgreSQL)
2. `cd backend && mvn spring-boot:run`   (API on :8080)
3. `cd frontend && npm install && npm run dev`   (UI on :5173)

First login: **admin / admin123** (change it under Users). Set `JWT_SECRET` in production.

## Features
- Roles: ADMIN, OFFICER, RECEPTION, DEPARTMENT (department staff see only the issues sent to their own department)
- Configurable departments (Departments page), each can be linked to the kind of issue it normally handles
- Per-issue flow: with the desk -> sent to a department (with a return date) -> resolved, or taken to court (admin acknowledges)
- Notifications (bell + page): department is told when an issue arrives; the person who registered the case and the admins are told when it is resolved
- Door queue: who is expected back today / overdue, with an "Arrived" button
- Department inbox, case history timeline, file attachments (stored in `./uploads`, set `app.storage.dir` to change)
- One global search (name, church or case code)
- Upgrading: migration `V4` runs automatically on start. Back up the database first.
