/**
 * Document library page - displays user's uploaded documents.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  const documentsRef = useRef(documents);

  // Keep ref in sync with state
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Poll for processing documents every 5 seconds
    const interval = setInterval(() => {
      const hasProcessing = documentsRef.current.some(
        (doc) => doc.status === 'pending' || doc.status === 'processing'
      );
      if (hasProcessing) {
        fetchDocuments();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const handleDelete = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter((doc) => doc.id !== documentId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{borderLeft: '4px solid var(--primary-color)', marginBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
          <div>
            <h1 style={{fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--gray-900)', fontWeight: '600'}}>Document Library</h1>
            <p style={{color: 'var(--gray-600)', fontSize: '0.9375rem'}}>Manage your PDF documents</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <DocumentUpload onUploadSuccess={handleUploadSuccess} />

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{fontSize: '3rem', marginBottom: '1rem', opacity: 0.3}}>📄</div>
            <h3 style={{marginBottom: '0.5rem', color: 'var(--gray-700)'}}>No documents yet</h3>
            <p style={{color: 'var(--gray-500)'}}>Upload your first PDF to get started</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 style={{marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>Your Documents ({documents.length})</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th className="hide-mobile">Upload Date</th>
                  <th>Status</th>
                  <th className="hide-mobile">Words</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <button
                        className="link-button"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        style={{fontWeight: '500', color: 'var(--primary-color)'}}
                      >
                        {doc.filename}
                      </button>
                    </td>
                    <td className="hide-mobile" style={{color: 'var(--gray-600)', fontSize: '0.875rem'}}>
                      {formatDate(doc.upload_date)}
                    </td>
                    <td>
                      <span className={`badge badge-${
                        doc.status === 'completed' ? 'success' :
                        doc.status === 'processing' ? 'info' :
                        doc.status === 'pending' ? 'warning' :
                        'danger'
                      }`}>
                        {getStatusIcon(doc.status)} {getStatusText(doc.status)}
                      </span>
                    </td>
                    <td className="hide-mobile" style={{fontWeight: '500', color: 'var(--gray-700)'}}>
                      {doc.word_count}
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => setDeleteConfirm(doc.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)'}}>Confirm Deletion</h2>
            </div>
            <div className="modal-body">
              <p style={{color: 'var(--gray-700)'}}>Are you sure you want to delete this document? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
