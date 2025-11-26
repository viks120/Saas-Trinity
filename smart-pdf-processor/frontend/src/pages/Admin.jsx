import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tiers, setTiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierForm, setTierForm] = useState({ name: '', price_cents: 0, features: {} });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [tiersData, usersData, flagsData] = await Promise.all([
        api.get('/tiers'),
        api.get('/admin/users'),
        api.get('/features'),
      ]);
      setTiers(tiersData);
      setUsers(usersData);
      setFlags(flagsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateTier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tiers', tierForm);
      setShowTierForm(false);
      setTierForm({ name: '', price_cents: 0, features: {} });
      loadData();
    } catch (error) {
      alert('Failed to create tier: ' + error.message);
    }
  };

  const handleDeleteTier = async (tierId) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;
    try {
      await api.delete(`/tiers/${tierId}`);
      loadData();
    } catch (error) {
      alert('Failed to delete tier: ' + error.message);
    }
  };

  const handleAssignTier = async (userId, tierId) => {
    try {
      await api.post(`/tiers/users/${userId}/tier`, { tier_id: tierId });
      loadData();
    } catch (error) {
      alert('Failed to assign tier: ' + error.message);
    }
  };

  const handleToggleFlag = async (flagName, currentState) => {
    try {
      await api.put(`/features/${flagName}`, { enabled: !currentState });
      loadData();
    } catch (error) {
      alert('Failed to toggle flag: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Admin Panel</h1>
      <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
        Back to Dashboard
      </button>

      {/* Tier Management */}
      <div style={styles.section}>
        <h2>Subscription Tiers</h2>
        <button onClick={() => setShowTierForm(!showTierForm)} style={styles.button}>
          {showTierForm ? 'Cancel' : 'Create New Tier'}
        </button>

        {showTierForm && (
          <form onSubmit={handleCreateTier} style={styles.form}>
            <input
              type="text"
              placeholder="Tier Name"
              value={tierForm.name}
              onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Price (cents)"
              value={tierForm.price_cents}
              onChange={(e) => setTierForm({ ...tierForm, price_cents: parseInt(e.target.value) })}
              required
              style={styles.input}
            />
            <textarea
              placeholder='Features JSON (e.g., {"max_projects": 5})'
              value={JSON.stringify(tierForm.features)}
              onChange={(e) => {
                try {
                  setTierForm({ ...tierForm, features: JSON.parse(e.target.value) });
                } catch {}
              }}
              style={styles.textarea}
            />
            <button type="submit" style={styles.button}>Create Tier</button>
          </form>
        )}

        <div style={styles.list}>
          {tiers.map(tier => (
            <div key={tier.id} style={styles.card}>
              <h3>{tier.name}</h3>
              <p>Price: ${(tier.price_cents / 100).toFixed(2)}</p>
              <p>Features: {JSON.stringify(tier.features)}</p>
              <button onClick={() => handleDeleteTier(tier.id)} style={styles.deleteButton}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div style={styles.section}>
        <h2>User Management</h2>
        <div style={styles.list}>
          {users.map(u => (
            <div key={u.id} style={styles.card}>
              <p><strong>{u.email}</strong> {u.is_admin && '(Admin)'}</p>
              <p>Current Tier: {u.tier_name || 'None'}</p>
              <select
                value={u.tier_id || ''}
                onChange={(e) => handleAssignTier(u.id, parseInt(e.target.value))}
                style={styles.select}
              >
                <option value="">No Tier</option>
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div style={styles.section}>
        <h2>Feature Flags</h2>
        <div style={styles.list}>
          {flags.map(flag => (
            <div key={flag.id} style={styles.card}>
              <h3>{flag.name}</h3>
              <p>{flag.description}</p>
              <label style={styles.toggle}>
                <input
                  type="checkbox"
                  checked={flag.enabled}
                  onChange={() => handleToggleFlag(flag.name, flag.enabled)}
                />
                <span>{flag.enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '2rem',
  },
  section: {
    marginBottom: '3rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  textarea: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    minHeight: '80px',
    fontFamily: 'monospace',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '0.5rem',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
};
