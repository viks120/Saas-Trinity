# Design Document: Subscription Tier Starter Kit

## Overview

The Subscription Tier Starter Kit is a minimal, production-ready scaffold for building SaaS applications with subscription-based access control. The system provides a complete full-stack foundation including authentication, subscription tier management, feature gating, and containerized deployment.

### Design Philosophy

This starter kit follows a "minimal but complete" philosophy:
- Implement only essential features without over-engineering
- Use native functionality and minimal dependencies
- Provide clear extension points through example patterns
- Enable rapid iteration with hot-reload support
- Maintain simplicity to serve as a learning template

### Key Capabilities

1. **Docker-based deployment**: Single-command setup with `docker compose up --build`
2. **JWT authentication**: Secure user registration and login
3. **Subscription tier management**: Admin CRUD operations for pricing tiers
4. **Feature gating**: Dual-layer access control (global flags + tier features)
5. **Hot-reload development**: Instant code updates without container restarts
6. **Minimal dependencies**: Native implementations where possible

## Architecture

### System Architecture

The system uses a containerized microservices architecture with four main components:

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx Proxy (:80)                    │
│  Routes: / → Frontend, /api/ → Backend                  │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
             ▼                          ▼
    ┌────────────────┐        ┌─────────────────┐
    │   Frontend     │        │    Backend      │
    │  React + Vite  │        │    FastAPI      │
    │    (:5173)     │        │    (:8000)      │
    └────────────────┘        └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   Postgres DB   │
                              │    (:5432)      │
                              └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ (UI library)
- Vite (build tool with hot-reload)
- Native fetch API (HTTP requests)
- Native browser APIs (localStorage for JWT)

**Backend:**
- FastAPI (web framework)
- SQLAlchemy (ORM)
- Cryptography (Fernet symmetric encryption for sessions)
- Passlib (password hashing with bcrypt)
- Uvicorn (ASGI server with reload)

**Infrastructure:**
- Docker & Docker Compose (containerization)
- Nginx (reverse proxy)
- Postgres 15+ (database)

**Rationale for Dependencies:**
- React/Vite: Industry standard, excellent DX, minimal configuration
- FastAPI: Modern Python framework, automatic OpenAPI docs, async support
- SQLAlchemy: Mature ORM, prevents SQL injection, supports migrations
- Cryptography: Standard Python library for secure encryption (Fernet)
- Passlib: Lightweight, standard library for password hashing
- Postgres: Robust, open-source, JSON support for tier features

## Components and Interfaces

### Backend Components

#### 1. Database Models (`backend/models.py`)

**User Model:**
```python
class User:
    id: int (primary key)
    email: str (unique, indexed)
    hashed_password: str
    is_admin: bool (default: False)
    tier_id: int (foreign key to Tier, nullable)
    created_at: datetime
```

**Tier Model:**
```python
class Tier:
    id: int (primary key)
    name: str (unique)
    price_cents: int
    features: JSON (e.g., {"max_projects": 5, "advanced_reports": true})
    created_at: datetime
```

**FeatureFlag Model:**
```python
class FeatureFlag:
    id: int (primary key)
    name: str (unique)
    enabled: bool (default: False)
    description: str (optional)
```

#### 2. Authentication Module (`backend/auth.py`)

**Functions:**
- `hash_password(password: str) -> str`: Hash password using bcrypt
- `verify_password(plain: str, hashed: str) -> bool`: Verify password
- `create_session(user_id: int, is_admin: bool, request: Request) -> str`: Create encrypted session cookie
  - Extract IP address and user agent from request
  - Create session data with user info and binding data
  - Encrypt session data using Fernet
  - Return encrypted cookie value
- `decrypt_session(cookie_value: str) -> dict`: Decrypt and parse session data
- `validate_session(session_data: dict, request: Request) -> bool`: Validate session binding
  - Check expiration
  - Verify IP address matches
  - Verify user agent hash matches
- `get_current_user(request: Request) -> User`: Extract user from session cookie
  - Read session cookie from request
  - Decrypt and validate session
  - Load user from database
- `require_admin(user: User) -> None`: Raise 403 if not admin
- `set_session_cookie(response: Response, session_value: str) -> None`: Set HTTP-only cookie on response

