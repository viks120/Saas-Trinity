# Design Document

## Overview

Fun Games is a browser-based gaming platform built on top of the existing starter-kit scaffold. The platform will be deployed in a new `fun-games/` directory by copying the starter-kit and adapting it for game-specific functionality. The core authentication, tier management, and feature gating systems remain intact, while new components are added for game management, gameplay, score tracking, and a vibrant, fun user interface.

The platform hosts three HTML/CSS/JavaScript games:
1. **Tic-Tac-Toe** (Free tier)
2. **Whack-a-Mole** (Pro tier) 
3. **Memory Match** (Enterprise tier)

Games are rendered in sandboxed iframes and communicate with the platform via the postMessage API for score submission and event handling.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (Port 80)                      │
│  Routes: / → Frontend, /api/ → Backend, /games/ → Games     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
┌───────────────▼──────────┐   ┌───────────▼────────────┐
│   React Frontend         │   │   FastAPI Backend      │
│   - Home Page            │   │   - Game API           │
│   - Game Catalog         │   │   - Score API          │
│   - Game Player          │   │   - Stats API          │
│   - Dashboard/Stats      │   │   - Auth (existing)    │
│   - Admin Panel          │   │   - Tiers (existing)   │
└──────────────────────────┘   └────────────┬───────────┘
                                            │
                              ┌─────────────▼───────────┐
                              │   PostgreSQL Database   │
                              │   - users               │
                              │   - tiers               │
                              │   - games (new)         │
                              │   - scores (new)        │
                              └─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Static Game Files                         │
│   /games/tic-tac-toe/index.html                             │
│   /games/whack-a-mole/index.html                            │
│   /games/memory-match/index.html                            │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**From Starter Kit (Keep As-Is):**
- Authentication system (cookie-based sessions)
- User model and management
- Tier model and management
- Feature flag system
- Admin authentication and authorization
- Database connection and ORM setup
- Docker orchestration

**From Starter Kit (Modify):**
- Frontend Dashboard → Add game statistics
- Frontend Admin Panel → Add game management
- Seed script → Add game and tier data
- Tier features JSON → Define game access

**New Components:**
- Game model (backend)
- Score model (backend)
- Game routes (backend API)
- Score routes (backend API)
- Statistics service (backend)
- Home page (frontend)
- Game catalog page (frontend)
- Game player component (frontend)
- Three game implementations (static HTML/CSS/JS)
- postMessage communication layer

## Components and Interfaces

### Backend Models

#### Game Model (New)
```python
class Game(Base):
    __tablename__ = "games"
    
    id: int (primary key)
    name: str (unique, indexed)
    slug: str (unique, indexed, URL-friendly)
    description: str
    thumbnail_url: str
    game_path: str  # e.g., "/games/tic-tac-toe/index.html"
    required_tier_id: int (foreign key to tiers)
    is_active: bool (default True)
    created_at: datetime
    
    # Relationships
    required_tier: Tier
    scores: List[Score]
```

#### Score Model (New)
```python
class Score(Base):
    __tablename__ = "scores"
    
    id: int (primary key)
    user_id: int (foreign key, indexed)
    game_id: int (foreign key, indexed)
    score: int
    created_at: datetime (indexed)
    
    # Relationships
    user: User
    game: Game
    
    # Indexes
    Index('idx_user_game', user_id, game_id)
    Index('idx_game_score', game_id, score.desc())
```

### Backend API Endpoints

#### Game Routes (New)
```
GET    /api/games              - List all games with access status
GET    /api/games/{slug}       - Get game details
POST   /api/games              - Create game (admin only)
PUT    /api/games/{slug}       - Update game (admin only)
DELETE /api/games/{slug}       - Delete game (admin only)
```

#### Score Routes (New)
```
POST   /api/scores             - Submit score (authenticated)
GET    /api/scores/my          - Get current user's scores
GET    /api/scores/game/{slug} - Get leaderboard for game
GET    /api/scores/stats       - Get user statistics
```

### Frontend Pages

#### Home Page (New)
- Hero section with platform branding
- Game showcase cards (all 3 games)
- Tier badges and visual indicators
- CTA for non-authenticated users
- Personalized content for authenticated users

#### Game Catalog (New)
- Grid of game cards
- Lock/unlock indicators based on tier
- Upgrade prompts for locked games
- Play buttons for accessible games

#### Game Player (New)
- Full-screen iframe container
- Sandboxed iframe with game
- Exit button overlay
- Score submission handling
- Loading and error states

