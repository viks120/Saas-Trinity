import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Navbar from '../components/Navbar';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tiers, setTiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierForm, setTierForm] = useState({ name: '', price_cents: 0, features: {} });
  const [activeTab, setActiveTab] = useState('users');

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

  const getTierColor = (tierName) => {
    const colors = {
      'Free': '#10B981',
      'Pro': '#F59E0B',
      'Enterprise': '#8B5CF6'
    };
    return colors[tierName] || '#667eea';
  };

  return (
    <div className="admin-page">
      <Navbar />
      
      <div className="admin-container">
        <div className="admin-header">
          <h1>⚙️ Admin Panel</h1>
          <p>Manage users, tiers, and platform settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
            onClick={() => setActiveTab('tiers')}
          >
            💎 Tiers
          </button>
          <button 
            className={`tab-btn ${activeTab === 'flags' ? 'active' : ''}`}
            onClick={() => setActiveTab('flags')}
          >
            🚩 Feature Flags
          </button>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>User Management</h2>
              <span className="count-badge">{users.length} users</span>
            </div>
            <div className="users-grid">
              {users.map(u => (
                <div key={u.id} className="user-card">
                  <div className="user-header">
                    <div className="user-avatar">{u.email[0].toUpperCase()}</div>
                    <div className="user-info">
                      <h3>{u.email}</h3>
                      {u.is_admin && <span className="admin-badge">Admin</span>}
                    </div>
                  </div>
                  <div className="user-tier">
                    <label>Subscription Tier:</label>
                    <select
                      value={u.tier_id || ''}
                      onChange={(e) => handleAssignTier(u.id, parseInt(e.target.value))}
                      className="tier-select"
                    >
                      <option value="">No Tier</option>
                      {tiers.map(tier => (
                        <option key={tier.id} value={tier.id}>{tier.name}</option>
                      ))}
                    </select>
                  </div>
                  {u.tier_name && (
                    <div className="current-tier" style={{ background: getTierColor(u.tier_name) }}>
                      {u.tier_name} Tier
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier Management Tab */}
        {activeTab === 'tiers' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Subscription Tiers</h2>
              <button onClick={() => setShowTierForm(!showTierForm)} className="create-btn">
                {showTierForm ? '✕ Cancel' : '+ Create New Tier'}
              </button>
            </div>

            {showTierForm && (
              <form onSubmit={handleCreateTier} className="tier-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Tier Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Premium"
                      value={tierForm.name}
                      onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Price (cents)</label>
                    <input
                      type="number"
                      placeholder="e.g., 999"
                      value={tierForm.price_cents}
                      onChange={(e) => setTierForm({ ...tierForm, price_cents: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Features (JSON)</label>
                  <textarea
                    placeholder='{"tic_tac_toe": true, "whack_a_mole": false}'
                    value={JSON.stringify(tierForm.features, null, 2)}
                    onChange={(e) => {
                      try {
                        setTierForm({ ...tierForm, features: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                  />
                </div>
                <button type="submit" className="submit-btn">Create Tier</button>
              </form>
            )}

            <div className="tiers-grid">
              {tiers.map(tier => (
                <div key={tier.id} className="tier-card" style={{ borderColor: getTierColor(tier.name) }}>
                  <div className="tier-header">
                    <h3>{tier.name}</h3>
                    <div className="tier-price">${(tier.price_cents / 100).toFixed(2)}</div>
                  </div>
                  <div className="tier-features">
                    <h4>Features:</h4>
                    <ul>
                      {Object.entries(tier.features).map(([key, value]) => (
                        <li key={key} className={value ? 'enabled' : 'disabled'}>
                          {value ? '✓' : '✗'} {key.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => handleDeleteTier(tier.id)} className="delete-btn">
                    🗑️ Delete Tier
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'flags' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Feature Flags</h2>
              <span className="count-badge">{flags.length} flags</span>
            </div>
            <div className="flags-grid">
              {flags.map(flag => (
                <div key={flag.id} className="flag-card">
                  <div className="flag-header">
                    <h3>{flag.name}</h3>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={flag.enabled}
                        onChange={() => handleToggleFlag(flag.name, flag.enabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <p>{flag.description}</p>
                  <div className={`flag-status ${flag.enabled ? 'enabled' : 'disabled'}`}>
                    {flag.enabled ? '✓ Enabled' : '✗ Disabled'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .admin-header {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }

        .admin-header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .admin-header p {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .tab-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 0.5rem;
          border-radius: 15px;
        }

        .tab-btn {
          flex: 1;
          padding: 1rem;
          background: transparent;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .tab-btn.active {
          background: white;
          color: #667eea;
        }

        .tab-content {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .section-header h2 {
          color: #333;
          margin: 0;
        }

        .count-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 600;
        }

        .create-btn {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .users-grid, .tiers-grid, .flags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .user-card, .tier-card, .flag-card {
          background: white;
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
        }

        .user-card:hover, .tier-card:hover, .flag-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .user-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .user-info h3 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .admin-badge {
          background: #8B5CF6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .user-tier {
          margin-top: 1rem;
        }

        .user-tier label {
          display: block;
          font-weight: 600;
          color: #666;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .tier-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tier-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .current-tier {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 10px;
          color: white;
          text-align: center;
          font-weight: 600;
        }

        .tier-form {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-field {
          margin-bottom: 1.5rem;
        }

        .form-field label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .form-field input,
        .form-field textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #E5E7EB;
          border-radius: 10px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-field textarea {
          min-height: 100px;
          font-family: monospace;
          resize: vertical;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .tier-card {
          border: 3px solid;
        }

        .tier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .tier-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }

        .tier-price {
          font-size: 1.8rem;
          font-weight: bold;
          color: #667eea;
        }

        .tier-features {
          margin: 1.5rem 0;
        }

        .tier-features h4 {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .tier-features ul {
          list-style: none;
          padding: 0;
        }

        .tier-features li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #F3F4F6;
          text-transform: capitalize;
        }

        .tier-features li.enabled {
          color: #10B981;
        }

        .tier-features li.disabled {
          color: #EF4444;
        }

        .delete-btn {
          background: #EF4444;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
        }

        .delete-btn:hover {
          background: #DC2626;
        }

        .flag-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .flag-header h3 {
          margin: 0;
          color: #333;
          text-transform: capitalize;
        }

        .toggle-switch {
          position: relative;
          width: 60px;
          height: 30px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 30px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(30px);
        }

        .flag-card p {
          color: #666;
          margin: 1rem 0;
          line-height: 1.6;
        }

        .flag-status {
          padding: 0.75rem;
          border-radius: 10px;
          text-align: center;
          font-weight: 600;
        }

        .flag-status.enabled {
          background: #D1FAE5;
          color: #065F46;
        }

        .flag-status.disabled {
          background: #FEE2E2;
          color: #991B1B;
        }

        @media (max-width: 768px) {
          .admin-header h1 {
            font-size: 2rem;
          }

          .tab-nav {
            flex-direction: column;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .users-grid, .tiers-grid, .flags-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
