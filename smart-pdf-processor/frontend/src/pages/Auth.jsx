import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div style={styles.container} className="auth-container">
      <div style={styles.leftPanel} className="auth-left-panel">
        <div style={styles.brandSection}>
          <div style={styles.logo}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="8" fill="#1e40af"/>
              <path d="M14 16h20v4H14v-4zm0 8h20v4H14v-4zm0 8h14v4H14v-4z" fill="white"/>
            </svg>
          </div>
          <h1 style={styles.brandTitle} className="auth-brand-title">Smart PDF Processor</h1>
          <p style={styles.brandSubtitle}>
            Enterprise-grade PDF text extraction with intelligent processing and tier-based word limits
          </p>
          
          <div style={styles.features} className="auth-features">
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div>
                <div style={styles.featureTitle}>Intelligent Extraction</div>
                <div style={styles.featureDesc}>Preserves paragraph structure and formatting</div>
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div>
                <div style={styles.featureTitle}>Tier-Based Processing</div>
                <div style={styles.featureDesc}>Flexible plans for every business need</div>
              </div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div>
                <div style={styles.featureTitle}>Secure & Reliable</div>
                <div style={styles.featureDesc}>Enterprise-grade security and processing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel} className="auth-right-panel">
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={styles.formSubtitle}>
              {isLogin 
                ? 'Sign in to access your document library' 
                : 'Get started with your free account'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                style={styles.input}
                className="form-input"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                style={styles.input}
                className="form-input"
              />
              {!isLogin && (
                <p style={styles.hint}>Must be at least 8 characters</p>
              )}
            </div>

            {error && (
              <div className="alert alert-error" style={{marginBottom: '1rem'}}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-large"
              style={{width: '100%', marginTop: '0.5rem'}}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <p style={styles.toggle}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={styles.toggleButton}
              className="link-button"
            >
              {isLogin ? 'Create one now' : 'Sign in instead'}
            </button>
          </p>

          {isLogin && (
            <div style={styles.demoInfo}>
              <p style={styles.demoTitle}>Demo Credentials</p>
              <p style={styles.demoText}>Email: admin@example.com</p>
              <p style={styles.demoText}>Password: admin123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'row',
  },
  leftPanel: {
    flex: '1',
    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
    padding: '4rem 3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  brandSection: {
    maxWidth: '500px',
  },
  logo: {
    marginBottom: '2rem',
  },
  brandTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '1.125rem',
    lineHeight: '1.6',
    opacity: '0.9',
    marginBottom: '3rem',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  feature: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    fontSize: '1rem',
  },
  featureTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  featureDesc: {
    fontSize: '0.9375rem',
    opacity: '0.85',
  },
  rightPanel: {
    flex: '1',
    background: 'var(--gray-50)',
    padding: '4rem 3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
  },
  formContainer: {
    width: '100%',
    maxWidth: '440px',
  },
  formHeader: {
    marginBottom: '2rem',
  },
  formTitle: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: 'var(--gray-900)',
    marginBottom: '0.5rem',
  },
  formSubtitle: {
    fontSize: '1rem',
    color: 'var(--gray-600)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--gray-700)',
  },
  input: {
    width: '100%',
  },
  hint: {
    fontSize: '0.8125rem',
    color: 'var(--gray-500)',
    margin: '0',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '2rem 0 1.5rem',
  },
  dividerText: {
    background: 'var(--gray-50)',
    padding: '0 1rem',
    color: 'var(--gray-500)',
    fontSize: '0.875rem',
    position: 'relative',
    zIndex: '1',
  },
  toggle: {
    textAlign: 'center',
    fontSize: '0.9375rem',
    color: 'var(--gray-600)',
  },
  toggleButton: {
    fontWeight: '600',
  },
  demoInfo: {
    marginTop: '2rem',
    padding: '1rem',
    background: 'white',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
  },
  demoTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--gray-700)',
    marginBottom: '0.5rem',
  },
  demoText: {
    fontSize: '0.8125rem',
    color: 'var(--gray-600)',
    margin: '0.25rem 0',
    fontFamily: 'monospace',
  },
  '@media (max-width: 768px)': {
    container: {
      flexDirection: 'column',
    },
    leftPanel: {
      padding: '2rem 1.5rem',
    },
    rightPanel: {
      padding: '2rem 1.5rem',
    },
  },
};
