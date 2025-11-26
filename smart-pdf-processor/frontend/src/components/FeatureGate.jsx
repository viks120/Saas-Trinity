import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function FeatureGate({ featureName, children }) {
  const [hasAccess, setHasAccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkFeatureAccess();
  }, [featureName]);

  const checkFeatureAccess = async () => {
    try {
      // Try to access the feature endpoint
      await api.get(`/features/example/${featureName}`);
      setHasAccess(true);
    } catch (err) {
      if (err.message.includes('upgrade')) {
        setHasAccess(false);
        setError('Upgrade required to access this feature');
      } else {
        setHasAccess(false);
        setError('Feature not available');
      }
    }
  };

  if (hasAccess === null) {
    return <div>Checking access...</div>;
  }

  if (!hasAccess) {
    return (
      <div style={styles.upgradePrompt}>
        <h3>Upgrade Required</h3>
        <p>{error}</p>
        <button style={styles.button}>Upgrade Now</button>
      </div>
    );
  }

  return children;
}

const styles = {
  upgradePrompt: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    margin: '2rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};
