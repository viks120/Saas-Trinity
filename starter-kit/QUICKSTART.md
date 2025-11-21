# Quick Start Guide

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Start Docker Desktop before proceeding

2. **Verify Docker is running:**
   ```bash
   docker --version
   docker compose version
   ```

## Starting the Application

1. **Navigate to the starter-kit directory:**
   ```bash
   cd starter-kit
   ```

2. **Start all services:**
   ```bash
   docker compose up --build
   ```
   
   This will:
   - Build the backend (FastAPI + Python)
   - Build the frontend (React + Vite)
   - Build the nginx reverse proxy
   - Start PostgreSQL database
   - Initialize database with seed data
   
   First build takes 5-10 minutes. Subsequent starts are much faster.

3. **Wait for services to be ready:**
   
   You'll see output like:
   ```
   backend-1   | INFO:     Uvicorn running on http://0.0.0.0:8000
   frontend-1  | VITE ready in 1234 ms
   nginx-1     | nginx: [notice] start worker processes
   ```

4. **Access the application:**
   - Frontend: http://localhost/
   - Backend API: http://localhost/api/
   - API Docs: http://localhost/api/docs

## Default Credentials

- **Email:** admin@example.com
- **Password:** admin123

## Stopping the Application

```bash
# Stop services (keeps data)
docker compose down

# Stop and remove all data
docker compose down -v
```

## Troubleshooting

### Docker Desktop not running
**Error:** `The system cannot find the file specified`

**Solution:** Start Docker Desktop and wait for it to fully initialize

### Port already in use
**Error:** `port is already allocated`

**Solution:** Stop other services using port 80, or modify `docker-compose.yml` to use a different port

### Services won't start
**Solution:** 
```bash
docker compose down -v
docker compose up --build
```

### Hot reload not working
**Solution:** Ensure volume mounts are correct in `docker-compose.yml`

## Development Workflow

1. **Make changes to backend code** (`backend/` directory)
   - Server automatically reloads
   - No restart needed

2. **Make changes to frontend code** (`frontend/src/` directory)
   - Vite automatically reloads
   - Changes appear instantly in browser

3. **View logs:**
   ```bash
   docker compose logs -f
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

4. **Restart a single service:**
   ```bash
   docker compose restart backend
   docker compose restart frontend
   ```

## Next Steps

1. Login with admin credentials
2. Explore the admin panel at http://localhost/admin
3. Create new subscription tiers
4. Register a test user
5. Assign tiers to users
6. Toggle feature flags
7. Test feature gating

## Project Structure

```
starter-kit/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── nginx/            # Reverse proxy
├── .kiro/            # Kiro specs and steering
└── docker-compose.yml
```

See README.md for detailed documentation.
