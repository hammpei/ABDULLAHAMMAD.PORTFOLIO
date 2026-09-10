# ABDULLAHAMMAD.PORTFOLIO

Cinematic portfolio for Abdulla Hammad / NAVRIXA, showcasing video production, photography and digital marketing from the Maldives.

## Backend foundation

The `backend-foundation` branch adds:

- Netlify Database / Postgres project storage
- Public `GET /api/projects` endpoint
- Protected `/api/admin/projects` CRUD endpoint
- `/api/admin/login` and `/api/admin/logout`
- Signed 8-hour admin session cookie
- Static `/admin/` dashboard for adding, editing and deleting portfolio projects
- Existing Netlify Forms contact backend remains unchanged

## Required Netlify environment variables

Before deploying the admin backend, add these secret environment variables in Netlify and scope them to Functions/Runtime:

- `ADMIN_PASSWORD` — choose a strong private password
- `ADMIN_SESSION_SECRET` — use a long random secret (at least 32 characters)

Do not commit either value to GitHub.

## Database

The project uses `@netlify/database`. The database is provisioned by Netlify when the backend build/deploy runs, and migrations under `netlify/database/migrations/` create the required tables.

## Important deployment note

The current live Netlify portfolio was deployed by file upload rather than from this GitHub repository. Do not deploy this repository over the production site until the complete frontend source has been added to this repo; otherwise the existing live portfolio could be replaced by this backend-only repository.