#### 3. API Routes

**Auth Routes (`backend/routes/auth.py`):**
- `POST /api/auth/register`: Create new user account
  - Input: `{email, password}`
  - Output: `{id, email, is_admin, tier}`
  - Sets encrypted session cookie in response
  
- `POST /api/auth/login`: Authenticate user
  - Input: `{email, password}`
  - Output: `{user: {id, email, is_admin, tier}}`
  - Sets encrypted session cookie in response

- `POST /api/auth/logout`: Clear session
  - Clears session cookie (sets Max-Age=0)

**Tier Routes (`backend/routes/tiers.py`):**
- `GET /api/tiers`: List all tiers (public)
- `POST /api/tiers`: Create tier (admin only)
  - Input: `{name, price_cents, features}`
- `PUT /api/tiers/{id}`: Update tier (admin only)
- `DELETE /api/tiers/{id}`: Delete tier (admin only)
- `POST /api/users/{id}/tier`: Assign tier to user (admin only)

**Feature Flag Routes (`backend/routes/features.py`):**
- `GET /api/features`: List all flags (admin only)
- `PUT /api/features/{name}`: Toggle flag (admin only)
  - Input: `{enabled: bool}`

**Protected Example Route (`backend/routes/example.py`):**
- `GET /api/example/advanced-feature`: Example gated endpoint
  - Requires: Global flag "advanced_feature" enabled
  - Requires: User tier includes `"advanced_reports": true`
  - Returns: 404 if flag disabled, 403 if tier lacks feature

**Health Route (`backend/routes/health.py`):**
- `GET /api/health`: Health check endpoint
  - Output: `{status: "ok"}`

#### 4. Feature Gating Service (`backend/services/feature_gate.py`)

**Functions:**
- `check_feature_access(feature_name: str, user: User) -> bool`: 
  - Check if global flag enabled AND user tier includes feature
  - Return False if either check fails
  
- `require_feature(feature_name: str, user: User) -> None`:
  - Raise 404 if global flag disabled
  - Raise 403 if user tier lacks feature

**Logic Flow:**
```
1. Check global feature flag
   - If disabled → Return 404 (feature not found)
2. Check user's tier
   - If no tier → Return 403 (upgrade required)
   - If tier lacks feature → Return 403 (upgrade required)
3. Allow access
```

### Frontend Components

#### 1. API Client (`frontend/src/api/client.js`)

**Functions:**
- `apiRequest(method, path, body)`: Make authenticated requests
  - Uses `credentials: 'include'` to send cookies automatically
  - No manual token management needed
  - Handles 401 (redirect to login) and 403 (show upgrade prompt)
  
**Example:**
```javascript
async function apiRequest(method, path, body) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'include',  // Send cookies automatically
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return response.json();
}
```

#### 2. Auth Context (`frontend/src/contexts/AuthContext.jsx`)

**State:**
- `user`: Current user object or null
- `loading`: Boolean for auth state loading
- `login(email, password)`: Call login API (cookie set automatically by server)
- `register(email, password)`: Call register API (cookie set automatically by server)
- `logout()`: Call logout API to clear cookie, then clear user state

#### 3. Core Pages

**Login/Register Page (`frontend/src/pages/Auth.jsx`):**
- Forms for login and registration
- Call auth context methods
- Redirect to dashboard on success

**Dashboard Page (`frontend/src/pages/Dashboard.jsx`):**
- Display current user info and tier
- Show available features based on tier
- Link to admin panel if admin user

**Admin Panel (`frontend/src/pages/Admin.jsx`):**
- Tier management: Create, update, delete tiers
- User management: View users, assign tiers
- Feature flag toggles
- Protected route (admin only)

#### 4. Components

**ProtectedRoute (`frontend/src/components/ProtectedRoute.jsx`):**
- Wrapper component that checks authentication
- Redirects to login if not authenticated

**FeatureGate (`frontend/src/components/FeatureGate.jsx`):**
- Wrapper component that checks feature access
- Shows upgrade prompt if feature not available
- Props: `featureName`, `children`

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    tier_id INTEGER REFERENCES tiers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tiers table
CREATE TABLE tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    price_cents INTEGER NOT NULL,
    features JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature flags table
CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier_id);
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
```

## Data Models

### User

Represents a registered user of the system.

**Fields:**
- `id`: Unique identifier
- `email`: User's email address (used for login)
- `hashed_password`: Bcrypt-hashed password
- `is_admin`: Admin privilege flag
- `tier_id`: Reference to assigned subscription tier (nullable)
- `created_at`: Account creation timestamp

**Relationships:**
- Many-to-one with Tier (user belongs to one tier)

**Validation:**
- Email must be valid format and unique
- Password must be at least 8 characters
- Email is case-insensitive for lookups

### Tier

Represents a subscription pricing level with associated features.

**Fields:**
- `id`: Unique identifier
- `name`: Display name (e.g., "Free", "Pro", "Enterprise")
- `price_cents`: Price in cents (e.g., 999 = $9.99)
- `features`: JSON object defining available features

**Features JSON Structure:**
```json
{
  "max_projects": 5,
  "advanced_reports": true,
  "api_access": false,
  "custom_domain": false
}
```

**Validation:**
- Name must be unique
- Price must be non-negative
- Features must be valid JSON object

### FeatureFlag

Represents a global feature toggle.

**Fields:**
- `id`: Unique identifier
- `name`: Feature identifier (e.g., "advanced_reports")
- `enabled`: Boolean toggle state
- `description`: Optional human-readable description

**Validation:**
- Name must be unique and follow snake_case convention
- Name should match keys used in tier features JSON

### Session Management

**Session Strategy:** Encrypted HTTP-only cookies with session binding

**Rationale:**
- More secure than localStorage (immune to XSS attacks)
- HTTP-only flag prevents JavaScript access
- Secure flag ensures HTTPS-only transmission
- SameSite flag prevents CSRF attacks
- Session binding adds additional security layer

**Session Cookie Structure:**
```python
# Cookie name: "session"
# Cookie value: Encrypted session data containing:
{
  "user_id": 123,
  "is_admin": false,
  "created_at": 1234567890,
  "ip_address": "192.168.1.1",      # Bound to client IP
  "user_agent_hash": "abc123..."     # Bound to browser fingerprint
}
```

**Cookie Configuration:**
```python
# Set-Cookie header attributes
HttpOnly=True      # Prevents JavaScript access (XSS protection)
Secure=True        # HTTPS only (set to False for local dev)
SameSite=Strict    # CSRF protection
Max-Age=86400      # 24 hours
Path=/             # Available to all routes
```

**Session Encryption:**
- Use Python's `cryptography` library (Fernet symmetric encryption)
- Encryption key stored in environment variable `SESSION_SECRET`
- Each session encrypted before setting cookie
- Decrypted and validated on each request

**Session Validation:**
1. Decrypt cookie value
2. Verify expiration (created_at + 24 hours)
3. Verify IP address matches request IP
4. Verify user agent hash matches request user agent
5. Load user from database using user_id

**Security Benefits:**
- XSS attacks cannot steal session (HTTP-only)
- Session hijacking harder (IP + user agent binding)
- CSRF attacks prevented (SameSite=Strict)
- Man-in-the-middle harder (Secure flag)
- Session data encrypted (cannot be tampered with)

**Frontend Changes:**
- No manual token storage needed
- Browser automatically sends cookie with requests
- Use `credentials: 'include'` in fetch requests
- No Authorization header needed

**Extension Points:**
- Add Redis for server-side session storage
- Add session revocation mechanism
- Add refresh token rotation
- Add device management (list/revoke sessions)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties. Many example-based tests (Docker setup, documentation checks, configuration verification) are better suited for manual verification or integration tests rather than property-based testing. The properties below focus on core business logic that should hold across all valid inputs.

**Redundancy Analysis:**
- Properties 3.1-3.5 cover tier CRUD operations comprehensively
- Property 3.5 and 5.3 are identical (tier assignment) - consolidated into Property 5
- Properties 4.1, 4.2, 4.3 cover all feature gating scenarios - kept separate as they test distinct failure modes
- Property 2.3 and 2.4 cover authentication success/failure - kept separate for clarity

### Core Authentication Properties

**Property 1: User registration creates valid accounts**

*For any* valid email and password (8+ characters), when a user registers, the system should create a user account with a securely hashed password that differs from the plaintext password.

**Validates: Requirements 2.1**

---

**Property 2: Valid credentials create encrypted sessions**

*For any* registered user with valid credentials, when the user logs in, the system should set an encrypted HTTP-only session cookie that contains the user's ID and admin status.

**Validates: Requirements 2.2**

---

**Property 3: Valid session cookies grant access to protected endpoints**

*For any* protected endpoint and any valid session cookie, when a request includes the cookie, the system should authenticate the user and return a non-401 status code.

**Validates: Requirements 2.3**

---

**Property 4: Missing or invalid session cookies are rejected**

*For any* protected endpoint, when a request lacks a valid session cookie, the system should return a 401 status code.

**Validates: Requirements 2.4**

---

### Subscription Tier Management Properties

**Property 5: Tier creation stores complete data**

*For any* valid tier data (name, price_cents, features JSON), when an admin creates a tier, the system should store all fields and return them unchanged when retrieved.

**Validates: Requirements 3.1, 3.4**

---

**Property 6: Tier updates persist changes**

*For any* existing tier and any valid update data, when an admin updates the tier, the system should persist the changes and return the updated data on subsequent retrieval.

**Validates: Requirements 3.2**

---

**Property 7: Tier deletion removes tiers**

*For any* existing tier, when an admin deletes the tier, subsequent attempts to retrieve that tier should fail with a 404 status code.

**Validates: Requirements 3.3**

---

**Property 8: User-tier assignment applies features**

*For any* user and any tier, when an admin assigns the tier to the user, subsequent user lookups should return the assigned tier ID and the user should have access to the tier's features.

**Validates: Requirements 3.5, 5.3**

---

### Feature Gating Properties

**Property 9: Disabled feature flags return 404**

*For any* feature-gated endpoint, when the global feature flag is disabled, requests to that endpoint should return a 404 status code regardless of the user's tier.

**Validates: Requirements 4.1**

---

**Property 10: Enabled flags with tier features grant access**

*For any* feature-gated endpoint, when the global feature flag is enabled and the user's tier includes the required feature, the system should allow access and return a non-403, non-404 status code.

**Validates: Requirements 4.2**

---

**Property 11: Enabled flags without tier features return 403**

*For any* feature-gated endpoint, when the global feature flag is enabled but the user's tier lacks the required feature, the system should return a 403 status code.

**Validates: Requirements 4.3**

---

### Admin Authorization Properties

**Property 12: Admin endpoints require admin authentication**

*For any* admin-only endpoint (tier management, user management, feature flags), when a non-admin user attempts access, the system should return a 403 status code.

**Validates: Requirements 5.1, 5.4**

---

**Property 13: Tier features JSON is validated and stored**

*For any* valid JSON object representing tier features, when an admin creates or updates a tier with that features object, the system should store it and return it unchanged when retrieved.

**Validates: Requirements 5.2**

---

**Property 14: User listings include tier data**

*For any* user with an assigned tier, when an admin retrieves the user list, the returned user data should include the tier ID.

**Validates: Requirements 5.5**

---

### Data Persistence Properties

**Property 15: Database writes persist across restarts**

*For any* data written to the database (users, tiers, feature flags), when the database container is restarted, the data should remain accessible and unchanged.

**Validates: Requirements 12.2**

---

### Error Handling Properties

**Property 16: Errors return appropriate HTTP status codes**

*For any* error condition (invalid input, missing resources, unauthorized access), the system should return an appropriate HTTP status code (400 for bad requests, 404 for not found, 403 for forbidden, 401 for unauthorized, 500 for server errors).

**Validates: Requirements 10.4**

---

**Property 17: Proxy preserves request data**

*For any* HTTP request with headers and body data, when the Nginx proxy routes the request to the backend, the backend should receive all original headers and body data unchanged.

**Validates: Requirements 11.3**

---

## Error Handling

### Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "error": "Error type",
  "message": "Human-readable error description",
  "details": {} // Optional additional context
}
```

