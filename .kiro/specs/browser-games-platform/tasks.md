# Implementation Plan

- [x] 1. Copy starter-kit to fun-games folder and set up project structure





  - Copy entire starter-kit directory to fun-games/
  - Update docker-compose.yml service names and container names
  - Update README.md with Fun Games branding
  - Verify all services start correctly
  - _Requirements: All_

- [x] 2. Create backend data models for games and scores


  - [x] 2.1 Create Game model in backend/models/game.py


    - Define Game model with id, name, slug, description, thumbnail_url, game_path, required_tier_id, is_active, created_at
    - Add relationship to Tier model
    - Add relationship to Score model
    - _Requirements: 5.1_

  - [ ]* 2.2 Write property test for Game model
    - **Property 8: Game metadata persistence**
    - **Validates: Requirements 5.1**

  - [x] 2.3 Create Score model in backend/models/score.py


    - Define Score model with id, user_id, game_id, score, created_at
    - Add relationships to User and Game models
    - Create indexes for efficient querying (user_id, game_id, score DESC, created_at)
    - _Requirements: 4.1, 4.2_

  - [ ]* 2.4 Write property test for Score model
    - **Property 5: Score persistence with associations**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 2.5 Update models/__init__.py to import new models


    - Import Game and Score models
    - _Requirements: 5.1, 4.1_

- [x] 3. Update seed script with games and tier configuration


  - [x] 3.1 Modify backend/seed.py to create three tiers


    - Create Free tier (price_cents=0) with features: {"tic_tac_toe": true}
    - Create Pro tier (price_cents=999) with features: {"tic_tac_toe": true, "whack_a_mole": true}
    - Create Enterprise tier (price_cents=2999) with features: {"tic_tac_toe": true, "whack_a_mole": true, "memory_match": true}
    - _Requirements: 2.1, 2.2, 2.3, 7.1_

  - [x] 3.2 Add game creation to seed script


    - Create Tic-Tac-Toe game (slug="tic_tac_toe", required_tier_id=Free)
    - Create Whack-a-Mole game (slug="whack_a_mole", required_tier_id=Pro)
    - Create Memory Match game (slug="memory_match", required_tier_id=Enterprise)
    - _Requirements: 5.1_

  - [ ]* 3.3 Write property test for new user tier assignment
    - **Property 11: New user tier assignment**
    - **Validates: Requirements 7.1**

- [x] 4. Implement game access control service


  - [x] 4.1 Create backend/services/game_access.py


    - Implement check_game_access(user, game) function
    - Check if user.tier.features[game.slug] == true
    - Return boolean indicating access
    - _Requirements: 2.1, 2.2, 2.3, 5.4_

  - [ ]* 4.2 Write property test for tier-based access control
    - **Property 1: Tier-based game access control**
    - **Validates: Requirements 2.1, 2.2, 2.3, 5.4, 7.2, 7.3**

  - [ ]* 4.3 Write property test for tier upgrade access
    - **Property 12: Tier upgrade grants immediate access**
    - **Validates: Requirements 7.5, 7.6**

- [x] 5. Create game management API endpoints


  - [x] 5.1 Create backend/routes/games.py


    - Implement GET /api/games (list all games with access status for current user)
    - Implement GET /api/games/{slug} (get game details)
    - Implement POST /api/games (admin only - create game)
    - Implement PUT /api/games/{slug} (admin only - update game)
    - Implement DELETE /api/games/{slug} (admin only - delete game)
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Add games router to backend/main.py


    - Import and include games router
    - _Requirements: 5.1_

  - [ ]* 5.3 Write property test for game deletion preserving scores
    - **Property 9: Game deletion preserves scores**
    - **Validates: Requirements 5.3**