#### Dashboard (Modified)
- Existing tier information
- Add: Game statistics section
- Add: Recent scores
- Add: Favorite game indicator

#### Admin Panel (Modified)
- Existing user/tier management
- Add: Game management interface
- Add: Game-tier assignment

### Frontend Components

#### GameCard Component (New)
```jsx
<GameCard 
  game={game}
  isLocked={!hasAccess}
  onPlay={() => navigate(`/play/${game.slug}`)}
  onUpgrade={() => navigate('/admin')}
/>
```

#### GamePlayer Component (New)
```jsx
<GamePlayer
  gameUrl={game.game_path}
  onScoreSubmit={(score) => submitScore(game.id, score)}
  onExit={() => navigate('/games')}
/>
```

#### StatsDisplay Component (New)
```jsx
<StatsDisplay
  totalGamesPlayed={stats.total}
  favoriteGame={stats.favorite}
  bestScores={stats.best_scores}
/>
```

### Game Implementation Structure

Each game is a standalone HTML/CSS/JS application:

```
frontend/public/games/
├── tic-tac-toe/
│   ├── index.html
│   ├── style.css
│   └── game.js
├── whack-a-mole/
│   ├── index.html
│   ├── style.css
│   └── game.js
└── memory-match/
    ├── index.html
    ├── style.css
    └── game.js
```

Each game implements the platform communication protocol:

