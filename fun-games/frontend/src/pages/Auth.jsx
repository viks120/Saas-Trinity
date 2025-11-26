import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="back-home">← Back to Home</Link>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🎮</div>
            <h1>{isLogin ? 'Welcome Back!' : 'Join Fun Games'}</h1>
            <p>{isLogin ? 'Login to continue playing' : 'Create your account to start playing'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="form-input"
              />
              {!isLogin && (
                <span className="form-hint">Minimum 8 characters</span>
              )}
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner"></span> Loading...
                </>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="toggle-btn"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>

          {isLogin && (
            <div className="demo-credentials">
              <p><strong>Demo Admin Account:</strong></p>
              <p>Email: admin@fungames.com</p>
              <p>Password: admin123</p>
            </div>
          )}
        </div>

        <div className="auth-features">
          <h3>Why Join Fun Games?</h3>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🎮</span>
              <div>
                <h4>Play Amazing Games</h4>
                <p>Access our collection of fun browser games</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <div>
                <h4>Track Your Scores</h4>
                <p>Compete on leaderboards and beat your best</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <h4>View Statistics</h4>
                <p>See your progress and favorite games</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          position: relative;
        }

        .back-home {
          position: absolute;
          top: 2rem;
          left: 2rem;
          color: white;
          text-decoration: none;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          transition: all 0.3s;
        }

        .back-home:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(-5px);
        }

        .auth-container {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
          padding-top: 4rem;
        }

        .auth-card {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideInLeft 0.6s ease;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .auth-header h1 {
          font-size: 2rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .auth-header p {
          color: #666;
          font-size: 1rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .form-input {
          padding: 0.875rem 1rem;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-hint {
          font-size: 0.85rem;
          color: #666;
        }

        .error-message {
          background: #FEE2E2;
          color: #DC2626;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          animation: shake 0.5s;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-divider {
          text-align: center;
          position: relative;
          margin: 1.5rem 0;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: #E5E7EB;
        }

        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }

        .auth-divider span {
          background: white;
          padding: 0 1rem;
          color: #666;
          font-size: 0.9rem;
        }

        .auth-toggle {
          text-align: center;
          color: #666;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          margin-left: 0.5rem;
          transition: color 0.3s;
        }

        .toggle-btn:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .demo-credentials {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #F3F4F6;
          border-radius: 10px;
          font-size: 0.9rem;
          text-align: center;
        }

        .demo-credentials p {
          margin: 0.25rem 0;
          color: #666;
        }

        .demo-credentials strong {
          color: #333;
        }

        .auth-features {
          color: white;
          animation: slideInRight 0.6s ease;
        }

        .auth-features h3 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .feature-item {
          display: flex;
          gap: 1rem;
          align-items: start;
        }

        .feature-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .feature-item h4 {
          font-size: 1.3rem;
          margin-bottom: 0.5rem;
        }

        .feature-item p {
          opacity: 0.9;
          line-height: 1.6;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 968px) {
          .auth-container {
            grid-template-columns: 1fr;
            padding-top: 6rem;
          }

          .auth-features {
            order: -1;
            text-align: center;
          }

          .feature-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .back-home {
            top: 1rem;
            left: 1rem;
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
