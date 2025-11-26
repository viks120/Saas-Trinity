import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useContext(AuthContext);

  const games = [
    {
      name: 'Tic-Tac-Toe',
      slug: 'tic_tac_toe',
      description: 'Classic two-player strategy game on a 3x3 grid',
      tier: 'Free',
      color: '#667eea'
    },
    {
      name: 'Whack-a-Mole',
      slug: 'whack_a_mole',
      description: 'Fast-paced reaction game - click the moles!',
      tier: 'Pro',
      color: '#f5576c'
    },
    {
      name: 'Memory Match',
      slug: 'memory_match',
      description: 'Test your memory with matching pairs',
      tier: 'Enterprise',
      color: '#4facfe'
    }
  ];

  return (
    <div className="home-page">
      <Navbar />
      <div className="hero-section">
        <h1 className="hero-title">🎮 Fun Games Platform</h1>
        <p className="hero-subtitle">Play amazing browser games instantly!</p>
        {!user && (
          <div className="hero-cta">
            <Link to="/auth" className="cta-button">
              Sign Up & Play Free
            </Link>
          </div>
        )}
        {user && (
          <div className="hero-welcome">
            <p>Welcome back, {user.email}!</p>
            <p className="tier-badge" style={{ background: getTierColor(user.tier?.name) }}>
              {user.tier?.name} Tier
            </p>
          </div>
        )}
      </div>

      <div className="games-showcase">
        <h2>Our Games</h2>
        <div className="games-grid">
          {games.map((game) => (
            <div key={game.slug} className="game-card" style={{ borderColor: game.color }}>
              <div className="game-card-header" style={{ background: game.color }}>
                <h3>{game.name}</h3>
                <span className="tier-label">{game.tier}</span>
              </div>
              <div className="game-card-body">
                <p>{game.description}</p>
                {user ? (
                  <Link to="/games" className="game-button" style={{ background: game.color }}>
                    View Game
                  </Link>
                ) : (
                  <Link to="/auth" className="game-button" style={{ background: game.color }}>
                    Sign Up to Play
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .home-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .hero-section {
          text-align: center;
          padding: 80px 20px;
          color: white;
        }

        .hero-title {
          font-size: 4rem;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          animation: fadeInDown 0.8s ease;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          margin-bottom: 40px;
          opacity: 0.95;
          animation: fadeInUp 0.8s ease;
        }

        .hero-cta {
          animation: fadeIn 1s ease;
        }

        .cta-button {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 18px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-size: 1.3rem;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
        }

        .hero-welcome {
          animation: fadeIn 0.8s ease;
        }

        .hero-welcome p {
          font-size: 1.3rem;
          margin: 10px 0;
        }

        .tier-badge {
          display: inline-block;
          padding: 10px 30px;
          border-radius: 50px;
          color: white;
          font-weight: 600;
          margin-top: 10px;
        }

        .games-showcase {
          padding: 60px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .games-showcase h2 {
          text-align: center;
          font-size: 3rem;
          color: white;
          margin-bottom: 50px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }

        .game-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          border: 4px solid;
          animation: fadeInUp 0.6s ease;
        }

        .game-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .game-card-header {
          padding: 30px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .game-card-header h3 {
          font-size: 1.8rem;
          margin: 0;
        }

        .tier-label {
          background: rgba(255, 255, 255, 0.3);
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .game-card-body {
          padding: 30px;
        }

        .game-card-body p {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .game-button {
          display: inline-block;
          color: white;
          padding: 12px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .game-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.2rem;
          }

          .games-showcase h2 {
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

function getTierColor(tierName) {
  const colors = {
    'Free': '#10B981',
    'Pro': '#F59E0B',
    'Enterprise': '#8B5CF6'
  };
  return colors[tierName] || '#667eea';
}
