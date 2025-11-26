import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="nav-logo">🎮 Fun Games</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            {user && (
              <>
                <Link to="/games" className="nav-link">Games</Link>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                {user.is_admin && <Link to="/admin" className="nav-link">Admin</Link>}
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            )}
            {!user && (
              <Link to="/auth" className="login-btn">Login / Sign Up</Link>
            )}
          </div>
        </div>
      </nav>

      <style>{`
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
          transition: transform 0.3s;
        }

        .nav-logo:hover {
          transform: scale(1.05);
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
          position: relative;
        }

        .nav-link:hover {
          color: #667eea;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background: #667eea;
          transition: width 0.3s;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .logout-btn, .login-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-block;
        }

        .logout-btn:hover, .login-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 768px) {
          .nav-content {
            padding: 1rem;
          }

          .nav-links {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .nav-logo {
            font-size: 1.2rem;
          }

          .nav-link {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
}
