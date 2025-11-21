# SaaS Starter Kit

A minimal, production-ready scaffold for building subscription-based web applications with authentication, subscription tier management, and feature gating. Built with FastAPI, React, PostgreSQL, and Docker.

## Overview

This starter kit provides a complete foundation for building SaaS applications with:
- 🔐 Secure cookie-based authentication with session binding
- 💳 Subscription tier management with flexible feature sets
- 🚦 Feature gating (global flags + tier-based access control)
- 👨‍💼 Admin panel for managing users, tiers, and features
- 🐳 Docker-based deployment with hot-reload for development
- 🔄 CI/CD pipeline with GitHub Actions

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd starter-kit

# Start all services
docker compose up --build

# Access the application
# Frontend: http://localhost/
# Backend API: http://localhost/api/
# API Docs: http://localhost/api/docs
```

The application will be ready in under 10 minutes on first build.

## Demo Credentials

The system automatically creates an admin user on first startup:

- **Email**: `admin@example.com`
- **Password**: `admin123`

You can customize these credentials by editing the environment variables in `docker-compose.yml`:
```yaml
environment:
  - ADMIN_EMAIL=your-admin@example.com
  - ADMIN_PASSWORD=your-secure-password
```

## How We Used Kiro

This project was built using Kiro's spec-driven development workflow:

### 📋 Specs
We created a comprehensive specification in `.kiro/specs/subscription-tier-starter/` that includes:
- **requirements.md**: EARS-compliant requirements with acceptance criteria
- **design.md**: Detailed architecture, data models, and correctness properties
- **tasks.md**: Step-by-step implementation plan with 27 actionable tasks

The spec-driven approach helped us:
- Define clear requirements before writing code
- Identify correctness properties for property-based testing
- Break down implementation into manageable, incremental tasks
- Maintain consistency between requirements, design, and implementation

### 🎯 Steering
We created steering documents in `.kiro/steering/` to guide development:
- **minimal-implementation.md**: Enforces minimal dependencies and native functionality
- Defines coding standards and architectural constraints
- Ensures consistent tone and approach across the codebase

### 🪝 Hooks
We set up agent hooks to automate common workflows:
- **test-on-save**: Automatically runs tests when backend files are saved
- **format-on-commit**: Ensures code formatting before commits

### 💬 Vibe Coding
Throughout development, we used Kiro's conversational interface to:
- Iterate on requirements and design decisions
- Generate boilerplate code following our patterns
- Debug issues and refine implementations
- Maintain context across multiple development sessions

## Project Structure

```
starter-kit/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── .kiro/
│   ├── specs/                  # Feature specifications
│   │   └── subscription-tier-starter/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/               # Development guidelines
│       └── minimal-implementation.md
├── docker-compose.yml          # Orchestrates all services
├── nginx/                      # Reverse proxy
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                    # FastAPI backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                # Application entry point
│   ├── database.py            # Database connection
│   ├── auth.py                # Authentication & sessions
│   ├── seed.py                # Database seeding
│   ├── models/                # SQLAlchemy models
│   │   ├── user.py
│   │   ├── tier.py
│   │   └── feature_flag.py
│   ├── routes/                # API endpoints
│   │   ├── auth.py
│   │   ├── tiers.py
│   │   ├── features.py
│   │   ├── admin.py
│   │   └── health.py
│   └── services/              # Business logic
│       └── feature_gate.py
└── frontend/                   # React + Vite
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── client.js      # API client with cookie auth
        ├── contexts/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   └── FeatureGate.jsx
        └── pages/
            ├── Auth.jsx       # Login/Register
            ├── Dashboard.jsx
            └── Admin.jsx
