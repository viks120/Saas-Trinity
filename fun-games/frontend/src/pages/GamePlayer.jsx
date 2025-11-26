import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function GamePlayer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [slug]);

  useEffect(() => {
    // Listen for messages from game iframe
    const handleMessage = async (event) => {
      // Validate origin
      if (event.origin !== window.location.origin) {
        console.warn('Invalid message origin:', event.origin);
        return;
      }

      const { type, score, timestamp } = event.data;

      if (type === 'GAME_READY') {
        setGameReady(true);
        // Send platform ready message
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({
            type: 'PLATFORM_READY'
          }, window.location.origin);
        }
      }

      if (type === 'GAME_SCORE') {
        // Validate message schema
        if (typeof score !== 'number' || typeof timestamp !== 'number') {
          console.error('Invalid score message schema');
          return;
        }

        // Submit score to backend
        try {
          await apiClient('/scores', {
            method: 'POST',
            body: JSON.stringify({
              game_slug: slug,
              score: score,
              origin: window.location.origin
            })
          });
          alert(`Score submitted: ${score}`);
        } catch (err) {
          console.error('Failed to submit score:', err);
          alert('Failed to submit score. Please try again.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slug]);

  const fetchGame = async () => {
    try {
      const response = await apiClient(`/games/${slug}`);
      
      if (!response.has_access) {
        setError('You do not have access to this game. Please upgrade your tier.');
        setLoading(false);
        return;
      }

      setGame(response);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load game');
      setLoading(false);
    }
  };

  const handleExit = () => {
    navigate('/games');
  };

  if (loading) {
    return (
      <div className="game-player">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-player">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleExit} className="exit-button">
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-player">
      <div className="game-header">
        <h2>{game.name}</h2>
        <button onClick={handleExit} className="exit-button">
          ✕ Exit Game
        </button>
      </div>

      <div className="game-container">
        {!gameReady && (
          <div className="game-loading">
            <div className="loading-spinner"></div>
            <p>Initializing game...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={game.game_path}
          title={game.name}
          className="game-iframe"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <style>{`
        .game-player {
          min-height: 100vh;
          background: #1a1a2e;
          display: flex;
          flex-direction: column;
        }

        .game-header {
          background: #16213e;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .game-header h2 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
        }

        .exit-button {
          background: #EF4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .exit-button:hover {
          background: #DC2626;
          transform: scale(1.05);
        }

        .game-container {
          flex: 1;
          position: relative;
          background: #0f0f1e;
        }

        .game-iframe {
          width: 100%;
          height: 100%;
          border: none;
          position: absolute;
          top: 0;
          left: 0;
        }

        .game-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          z-index: 10;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
          text-align: center;
          padding: 20px;
        }

        .error-container h2 {
          font-size: 2rem;
          margin-bottom: 20px;
          color: #EF4444;
        }

        .error-container p {
          font-size: 1.2rem;
          margin-bottom: 30px;
          max-width: 600px;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.1);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-container p, .game-loading p {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