- [x] 6. Create score submission and leaderboard API endpoints


  - [x] 6.1 Create backend/routes/scores.py


    - Implement POST /api/scores (submit score with origin validation)
    - Implement GET /api/scores/my (get current user's scores)
    - Implement GET /api/scores/game/{slug} (get leaderboard for game)
    - Implement GET /api/scores/stats (get user statistics)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.4, 8.1_

  - [x] 6.2 Add scores router to backend/main.py


    - Import and include scores router
    - _Requirements: 4.1_

  - [ ]* 6.3 Write property test for personal best calculation
    - **Property 6: Personal best scores calculation**
    - **Validates: Requirements 4.3**

  - [ ]* 6.4 Write property test for leaderboard ordering
    - **Property 7: Leaderboard top 10 ordering**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 6.5 Write property test for postMessage origin validation
    - **Property 10: postMessage origin validation**
    - **Validates: Requirements 6.3, 6.4, 8.1**

- [x] 7. Create statistics calculation service


  - [x] 7.1 Create backend/services/statistics.py


    - Implement calculate_user_stats(user_id) function
    - Calculate total games played, favorite game, best scores per game
    - Calculate average scores per game
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 7.2 Write property test for statistics calculation
    - **Property 14: Statistics calculation accuracy**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ] 8. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Tic-Tac-Toe game


  - [x] 9.1 Create frontend/public/games/tic-tac-toe/index.html


    - Create HTML structure with 3x3 grid
    - Include style.css and game.js
    - _Requirements: 3.1, 7.2_

  - [x] 9.2 Create frontend/public/games/tic-tac-toe/style.css


    - Style game board with colorful, fun design
    - Add hover effects and animations
    - Make responsive
    - _Requirements: 10.1, 10.2_

  - [x] 9.3 Create frontend/public/games/tic-tac-toe/game.js


    - Implement game logic (turn-based, win detection)
    - Implement postMessage communication for score submission
    - Listen for PLATFORM_READY, PAUSE_GAME, RESUME_GAME events
    - Send GAME_READY and GAME_SCORE events
    - Calculate score based on moves to win
    - _Requirements: 3.1, 3.5, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 9.4 Write unit tests for Tic-Tac-Toe game logic
    - Test win detection
    - Test turn switching
    - Test score calculation
    - _Requirements: 3.1_

- [x] 10. Implement Whack-a-Mole game


  - [x] 10.1 Create frontend/public/games/whack-a-mole/index.html


    - Create HTML structure with mole holes
    - Include style.css and game.js
    - _Requirements: 3.1, 7.5_

  - [x] 10.2 Create frontend/public/games/whack-a-mole/style.css


    - Style game board with playful mole graphics
    - Add pop-up animations
    - Make responsive
    - _Requirements: 10.1, 10.2_

  - [x] 10.3 Create frontend/public/games/whack-a-mole/game.js


    - Implement game logic (random mole appearances, click detection, timer)
    - Implement postMessage communication
    - Listen for platform events
    - Send score based on moles whacked
    - _Requirements: 3.1, 3.5, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 10.4 Write unit tests for Whack-a-Mole game logic
    - Test mole spawning
    - Test score calculation
    - Test timer functionality
    - _Requirements: 3.1_

- [x] 11. Implement Memory Match game


  - [x] 11.1 Create frontend/public/games/memory-match/index.html


    - Create HTML structure with card grid
    - Include style.css and game.js
    - _Requirements: 3.1, 7.6_

  - [x] 11.2 Create frontend/public/games/memory-match/style.css


    - Style cards with flip animations
    - Add colorful card designs
    - Make responsive
    - _Requirements: 10.1, 10.2_

  - [x] 11.3 Create frontend/public/games/memory-match/game.js


    - Implement game logic (card flipping, matching, shuffle)
    - Implement postMessage communication
    - Listen for platform events
    - Send score based on moves and time
    - _Requirements: 3.1, 3.5, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.4 Write unit tests for Memory Match game logic
    - Test card matching
    - Test shuffle algorithm
    - Test score calculation
    - _Requirements: 3.1_

- [x] 12. Update Nginx configuration for game files


  - [x] 12.1 Modify nginx/nginx.conf


    - Add location /games/ route to serve static game files
    - Add X-Frame-Options: SAMEORIGIN header
    - Add Content-Security-Policy: frame-ancestors 'self' header
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 13. Create Home page component


  - [x] 13.1 Create frontend/src/pages/Home.jsx


    - Create hero section with platform branding
    - Display all three games in vibrant cards
    - Show CTA for non-authenticated users
    - Show personalized content for authenticated users
    - Use playful colors and animations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1_

  - [ ]* 13.2 Write unit tests for Home page
    - Test authenticated vs non-authenticated views
    - Test game card rendering
    - _Requirements: 1.3, 1.4_