### HTTP Status Codes

**Authentication Errors:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Valid token but insufficient permissions (non-admin accessing admin endpoint, or tier lacks feature)

**Resource Errors:**
- `404 Not Found`: Resource doesn't exist or feature flag is disabled
- `409 Conflict`: Resource already exists (duplicate email, tier name)

**Validation Errors:**
- `400 Bad Request`: Invalid input data (malformed email, short password, invalid JSON)

**Server Errors:**
- `500 Internal Server Error`: Unexpected server-side errors
- `503 Service Unavailable`: Database connection failures

### Error Handling Patterns

**Backend:**
```python
# Custom exception classes
class AuthenticationError(Exception): pass  # → 401
class AuthorizationError(Exception): pass   # → 403
class NotFoundError(Exception): pass        # → 404
class ValidationError(Exception): pass      # → 400

# Global exception handler in FastAPI
@app.exception_handler(AuthenticationError)
async def auth_error_handler(request, exc):
    return JSONResponse(
        status_code=401,
        content={"error": "Unauthorized", "message": str(exc)}
    )
```

**Frontend:**
```javascript
// API client error handling
async function apiRequest(method, path, body) {
  const response = await fetch(path, {
    method,
    credentials: 'include',  // Send cookies automatically
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (response.status === 401) {
    // Session expired or invalid - redirect to login
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  if (response.status === 403) {
    // Show upgrade prompt or access denied message
    throw new Error('Access denied - upgrade required');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}
```