```javascript
// Listen for platform events
window.addEventListener('message', (event) => {
  if (event.data.type === 'PLATFORM_READY') {
    // Platform is ready, game can initialize
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

## Data Models

### Database Schema

```sql
-- Existing tables (from starter-kit)
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  tier_id INTEGER REFERENCES tiers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  price_cents INTEGER NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New tables
games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  game_path VARCHAR(500) NOT NULL,
  required_tier_id INTEGER REFERENCES tiers(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_tier ON games(required_tier_id);

scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  game_id INTEGER REFERENCES games(id) NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_scores_game ON scores(game_id);
CREATE INDEX idx_scores_user_game ON scores(user_id, game_id);
CREATE INDEX idx_scores_game_score ON scores(game_id, score DESC);
CREATE INDEX idx_scores_created ON scores(created_at DESC);
```

### Tier Configuration

The three tiers will be configured with game access in their features JSON:

```json
{
  "name": "Free",
  "price_cents": 0,
  "features": {
    "tic_tac_toe": true,
    "whack_a_mole": false,
    "memory_match": false
  }
}

{
  "name": "Pro",
  "price_cents": 999,
  "features": {
    "tic_tac_toe": true,
    "whack_a_mole": true,
    "memory_match": false
  }
}

{
  "name": "Enterprise",
  "price_cents": 2999,
  "features": {
    "tic_tac_toe": true,
    "whack_a_mole": true,
    "memory_match": true
  }
}
```

### Game Access Control

Game access is determined by:
1. User's tier_id
2. Game's required_tier_id
3. Tier's features JSON containing the game slug

The backend will check: `user.tier.features[game.slug] == true`

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tier-based game access control
*For any* user and game combination, the user should have access to the game if and only if their tier's features JSON includes the game slug set to true
**Validates: Requirements 2.1, 2.2, 2.3, 5.4, 7.2, 7.3**

### Property 2: Game card displays required fields
*For any* game, when rendered as a card, the output should contain the game title, description, thumbnail, tier badge, and either a play button or lock icon
**Validates: Requirements 2.4**

### Property 3: Locked game displays upgrade prompt
*For any* game that a user cannot access, viewing that game should display the required tier name and an upgrade button
**Validates: Requirements 2.5**

### Property 4: Game loads in sandboxed iframe
*For any* playable game, when loaded, it should be rendered within an iframe element with sandbox attributes that restrict permissions
**Validates: Requirements 3.1, 6.1**

### Property 5: Score persistence with associations
*For any* game session that ends with a score, persisting that score should create a database record associated with the correct user ID, game ID, and timestamp
**Validates: Requirements 4.1, 4.2**

### Property 6: Personal best scores calculation
*For any* user with score history, their personal best score for each game should equal the maximum score they achieved for that game
**Validates: Requirements 4.3**

### Property 7: Leaderboard top 10 ordering
*For any* game with scores, the leaderboard should display exactly the top 10 scores in descending order, with ties broken by earliest timestamp
**Validates: Requirements 4.4, 4.5**

### Property 8: Game metadata persistence
*For any* game created by an administrator, all provided metadata fields (title, description, thumbnail URL, game URL, tier requirement) should be retrievable from the database
**Validates: Requirements 5.1**

### Property 9: Game deletion preserves scores
*For any* game with associated scores, deleting the game should remove it from the catalog but preserve all score records in the database
**Validates: Requirements 5.3**

### Property 10: postMessage origin validation
*For any* score submission via postMessage, the platform should only accept the score if the message origin matches the expected game origin
**Validates: Requirements 6.3, 6.4, 8.1**

### Property 11: New user tier assignment
*For any* new user registration, the user should be automatically assigned to the tier with name "Free"
**Validates: Requirements 7.1**

### Property 12: Tier upgrade grants immediate access
*For any* user whose tier is upgraded, they should immediately gain access to all games included in the new tier's features
**Validates: Requirements 7.5, 7.6**

### Property 13: Message schema validation
*For any* incoming postMessage from a game, the platform should validate that the message structure matches the defined schema before processing
**Validates: Requirements 8.5**

### Property 14: Statistics calculation accuracy
*For any* user, their displayed statistics (total games played, best scores, average scores) should match the values calculated from their score records in the database
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 15: Tier badge distinctness
*For any* two different tiers, their badge representations should be visually distinct (different colors, icons, or text)
**Validates: Requirements 10.3**

## Error Handling

### Backend Error Handling

**Authentication Errors:**
- 401 Unauthorized: Invalid or expired session
- 403 Forbidden: Valid session but insufficient permissions

**Game Access Errors:**
- 403 Forbidden: User's tier does not include the requested game
- 404 Not Found: Game does not exist or is inactive

**Score Submission Errors:**
- 400 Bad Request: Invalid score data format
- 403 Forbidden: Origin validation failed
- 422 Unprocessable Entity: Score value out of valid range

**Admin Operation Errors:**
- 403 Forbidden: User is not an administrator
- 409 Conflict: Game slug already exists
- 400 Bad Request: Invalid tier assignment

### Frontend Error Handling

**Network Errors:**
- Display user-friendly error messages
- Provide retry mechanisms
- Gracefully degrade functionality

**Game Loading Errors:**
- Show error message with game name
- Provide "Return to Catalog" button
- Log error details for debugging

**Score Submission Errors:**
- Retry failed submissions automatically (up to 3 times)
- Show notification if submission ultimately fails
- Cache score locally for manual retry

### iframe Security

**Sandbox Attributes:**
```html
<iframe 
  sandbox="allow-scripts allow-same-origin"
  src="/games/tic-tac-toe/index.html"
></iframe>
```

This prevents:
- Form submission
- Pop-ups
- Top-level navigation
- Pointer lock
- Downloads

**Content Security Policy:**
```
frame-ancestors 'self';
```

This prevents games from being embedded in external sites.

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**
- Model validation and relationships
- API endpoint responses and status codes
- Authentication and authorization logic
- Score calculation and ranking algorithms
- Game access control logic
- postMessage validation

**Frontend Unit Tests:**
- Component rendering with various props
- User interaction handlers
- API client request formatting
- Error state handling
- Tier badge rendering

**Game Unit Tests:**
- Game logic (win conditions, scoring)
- postMessage communication
- Event handling

### Property-Based Testing

We will use **Hypothesis** (Python) for backend property-based tests and **fast-check** (JavaScript) for frontend tests.

**Backend Property Tests:**
- Property 1: Tier-based access control (100 iterations)
- Property 5: Score persistence (100 iterations)
- Property 6: Personal best calculation (100 iterations)
- Property 7: Leaderboard ordering (100 iterations)
- Property 10: Origin validation (100 iterations)
- Property 11: New user tier assignment (100 iterations)
- Property 14: Statistics calculation (100 iterations)

**Frontend Property Tests:**
- Property 2: Game card rendering (100 iterations)
- Property 4: iframe sandbox attributes (100 iterations)

Each property-based test will:
1. Generate random valid inputs
2. Execute the system behavior
3. Assert the property holds
4. Report any counterexamples

### Integration Testing

**End-to-End Flows:**
- User registration → Free tier assignment → Play Tic-Tac-Toe → Submit score → View leaderboard
- Admin login → Create game → Assign to tier → User attempts access
- User upgrade → Immediate access to new games
- Game iframe → postMessage score → Backend validation → Database persistence

### Manual Testing

**Visual Design Testing:**
- Verify color palette and animations (Requirement 10)
- Test responsive design on various screen sizes
- Validate accessibility (keyboard navigation, screen readers)

**Game Testing:**
- Play each game to completion
- Verify score submission works
- Test pause/resume functionality
- Verify exit button works

## Design Decisions and Rationale

### Why iframe Sandboxing?

Games are untrusted code that could potentially:
- Steal session cookies
- Manipulate the parent DOM
- Redirect users to malicious sites
- Access sensitive user data

Sandboxed iframes provide strong isolation while allowing controlled communication via postMessage.

### Why postMessage for Communication?

postMessage is the standard browser API for cross-origin communication. It provides:
- Origin validation built-in
- Structured data transfer
- Event-based architecture
- No shared state between contexts

### Why Static Game Files?

Hosting games as static HTML/CSS/JS files:
- Simplifies deployment (no build step per game)
- Allows easy addition of new games
- Reduces backend complexity
- Enables CDN caching
- Makes games portable

### Why Separate Score Table?

Rather than embedding scores in the Game model:
- Enables efficient querying (indexed by user, game, score)
- Supports historical tracking
- Allows for future analytics
- Maintains referential integrity even if games are deleted

### Why Feature JSON in Tiers?

Using JSON for tier features rather than a junction table:
- Simpler schema
- Easier to query (single table lookup)
- Flexible for future feature types
- Matches existing starter-kit pattern

### Why Three Specific Games?

- **Tic-Tac-Toe**: Simple, universally known, quick to implement, good for Free tier
- **Whack-a-Mole**: More engaging, requires timing/skill, good Pro tier incentive
- **Memory Match**: Most complex, requires strategy, justifies Enterprise tier

### Visual Design Philosophy

The platform should feel:
- **Playful**: Bright colors, rounded corners, fun animations
- **Welcoming**: Clear CTAs, encouraging messages, low barrier to entry
- **Rewarding**: Celebrate achievements, show progress, provide feedback
- **Professional**: Clean layout, consistent spacing, readable typography

Color Palette Suggestion:
- Primary: Vibrant blue (#4F46E5)
- Secondary: Energetic orange (#F59E0B)
- Success: Fresh green (#10B981)
- Background: Light gray (#F9FAFB)
- Text: Dark gray (#111827)

## Deployment Considerations

### Project Structure

```
fun-games/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .kiro/
│   └── specs/
│       └── browser-games-platform/
├── docker-compose.yml
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf (add /games/ route)
├── backend/
│   ├── models/
│   │   ├── game.py (new)
│   │   └── score.py (new)
│   ├── routes/
│   │   ├── games.py (new)
│   │   └── scores.py (new)
│   ├── services/
│   │   └── statistics.py (new)
│   └── seed.py (modify)
└── frontend/
    ├── public/
    │   └── games/
    │       ├── tic-tac-toe/
    │       ├── whack-a-mole/
    │       └── memory-match/
    └── src/
        ├── pages/
        │   ├── Home.jsx (new)
        │   ├── GameCatalog.jsx (new)
        │   └── GamePlayer.jsx (new)
        └── components/
            ├── GameCard.jsx (new)
            └── StatsDisplay.jsx (new)
```

### Environment Variables

Add to docker-compose.yml:
```yaml
environment:
  - GAME_ORIGIN=http://localhost  # For postMessage validation
  - MAX_SCORE_VALUE=999999        # Prevent score manipulation
```

### Database Migration

The seed script will:
1. Create three tiers (Free, Pro, Enterprise)
2. Create three games (Tic-Tac-Toe, Whack-a-Mole, Memory Match)
3. Assign games to appropriate tiers
4. Create admin user
5. Create sample users for testing

### Nginx Configuration

Add route for static game files:
```nginx
location /games/ {
    alias /usr/share/nginx/html/games/;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header Content-Security-Policy "frame-ancestors 'self'";
}
```

## Future Enhancements

Potential features for future iterations:
- Multiplayer games with WebSocket support
- Achievement system with badges
- Social features (friend lists, challenges)
- Game difficulty levels
- Time-limited events and tournaments
- User-uploaded custom games
- Mobile app with React Native
- Game analytics and heatmaps
- Replay system for games
- Chat system for players

## Summary

This design builds upon the solid foundation of the starter-kit, adding game-specific functionality while maintaining the existing authentication and tier management systems. The architecture prioritizes security through iframe sandboxing, provides clear separation of concerns, and enables easy addition of new games in the future. The property-based testing approach ensures correctness across a wide range of inputs, while the fun, engaging visual design creates an enjoyable user experience.
