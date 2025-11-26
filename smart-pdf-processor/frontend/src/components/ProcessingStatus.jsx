/**
 * Processing status component - displays document processing status with icons.
 */

export default function ProcessingStatus({ status, error }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          text: 'Pending',
          color: '#856404',
          background: '#fff3cd',
        };
      case 'processing':
        return {
          icon: '⚙️',
          text: 'Processing',
          color: '#004085',
          background: '#cce5ff',
          spinner: true,
        };
      case 'completed':
        return {
          icon: '✅',
          text: 'Completed',
          color: '#155724',
          background: '#d4edda',
        };
      case 'failed':
        return {
          icon: '❌',
          text: 'Failed',
          color: '#721c24',
          background: '#f8d7da',
        };
      default:
        return {
          icon: '❓',
          text: 'Unknown',
          color: '#666',
          background: '#f0f0f0',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="processing-status">
      <div
        className="status-badge"
        style={{
          color: config.color,
          background: config.background,
        }}
      >
        {config.spinner && <div className="spinner-small"></div>}
        <span className="status-icon">{config.icon}</span>
        <span className="status-text">{config.text}</span>
      </div>

      {status === 'failed' && error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <style jsx>{`
        .processing-status {
          display: inline-block;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-icon {
          font-size: 1rem;
        }

        .status-text {
          text-transform: capitalize;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
          border-radius: 4px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
