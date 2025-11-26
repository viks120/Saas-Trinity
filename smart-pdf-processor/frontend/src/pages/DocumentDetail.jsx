/**
 * Document detail page - displays document metadata and extracted text.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        credentials: 'include',
      });

      if (response.status === 404) {
        setError('Document not found');
        setLoading(false);
        return;
      }

      if (response.status === 403) {
        setError('You do not have permission to access this document');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      setDocument(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();

    // Poll for processing documents every 5 seconds
    const interval = setInterval(() => {
      if (document && (document.status === 'pending' || document.status === 'processing')) {
        fetchDocument();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, document?.status]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  const renderExtractedText = (text) => {
    if (!text) return null;

    // Split by double newlines to preserve paragraphs
    const paragraphs = text.split('\n\n');

    return paragraphs.map((para, index) => {
      // Check if paragraph is an image marker
      if (para.trim() === '**[IMAGE]**') {
        return (
          <div key={index} className="image-marker">
            <strong>[IMAGE]</strong>
          </div>
        );
      }

      return (
        <p key={index} className="paragraph">
          {para}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div style={{textAlign: 'center', padding: '3rem'}}>
            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>❌</div>
            <h2 style={{marginBottom: '1rem'}}>Error</h2>
            <p style={{color: 'var(--gray-600)', marginBottom: '2rem'}}>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/documents')}>
              ← Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="container">
      <div style={{marginBottom: '2rem'}}>
        <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
          ← Back to Library
        </button>
      </div>

      <div className="card" style={{borderLeft: '4px solid var(--primary-color)', marginBottom: '2rem'}}>
        <h1 style={{fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--gray-900)', wordBreak: 'break-word', fontWeight: '600'}}>
          {document.filename}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2" style={{marginTop: '1.5rem'}}>
          <div style={{background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)'}}>
            <div style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600'}}>Upload Date</div>
            <div style={{fontWeight: '500', color: 'var(--gray-900)', fontSize: '0.9375rem'}}>{formatDate(document.upload_date)}</div>
          </div>
          <div style={{background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)'}}>
            <div style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600'}}>Status</div>
            <div style={{fontWeight: '500', color: 'var(--gray-900)', fontSize: '0.9375rem'}}>
              {getStatusIcon(document.status)} {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </div>
          </div>
          <div style={{background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)'}}>
            <div style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600'}}>Word Count</div>
            <div style={{fontWeight: '500', color: 'var(--gray-900)', fontSize: '0.9375rem'}}>{document.word_count}</div>
          </div>
        </div>

        {document.status === 'failed' && document.error_message && (
          <div className="alert alert-error" style={{marginTop: '1.5rem'}}>
            <strong>Processing Error:</strong> {document.error_message}
          </div>
        )}
      </div>

      {document.status === 'pending' && (
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <p style={{fontWeight: '500'}}>Document is queued for processing...</p>
          </div>
        </div>
      )}

      {document.status === 'processing' && (
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <p style={{fontWeight: '500'}}>Processing document...</p>
          </div>
        </div>
      )}

      {document.status === 'completed' && document.extracted_text && (
        <div className="card">
          <h2 style={{marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>
            Extracted Text
          </h2>
          <div style={{
            lineHeight: '1.7',
            color: 'var(--gray-800)',
            padding: '1.5rem',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--gray-200)',
            fontSize: '0.9375rem'
          }}>
            {renderExtractedText(document.extracted_text)}
          </div>
        </div>
      )}

      <style jsx>{`
        .paragraph {
          margin-bottom: 1.5rem;
          white-space: pre-wrap;
          text-align: justify;
        }

        .image-marker {
          margin: 2rem 0;
          padding: 1.25rem;
          background: var(--gray-100);
          color: var(--gray-700);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius);
          text-align: center;
          font-size: 1rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
