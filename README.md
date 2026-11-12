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

## Roadmap (one feature at a time)
- [x] 1. Login + user management (ADMIN, RECEPTION, OFFICER)
- [x] 2. Churches + cases (register, list, detail), short case code, groups of people reporting, church members, people a case is about
- [x] 3. Admin dashboard with reports
- [ ] 4. Case flow: referral, return week, court acknowledgment, history
- [ ] 5. File attachments
- [ ] 6. Door queue / expected visitors
