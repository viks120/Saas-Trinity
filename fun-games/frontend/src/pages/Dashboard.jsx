import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentScores, setRecentScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, scoresData] = await Promise.all([
        api.get('/scores/stats'),
        api.get('/scores/my')
      ]);
      setStats(statsData);
      setRecentScores(scoresData.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  const getTierColor = (tierName) => {
    const colors = {
      'Free': '#10B981',
      'Pro': '#F59E0B',
      'Enterprise': '#8B5CF6'
    };
    return colors[tierName] || '#667eea';
  };

  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="nav-logo">🎮 Fun Games</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/games" className="nav-link">Games</Link>
            <Link to="/dashboard" className="nav-link active">Dashboard</Link>
            {user?.is_admin && <Link to="/admin" className="nav-link">Admin</Link>}
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome back, {user?.email}! 👋</h1>
          <div className="tier-info">
            <span className="tier-badge" style={{ background: getTierColor(user?.tier?.name) }}>
              {user?.tier?.name} Tier
            </span>
            {user?.is_admin && <span className="admin-badge">Admin</span>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button onClick={() => navigate('/games')} className="action-card primary">
            <div className="action-icon">🎮</div>
            <h3>Play Games</h3>
            <p>Browse and play available games</p>
          </button>
          <button onClick={() => navigate('/')} className="action-card secondary">
            <div className="action-icon">🏠</div>
            <h3>Home</h3>
            <p>Return to home page</p>
          </button>
          {user?.is_admin && (
            <button onClick={() => navigate('/admin')} className="action-card admin">
              <div className="action-icon">⚙️</div>
              <h3>Admin Panel</h3>
              <p>Manage games and users</p>
            </button>
          )}
        </div>

        {/* Statistics Section */}
        {!loading && stats && (
          <div className="stats-section">
            <h2>Your Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{stats.total_games_played}</div>
                <div className="stat-label">Games Played</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{stats.favorite_game || 'None'}</div>
                <div className="stat-label">Favorite Game</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{Object.keys(stats.best_scores).length}</div>
                <div className="stat-label">Games Mastered</div>
              </div>
            </div>
          </div>
        )}

        {/* Best Scores */}
        {!loading && stats && Object.keys(stats.best_scores).length > 0 && (
          <div className="scores-section">
            <h2>Your Best Scores</h2>
            <div className="scores-grid">
              {Object.entries(stats.best_scores).map(([game, score]) => (
                <div key={game} className="score-card">
                  <div className="score-game">{game}</div>
                  <div className="score-value">{score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {!loading && recentScores.length > 0 && (
          <div className="activity-section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {recentScores.map((score) => (
                <div key={score.id} className="activity-item">
                  <div className="activity-icon">🎮</div>
                  <div className="activity-details">
                    <div className="activity-game">{score.game_name}</div>
                    <div className="activity-time">{new Date(score.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="activity-score">{score.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && stats && stats.total_games_played === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>No games played yet!</h3>
            <p>Start playing to see your statistics here</p>
            <button onClick={() => navigate('/games')} className="cta-button">
              Browse Games
            </button>
          </div>
        )}
      </div>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .navbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .nav-link {
          color: #333;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }

        .nav-link:hover, .nav-link.active {
          color: #667eea;
        }

        .logout-btn {
          background: #EF4444;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .logout-btn:hover {
          background: #DC2626;
          transform: scale(1.05);
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .welcome-section {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .tier-info {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
        }

        .tier-badge {
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .admin-badge {
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          background: #8B5CF6;
          color: white;
          font-weight: 600;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .action-card {
          background: white;
          border: none;
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .action-card.primary {
          border: 3px solid #667eea;
        }

        .action-card.secondary {
          border: 3px solid #F59E0B;
        }

        .action-card.admin {
          border: 3px solid #8B5CF6;
        }

        .action-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .action-card h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .action-card p {
          color: #666;
          margin: 0;
        }

        .stats-section, .scores-section, .activity-section {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .stats-section h2, .scores-section h2, .activity-section h2 {
          color: #333;
          margin-bottom: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 15px;
          text-align: center;
        }

        .stat-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          opacity: 0.9;
          font-size: 0.9rem;
        }

        .scores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .score-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 15px;
          text-align: center;
        }

        .score-game {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .score-value {
          font-size: 2rem;
          font-weight: bold;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #F9FAFB;
          border-radius: 10px;
          transition: all 0.3s;
        }

        .activity-item:hover {
          background: #F3F4F6;
          transform: translateX(5px);
        }

        .activity-icon {
          font-size: 2rem;
        }

        .activity-details {
          flex: 1;
        }

        .activity-game {
          font-weight: 600;
          color: #333;
        }

        .activity-time {
          font-size: 0.9rem;
          color: #666;
        }

        .activity-score {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 2rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 2rem;
        }

        .cta-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 768px) {
          .nav-links {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .welcome-section h1 {
            font-size: 1.8rem;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