- [x] 14. Create Game Catalog page


  - [x] 14.1 Create frontend/src/pages/GameCatalog.jsx


    - Fetch games from API with access status
    - Display games in grid layout
    - Show lock/unlock indicators based on tier
    - Show upgrade prompts for locked games
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 14.2 Write unit tests for Game Catalog
    - Test game filtering by tier
    - Test lock/unlock display logic
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 15. Create GameCard component
  - [ ] 15.1 Create frontend/src/components/GameCard.jsx
    - Display game title, description, thumbnail
    - Show tier badge with distinct colors
    - Show play button or lock icon
    - Add hover effects and transitions
    - _Requirements: 2.4, 2.5, 10.2, 10.3_

  - [ ]* 15.2 Write property test for game card rendering
    - **Property 2: Game card displays required fields**
    - **Validates: Requirements 2.4**

  - [ ]* 15.3 Write property test for locked game display
    - **Property 3: Locked game displays upgrade prompt**
    - **Validates: Requirements 2.5**

  - [ ]* 15.4 Write property test for tier badge distinctness
    - **Property 15: Tier badge distinctness**
    - **Validates: Requirements 10.3**

- [x] 16. Create Game Player component


  - [x] 16.1 Create frontend/src/pages/GamePlayer.jsx


    - Create full-screen iframe container
    - Render game in sandboxed iframe with restricted permissions
    - Add exit button overlay
    - Show loading indicator while game loads
    - Show error message if game fails to load
    - Implement postMessage listener for score submission
    - Send PLATFORM_READY event to game
    - Validate message origin before accepting scores
    - Submit scores to backend API
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 16.2 Write property test for iframe sandbox attributes
    - **Property 4: Game loads in sandboxed iframe**
    - **Validates: Requirements 3.1, 6.1**

  - [ ]* 16.3 Write property test for message schema validation
    - **Property 13: Message schema validation**
    - **Validates: Requirements 8.5**

  - [ ]* 16.4 Write unit tests for Game Player
    - Test loading states
    - Test error handling
    - Test exit functionality
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 17. Create Statistics Display component
  - [ ] 17.1 Create frontend/src/components/StatsDisplay.jsx
    - Display total games played, favorite game, best scores
    - Show game-specific statistics with charts
    - Handle empty state with encouraging messages
    - Add celebratory animations for new records
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

  - [ ]* 17.2 Write unit tests for Statistics Display
    - Test data rendering
    - Test empty state
    - _Requirements: 9.4_

- [ ] 18. Update Dashboard page with game statistics
  - [ ] 18.1 Modify frontend/src/pages/Dashboard.jsx
    - Add StatsDisplay component
    - Fetch user statistics from API
    - Show recent scores
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 19. Update Admin panel with game management
  - [ ] 19.1 Modify frontend/src/pages/Admin.jsx
    - Add game management section
    - Show all games with tier assignments
    - Add forms for creating/updating games
    - Add delete functionality with confirmation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 19.2 Write unit tests for Admin game management
    - Test game creation form
    - Test game update form
    - Test delete confirmation
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 20. Update App routing


  - [x] 20.1 Modify frontend/src/App.jsx


    - Add route for Home page (/)
    - Add route for Game Catalog (/games)
    - Add route for Game Player (/play/:slug)
    - Update Dashboard route
    - _Requirements: 1.1, 2.1, 3.1_

- [x] 21. Apply fun, colorful design system



  - [x] 21.1 Update frontend/src/index.css


    - Define vibrant color palette (primary blue, secondary orange, success green)
    - Add playful gradient backgrounds
    - Define smooth transitions and animations
    - Add fun loading animations
    - Style tier badges with distinct colors
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 22. Update README and documentation
  - [ ] 22.1 Update fun-games/README.md
    - Replace starter-kit branding with Fun Games
    - Document the three games and tier structure
    - Add game development guide
    - Document postMessage API
    - Update quick start instructions
    - _Requirements: All_

- [ ] 23. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Manual testing and polish
  - Test complete user flows (registration, game play, score submission, leaderboards)
  - Test tier upgrades and access changes
  - Verify all three games work correctly
  - Test on different browsers
  - Verify responsive design on mobile
  - Test accessibility (keyboard navigation, screen readers)
  - Polish animations and transitions
  - _Requirements: All_
