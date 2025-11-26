import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Navbar from '../components/Navbar';

export default function GameCatalog() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await apiClient('/games');
      setGames(response);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTierColor = (tierName) => {
    const colors = {
      'Free': '#10B981',
      'Pro': '#F59E0B',
      'Enterprise': '#8B5CF6'
    };
    return colors[tierName] || '#667eea';
  };

  if (loading) {
    return (
      <div className="game-catalog">
        <Navbar />
        <div className="loading">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-catalog">
        <Navbar />
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="game-catalog">
      <Navbar />
      <div className="catalog-header">
        <h1>Game Catalog</h1>
        <p>Choose your game and start playing!</p>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <div className="game-thumbnail" style={{ background: `linear-gradient(135deg, ${getTierColor(game.required_tier_name)} 0%, ${getTierColor(game.required_tier_name)}dd 100%)` }}>
              <div className="game-icon">🎮</div>
            </div>
            <div className="game-info">
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <div className="game-meta">
                <span className="tier-badge" style={{ background: getTierColor(game.required_tier_name) }}>
                  {game.required_tier_name}
                </span>
                {game.has_access ? (
                  <span className="access-badge unlocked">✓ Unlocked</span>
                ) : (
                  <span className="access-badge locked">🔒 Locked</span>
                )}
              </div>
              {game.has_access ? (
                <button
                  className="play-button"
                  onClick={() => navigate(`/play/${game.slug}`)}
                  style={{ background: getTierColor(game.required_tier_name) }}
                >
                  Play Now
                </button>
              ) : (
                <div className="upgrade-prompt">
                  <p>Requires {game.required_tier_name} tier</p>
                  <button
                    className="upgrade-button"
                    onClick={() => navigate('/dashboard')}
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .game-catalog {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .catalog-header {
          text-align: center;
          color: white;
          padding: 60px 20px 40px;
        }

        .catalog-header h1 {
          font-size: 3rem;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .catalog-header p {
          font-size: 1.3rem;
          opacity: 0.95;
        }

        .games-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px 60px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
        }

        .game-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .game-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .game-thumbnail {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .game-icon {
          font-size: 5rem;
        }

        .game-info {
          padding: 25px;
        }

        .game-info h3 {
          font-size: 1.8rem;
          margin-bottom: 10px;
          color: #333;
        }

        .game-info p {
          color: #666;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .game-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tier-badge {
          padding: 5px 15px;
          border-radius: 20px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .access-badge {
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .access-badge.unlocked {
          background: #10B981;
          color: white;
        }

        .access-badge.locked {
          background: #EF4444;
          color: white;
        }

        .play-button {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 50px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .play-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .upgrade-prompt {
          text-align: center;
        }

        .upgrade-prompt p {
          color: #EF4444;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .upgrade-button {
          width: 100%;
          padding: 15px;
          border: 2px solid #EF4444;
          background: white;
          border-radius: 50px;
          color: #EF4444;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upgrade-button:hover {
          background: #EF4444;
          color: white;
        }

        .loading, .error {
          text-align: center;
          color: white;
          font-size: 1.5rem;
          padding: 100px 20px;
          min-height: 50vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .catalog-header h1 {
            font-size: 2rem;
          }

          .games-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