```

## Architecture

### Services

The application consists of four Docker services:

1. **nginx** (port 80): Reverse proxy
   - Routes `/` to frontend
   - Routes `/api/` to backend
   - Preserves headers and cookies

2. **frontend** (internal port 5173): React + Vite
   - Cookie-based authentication (no manual token management)
   - Protected routes with automatic redirect
   - Feature gating components

3. **backend** (internal port 8000): FastAPI
   - Encrypted session cookies with IP/user-agent binding
   - RESTful API with automatic OpenAPI docs
   - SQLAlchemy ORM with PostgreSQL

4. **db** (internal port 5432): PostgreSQL 15
   - Persistent volume for data storage
   - Automatic schema initialization
   - Seeded with example data

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Backend validates credentials and creates encrypted session
3. Session cookie is set with `HttpOnly`, `Secure`, `SameSite=Strict` flags
4. Browser automatically sends cookie with subsequent requests
5. Backend validates session on each request (checks expiration, IP, user agent)

### Feature Gating

Features are controlled by two layers:

1. **Global Feature Flags**: Admin-controlled toggles in the database
   - If disabled: endpoint returns 404 (feature doesn't exist)
   
2. **Tier Features**: JSON object in each tier defining available features
   - If user's tier lacks feature: endpoint returns 403 (upgrade required)

Both conditions must be true for access to be granted.

## Development

### Hot Reload

Both frontend and backend support hot-reload for rapid development:

- **Frontend**: Edit files in `frontend/src/` - Vite automatically reloads
- **Backend**: Edit files in `backend/` - Uvicorn automatically reloads

Changes that **require container restart**:
- Modifying `requirements.txt` or `package.json`
- Changing environment variables in `docker-compose.yml`
- Updating Nginx configuration

### Adding New Features

The codebase is designed for easy extension:

1. **New API Endpoint**:
   - Create route in `backend/routes/`
   - Add router to `main.py`
   - Use `get_current_user` or `require_admin` dependencies

2. **New Database Model**:
   - Create model in `backend/models/`
   - Import in `models/__init__.py`
   - Restart backend to create tables

3. **New Frontend Page**:
   - Create component in `frontend/src/pages/`
   - Add route in `App.jsx`
   - Wrap with `ProtectedRoute` if authentication required

4. **New Feature Gate**:
   - Add feature flag to database (via admin panel or seed script)
   - Add feature to tier's features JSON
   - Use `require_feature()` in backend route

### Environment Variables

Backend configuration in `docker-compose.yml`:

```yaml
environment:
  # Database
  - DATABASE_URL=postgresql://user:pass@db:5432/dbname
  
  # Session Security
  - SESSION_SECRET=your-32-byte-secret-key
  - SESSION_EXPIRATION_HOURS=24
  
  # Server
  - DEBUG=true
  - ALLOWED_ORIGINS=http://localhost
  - SECURE_COOKIES=false  # Set true in production
  
  # Admin Bootstrap
  - ADMIN_EMAIL=admin@example.com
  - ADMIN_PASSWORD=admin123
```

## Folder Structure Explained

### `.kiro/` Directory

Contains Kiro-specific artifacts that document how the project was built:

- **specs/**: Feature specifications following spec-driven development
  - `requirements.md`: User stories and acceptance criteria
  - `design.md`: Architecture, data models, correctness properties
  - `tasks.md`: Implementation plan with checkboxes

- **steering/**: Development guidelines and constraints
  - Enforces minimal dependencies
  - Defines coding standards
  - Maintains consistent architecture

### Extension Points

The codebase provides clear patterns for extension:

- **Backend Routes** (`backend/routes/`): Add new API endpoints
- **Frontend Pages** (`frontend/src/pages/`): Add new UI pages
- **Services** (`backend/services/`): Add business logic
- **Components** (`frontend/src/components/`): Add reusable UI elements

## Dependency Rationale

We minimize dependencies and prefer native functionality:

### Backend
- **FastAPI**: Modern Python framework with automatic API docs
- **SQLAlchemy**: Mature ORM, prevents SQL injection
- **Passlib**: Standard password hashing (bcrypt)
- **Cryptography**: Standard Python library for session encryption (Fernet)
- **Uvicorn**: ASGI server with hot-reload

### Frontend
- **React**: Industry standard UI library
- **Vite**: Fast build tool with excellent DX
- **React Router**: Standard routing solution
- **Native fetch**: No axios needed - browser API is sufficient

### Infrastructure
- **Docker**: Containerization and orchestration
- **Nginx**: Lightweight, battle-tested reverse proxy
- **PostgreSQL**: Robust, open-source database with JSON support

## Testing

The project includes both unit tests and property-based tests:

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

Property-based tests validate correctness properties across many random inputs using Hypothesis (Python) and fast-check (JavaScript).

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

1. Build backend Docker image
2. Build frontend Docker image
3. Run backend tests
4. Run frontend tests

The workflow completes in under 5 minutes.

## Deployment

For production deployment:

1. Set `SECURE_COOKIES=true` in environment
2. Use a strong `SESSION_SECRET` (32+ random bytes)
3. Configure proper CORS origins
4. Use a managed PostgreSQL instance
5. Set up HTTPS with Let's Encrypt
6. Configure proper logging and monitoring

## Stopping Services

```bash
# Stop services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v

# View logs
docker compose logs -f

# Restart a single service
docker compose restart backend
```

## Troubleshooting

**Services won't start:**
- Check Docker is running
- Ensure ports 80, 5173, 8000, 5432 are available
- Try `docker compose down -v` and rebuild

**Database connection errors:**
- Wait for database to fully initialize (can take 30 seconds)
- Check `docker compose logs db` for errors

**Hot reload not working:**
- Verify volume mounts in `docker-compose.yml`
- On Windows, ensure file watching is enabled in Docker settings

**Authentication issues:**
- Clear browser cookies
- Check session secret is set correctly
- Verify CORS origins match your domain

## License

MIT License - see LICENSE file for details

## Contributing

This is a starter template - fork it and make it your own! The minimal architecture makes it easy to understand and modify.

## Support

For issues and questions:
- Check the `.kiro/specs/` directory for detailed documentation
- Review the design document for architecture decisions
- Examine the tasks document for implementation details