### Database Error Handling

**Connection Failures:**
- Retry logic with exponential backoff (3 attempts)
- Graceful degradation: Return 503 if database unavailable
- Health check endpoint reports database status

**Constraint Violations:**
- Unique constraint violations → 409 Conflict
- Foreign key violations → 400 Bad Request
- Not null violations → 400 Bad Request

**Transaction Management:**
- Use SQLAlchemy sessions with automatic rollback on errors
- Explicit commits only after successful operations
- Context managers for session lifecycle

## Testing Strategy

### Overview

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage. Unit tests verify specific examples and integration points, while property-based tests verify universal properties across many randomly generated inputs.

### Property-Based Testing

**Framework:** Hypothesis (Python) for backend, fast-check (JavaScript) for frontend

**Configuration:**
- Minimum 100 iterations per property test
- Shrinking enabled to find minimal failing examples
- Seed-based reproducibility for debugging

**Test Organization:**
- Property tests are co-located with source code in `*_test.py` files
- Each property test includes a comment linking to the design document property
- Format: `# Feature: subscription-tier-starter, Property X: [property description]`

**Example Property Test:**
```python
# Feature: subscription-tier-starter, Property 1: User registration creates valid accounts
from hypothesis import given, strategies as st

@given(
    email=st.emails(),
    password=st.text(min_size=8, max_size=100)
)
def test_registration_creates_valid_accounts(email, password):
    """Property: For any valid email and password, registration creates a hashed account."""
    user = register_user(email, password)
    
    assert user.email == email
    assert user.hashed_password != password
    assert len(user.hashed_password) > 0
    assert verify_password(password, user.hashed_password)
```

**Property Test Coverage:**
- All 17 correctness properties have corresponding property tests
- Generators create realistic test data (valid emails, JSON objects, tier structures)
- Edge cases are handled by generators (empty strings, boundary values, special characters)

### Unit Testing

**Framework:** pytest (Python) for backend, Vitest (JavaScript) for frontend

**Unit Test Focus:**
- Specific examples demonstrating correct behavior
- Integration between components (API routes + database)
- Edge cases not easily expressed as properties
- Configuration and setup verification

**Example Unit Tests:**
```python
def test_health_endpoint_returns_ok():
    """Verify health endpoint returns expected response."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_expired_jwt_is_rejected():
    """Verify expired tokens are rejected."""
    token = create_jwt_token(user_id=1, is_admin=False, expires_in=-1)
    response = client.get("/api/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
```

### Integration Testing

**Docker Compose Test Environment:**
- Separate `docker-compose.test.yml` with test database
- Automated setup and teardown in CI
- Tests run against real services (not mocks)

