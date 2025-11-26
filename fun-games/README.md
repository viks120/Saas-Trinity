# Fun Games Platform

A vibrant browser-based gaming platform where users can play simple HTML/CSS/JavaScript games directly in their browser. Built with FastAPI, React, PostgreSQL, and Docker, featuring tier-based game access and a fun, colorful design.

## Overview

Fun Games Platform provides:
- 🎮 Three engaging browser games (Tic-Tac-Toe, Whack-a-Mole, Memory Match)
- 🔐 Secure authentication with session management
- 💳 Tier-based game access (Free, Pro, Enterprise)
- 🏆 Score tracking and leaderboards
- 📊 Player statistics and achievements
- 🎨 Fun, colorful, playful design
- 🐳 Docker-based deployment with hot-reload

## Quick Start

```bash
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

- **Email**: `admin@fungames.com`
- **Password**: `admin123`

## Games & Tiers

### Free Tier (Default)
- ✅ Tic-Tac-Toe

### Pro Tier ($9.99/month)
- ✅ Tic-Tac-Toe
- ✅ Whack-a-Mole

### Enterprise Tier ($29.99/month)
- ✅ Tic-Tac-Toe
- ✅ Whack-a-Mole
- ✅ Memory Match

## Project Structure

```
fun-games/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── .kiro/
│   └── specs/
│       └── browser-games-platform/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
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
│   │   ├── feature_flag.py
│   │   ├── game.py           # NEW: Game model
│   │   └── score.py          # NEW: Score model
│   ├── routes/                # API endpoints
│   │   ├── auth.py
│   │   ├── tiers.py
│   │   ├── features.py
│   │   ├── admin.py
│   │   ├── health.py
│   │   ├── games.py          # NEW: Game management
│   │   └── scores.py         # NEW: Score tracking
│   └── services/              # Business logic
│       ├── feature_gate.py
│       ├── game_access.py    # NEW: Game access control
│       └── statistics.py     # NEW: Stats calculation
└── frontend/                   # React + Vite
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   └── games/             # NEW: Static game files
    │       ├── tic-tac-toe/
    │       ├── whack-a-mole/
    │       └── memory-match/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── client.js
        ├── contexts/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── FeatureGate.jsx
        │   ├── GameCard.jsx      # NEW: Game display
        │   └── StatsDisplay.jsx  # NEW: Statistics
        └── pages/
            ├── Auth.jsx
            ├── Dashboard.jsx
            ├── Admin.jsx
            ├── Home.jsx          # NEW: Landing page
            ├── GameCatalog.jsx   # NEW: Browse games
            └── GamePlayer.jsx    # NEW: Play games
```

## Architecture

### Services

The application consists of four Docker services:

1. **fun-games-nginx** (port 80): Reverse proxy
   - Routes `/` to frontend
   - Routes `/api/` to backend
   - Routes `/games/` to static game files

2. **fun-games-frontend** (internal port 5173): React + Vite
   - Home page with game showcase
   - Game catalog with tier-based access
   - Game player with iframe sandboxing
   - Statistics dashboard

3. **fun-games-backend** (internal port 8000): FastAPI
   - Game management API
   - Score submission and leaderboards
   - Statistics calculation
   - Tier-based access control

4. **fun-games-db** (internal port 5432): PostgreSQL 15
   - User and tier data
   - Game metadata
   - Score records

### Game Communication

Games run in sandboxed iframes and communicate with the platform via postMessage:

**Platform → Game Events:**
- `PLATFORM_READY`: Platform initialized, game can start
- `PAUSE_GAME`: User paused or switched tabs
- `RESUME_GAME`: User resumed

**Game → Platform Events:**
- `GAME_READY`: Game loaded and ready
- `GAME_SCORE`: Submit final score

### Security

- Games run in sandboxed iframes with restricted permissions
- postMessage origin validation prevents score manipulation
- Session-based authentication with encrypted cookies
- Admin-only game management endpoints

## Development

### Hot Reload

Both frontend and backend support hot-reload:

- **Frontend**: Edit files in `frontend/src/` - Vite automatically reloads
- **Backend**: Edit files in `backend/` - Uvicorn automatically reloads
- **Games**: Edit files in `frontend/public/games/` - Refresh browser

### Adding New Games

1. Create game directory in `frontend/public/games/your-game/`
2. Implement `index.html`, `style.css`, `game.js`
3. Use postMessage API for score submission
4. Add game to database via admin panel
5. Assign to appropriate tier

### Game Development Guide

Each game must implement the platform communication protocol:

```javascript
// Listen for platform events
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  
  if (event.data.type === 'PLATFORM_READY') {
    // Initialize game
  }
  if (event.data.type === 'PAUSE_GAME') {
    // Pause game logic
  }
  if (event.data.type === 'RESUME_GAME') {
    // Resume game logic
  }
});

// Send score to platform
function submitScore(score) {
  window.parent.postMessage({
    type: 'GAME_SCORE',
    score: score,
    timestamp: Date.now()
  }, window.location.origin);
}

// Notify platform game is ready
window.parent.postMessage({
  type: 'GAME_READY'
}, window.location.origin);
```

## Environment Variables

Backend configuration in `docker-compose.yml`:

```yaml
environment:
  # Database
  - DATABASE_URL=postgresql://fun_games_user:fun_games_password@fun-games-db:5432/fun_games
  
  # Session Security
  - SESSION_SECRET=your-32-byte-secret-key
  - SESSION_EXPIRATION_HOURS=24
  
  # Server
  - DEBUG=true
  - ALLOWED_ORIGINS=http://localhost
  - SECURE_COOKIES=false  # Set true in production
  
  # Admin Bootstrap
  - ADMIN_EMAIL=admin@fungames.com
  - ADMIN_PASSWORD=admin123
  
  # Game Configuration
  - GAME_ORIGIN=http://localhost
  - MAX_SCORE_VALUE=999999
```

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

Property-based tests validate correctness properties using Hypothesis (Python) and fast-check (JavaScript).

## Stopping Services

```bash
# Stop services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v

# View logs
docker compose logs -f

# Restart a single service
docker compose restart fun-games-backend
```

## Troubleshooting

**Services won't start:**
- Check Docker is running
- Ensure ports 80, 5173, 8000, 5432 are available
- Try `docker compose down -v` and rebuild

**Database connection errors:**
- Wait for database to fully initialize (can take 30 seconds)
- Check `docker compose logs fun-games-db` for errors

**Game not loading:**
- Check browser console for errors
- Verify game files exist in `frontend/public/games/`
- Check nginx logs: `docker compose logs fun-games-nginx`

**Score not submitting:**
- Verify postMessage origin matches
- Check browser console for validation errors
- Ensure user has access to the game

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the `.kiro/specs/browser-games-platform/` directory for detailed documentation
- Review the design document for architecture decisions
- Examine the tasks document for implementation details
