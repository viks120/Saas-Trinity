import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const data = await api.get('/tiers');
      setTiers(data);
    } catch (error) {
      console.error('Failed to load tiers:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const currentTier = tiers.find(t => t.id === user?.tier_id);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2>User Information</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.is_admin ? 'Admin' : 'User'}</p>
        <p><strong>Tier:</strong> {currentTier?.name || 'No tier assigned'}</p>
      </div>

      {currentTier && (
        <div style={styles.card}>
          <h2>Your {currentTier.name} Tier Features</h2>
          <ul style={styles.featureList}>
            {Object.entries(currentTier.features).map(([key, value]) => {
              let displayValue = value;
              if (typeof value === 'boolean') {
                displayValue = value ? '✓ Enabled' : '✗ Disabled';
              } else if (value === null) {
                displayValue = 'Unlimited';
              } else if (value === -1) {
                displayValue = 'Unlimited';
              }
              
              return (
                <li key={key} style={styles.featureItem}>
                  <span style={styles.featureName}>{key.replace(/_/g, ' ')}:</span>
                  <span style={value ? styles.enabled : styles.disabled}>
                    {displayValue}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {user?.is_admin && (
        <div style={styles.card}>
          <h2>Admin Actions</h2>
          <Link to="/admin" style={styles.link}>
            Go to Admin Panel
          </Link>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
  },
  featureItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #eee',
  },
  featureName: {
    textTransform: 'capitalize',
  },
  enabled: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  disabled: {
    color: '#dc3545',
  },
  link: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
  },
};