**Test Scenarios:**
- Full authentication flow (register → login → access protected endpoint)
- Admin workflow (create tier → assign to user → verify access)
- Feature gating flow (toggle flag → verify access changes)
- Data persistence (write data → restart container → verify data exists)

### Test Execution

**Local Development:**
```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

**CI Pipeline:**
1. Build Docker images
2. Run backend unit tests
3. Run frontend unit tests
4. Run property-based tests
5. Start test environment
6. Run integration tests
7. Report coverage

### Coverage Goals

- **Unit test coverage:** 80%+ of core business logic
- **Property test coverage:** All 17 correctness properties implemented
- **Integration test coverage:** All critical user flows (auth, tier management, feature gating)

### Test Data Management

**Generators for Property Tests:**
```python
# Custom Hypothesis strategies
@st.composite
def tier_data(draw):
    return {
        "name": draw(st.text(min_size=1, max_size=50)),
        "price_cents": draw(st.integers(min_value=0, max_value=100000)),
        "features": draw(st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(st.booleans(), st.integers(min_value=0))
        ))
    }
```

**Fixtures for Unit Tests:**
```python
@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(email="test@example.com", hashed_password=hash_password("password123"))
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def admin_user(db_session):
    """Create an admin user."""
    user = User(email="admin@example.com", hashed_password=hash_password("admin123"), is_admin=True)
    db_session.add(user)
    db_session.commit()
    return user
```

## Deployment and Configuration

### Environment Variables

**Backend (`backend/.env`):**
```bash
# Database
DATABASE_URL=postgresql://user:password@db:5432/saas_starter

# Session Security
SESSION_SECRET=your-session-secret-key-change-in-production-32-bytes
SESSION_EXPIRATION_HOURS=24

# Server
DEBUG=true
ALLOWED_ORIGINS=http://localhost
SECURE_COOKIES=false  # Set to true in production with HTTPS

# Admin Bootstrap
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

**Frontend (`frontend/.env`):**
```bash
VITE_API_URL=http://localhost/api
```

### Docker Compose Configuration

**Services:**
1. **nginx**: Reverse proxy (port 80)
2. **frontend**: React + Vite (internal port 5173)
3. **backend**: FastAPI (internal port 8000)
4. **db**: Postgres 15 (internal port 5432)

**Volumes:**
- `./frontend/src:/app/src` - Frontend hot-reload
- `./backend:/app` - Backend hot-reload
- `postgres_data:/var/lib/postgresql/data` - Database persistence

**Networks:**
- Single bridge network for inter-service communication

### Database Initialization

**On First Start:**
1. Create database schema (tables, indexes)
2. Seed default data:
   - Create admin user from environment variables
   - Create example tiers (Free, Pro, Enterprise)
   - Create example feature flags

**Migration Strategy:**
- Use Alembic for schema migrations
- Migrations stored in `backend/migrations/`
- Auto-generate migrations from model changes
- Apply migrations on container start

### Development Workflow

**Initial Setup:**
```bash
# Clone repository
git clone <repo-url>
cd starter-kit

# Start all services
docker compose up --build

# Access application
# Frontend: http://localhost/
# Backend API: http://localhost/api/
# API Docs: http://localhost/api/docs
```

**Making Changes:**
- Frontend: Edit files in `starter-kit/frontend/src/` - changes reflect immediately
- Backend: Edit files in `starter-kit/backend/` - server reloads automatically
- Database schema: Create migration, restart backend container
- Nginx config: Edit `starter-kit/nginx/nginx.conf`, restart nginx container

**Stopping Services:**
```bash
docker compose down          # Stop containers
docker compose down -v       # Stop and remove volumes (fresh start)
```

### Production Considerations

**Security Hardening (Not Implemented in Starter):**
- Change JWT_SECRET to a strong random value
- Use HTTPS with SSL certificates
- Enable rate limiting on authentication endpoints
- Add CSRF protection
- Implement password complexity requirements
- Add email verification for registration
- Enable database connection pooling
- Add request logging and monitoring

