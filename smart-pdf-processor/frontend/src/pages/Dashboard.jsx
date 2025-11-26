import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    loadTiers();
    loadDocuments();
  }, []);

  const loadTiers = async () => {
    try {
      const data = await api.get('/tiers');
      setTiers(data);
    } catch (error) {
      console.error('Failed to load tiers:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const getDocumentStats = () => {
    return {
      total: documents.length,
      pending: documents.filter(d => d.status === 'pending').length,
      processing: documents.filter(d => d.status === 'processing').length,
      completed: documents.filter(d => d.status === 'completed').length,
      failed: documents.filter(d => d.status === 'failed').length,
    };
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const currentTier = tiers.find(t => t.id === user?.tier_id);

  return (
    <div className="container">
      <div className="card" style={{background: 'white', borderLeft: '4px solid var(--primary-color)', marginBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
          <div>
            <h1 style={{fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--gray-900)', fontWeight: '600'}}>Dashboard</h1>
            <p style={{color: 'var(--gray-600)', fontSize: '0.9375rem'}}>Welcome back, {user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="card">
          <h3 style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600'}}>Email</h3>
          <p style={{fontSize: '1rem', fontWeight: '500', color: 'var(--gray-900)'}}>{user?.email}</p>
        </div>
        <div className="card">
          <h3 style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600'}}>Role</h3>
          <p style={{fontSize: '1rem', fontWeight: '500', color: 'var(--gray-900)'}}>
            {user?.is_admin ? 'Administrator' : 'User'}
          </p>
        </div>
        <div className="card">
          <h3 style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600'}}>Subscription Tier</h3>
          <p style={{fontSize: '1rem', fontWeight: '500', color: 'var(--gray-900)'}}>
            {currentTier?.name || 'No tier assigned'}
          </p>
        </div>
      </div>

      {currentTier && (
        <div className="card">
          <h2 style={{marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>
            {currentTier.name} Tier Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(currentTier.features).map(([key, value]) => {
              let displayValue = value;
              if (key === 'pdf_word_limit') {
                displayValue = value === null ? 'Unlimited' : `${value} words`;
              } else if (typeof value === 'boolean') {
                displayValue = value ? 'Enabled' : 'Disabled';
              }
              
              return (
                <div key={key} style={{
                  padding: '1rem',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{fontWeight: '500', textTransform: 'capitalize', color: 'var(--gray-700)', fontSize: '0.9375rem'}}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className={`badge ${value ? 'badge-success' : 'badge-gray'}`}>
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>
          Document Statistics
        </h2>
        {loadingDocs ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary-color)'}}>
                  {getDocumentStats().total}
                </div>
                <div style={{fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: '500'}}>Total Documents</div>
              </div>
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--success-color)'}}>
                  {getDocumentStats().completed}
                </div>
                <div style={{fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: '500'}}>Completed</div>
              </div>
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--info-color)'}}>
                  {getDocumentStats().processing}
                </div>
                <div style={{fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: '500'}}>Processing</div>
              </div>
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--warning-color)'}}>
                  {getDocumentStats().pending}
                </div>
                <div style={{fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: '500'}}>Pending</div>
              </div>
              <div style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--danger-color)'}}>
                  {getDocumentStats().failed}
                </div>
                <div style={{fontSize: '0.8125rem', color: 'var(--gray-600)', fontWeight: '500'}}>Failed</div>
              </div>
            </div>
            <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <Link to="/documents" className="btn btn-primary btn-large">
                View Document Library
              </Link>
            </div>
          </>
        )}
      </div>

      {user?.is_admin && (
        <div className="card" style={{borderLeft: '4px solid var(--warning-color)'}}>
          <h2 style={{marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>Admin Actions</h2>
          <Link to="/admin" className="btn btn-primary">
            Go to Admin Panel
          </Link>
        </div>
      )}
    </div>
  );
}