**Scaling Considerations:**
- Backend can be horizontally scaled (stateless)
- Use external Postgres service (RDS, Cloud SQL)
- Add Redis for session storage and caching
- Use CDN for frontend static assets
- Add load balancer in front of nginx

**Extension Points:**
- Add payment processing (Stripe integration)
- Add email service (SendGrid, SES)
- Add file storage (S3, Cloud Storage)
- Add background job processing (Celery, RQ)
- Add real-time features (WebSockets)

## Folder Structure

```
/ (workspace root)
├── .kiro/
│   ├── specs/
│   │   └── subscription-tier-starter/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   ├── steering/
│   │   └── minimal-implementation.md
│   └── hooks/
│       └── test-on-save.json
└── starter-kit/
        ├── backend/
    │   ├── models.py              # Database models (User, Tier, FeatureFlag)
    │   ├── auth.py                # Authentication logic (session encryption, password hashing)
    │   ├── database.py            # Database connection and session management
    │   ├── main.py                # FastAPI application entry point
    │   ├── routes/
    │   │   ├── auth.py            # Auth endpoints (register, login, logout)
    │   │   ├── tiers.py           # Tier management endpoints
    │   │   ├── features.py        # Feature flag endpoints
    │   │   ├── health.py          # Health check endpoint
    │   │   └── example.py         # Example gated endpoint
    │   ├── services/
    │   │   └── feature_gate.py    # Feature gating logic
    │   ├── tests/
    │   │   ├── test_auth.py       # Auth tests (unit + property)
    │   │   ├── test_tiers.py      # Tier tests (unit + property)
    │   │   └── test_features.py   # Feature gating tests (unit + property)
    │   ├── migrations/            # Alembic database migrations
    │   ├── requirements.txt       # Python dependencies
    │   ├── Dockerfile
    │   └── .env
    ├── frontend/
    │   ├── src/
    │   │   ├── api/
    │   │   │   └── client.js      # API client with cookie-based auth
    │   │   ├── contexts/
    │   │   │   └── AuthContext.jsx # Auth state management
    │   │   ├── components/
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   └── FeatureGate.jsx
    │   │   ├── pages/
    │   │   │   ├── Auth.jsx       # Login/Register page
    │   │   │   ├── Dashboard.jsx  # User dashboard
    │   │   │   └── Admin.jsx      # Admin panel
    │   │   ├── App.jsx            # Main app component with routing
    │   │   └── main.jsx           # Entry point
    │   ├── tests/
    │   │   └── api.test.js        # API client tests
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── Dockerfile
    │   └── .env
    ├── nginx/
    │   ├── nginx.conf             # Proxy configuration
    │   └── Dockerfile
    ├── docker-compose.yml         # Service orchestration
    ├── docker-compose.test.yml    # Test environment
    ├── .github/
    │   └── workflows/
    │       └── ci.yml             # GitHub Actions CI pipeline
    ├── README.md                  # Quickstart and documentation
    ├── LICENSE                    # OSI-approved license (MIT)
    └── .gitignore

# Extension Points (Comments in Code):

backend/routes/example.py:
  # EXTENSION POINT: Add your own feature-gated endpoints here
  # Follow this pattern: check feature flag + tier feature

backend/models.py:
  # EXTENSION POINT: Add custom fields to User model
  # Example: profile_data, preferences, etc.

frontend/src/pages/Dashboard.jsx:
  # EXTENSION POINT: Add your application-specific UI here
  # This is where your SaaS product features go

backend/services/feature_gate.py:
  # EXTENSION POINT: Add custom feature gating logic
  # Example: time-based features, usage limits, etc.
```

### Key Design Decisions

1. **Minimal Dependencies**: Only essential libraries (React, FastAPI, SQLAlchemy, PyJWT)
2. **No Heavy Frameworks**: Avoid authentication frameworks, use simple JWT implementation
3. **Clear Separation**: Models, routes, services clearly separated
4. **Extension Comments**: Inline comments mark where to add custom logic
5. **Example Patterns**: Each component shows a pattern to follow for extensions
6. **Hot-Reload Enabled**: Volume mounts for both frontend and backend
7. **Single Network**: All services communicate on one Docker network
8. **Environment-Based Config**: All secrets and config in .env files
