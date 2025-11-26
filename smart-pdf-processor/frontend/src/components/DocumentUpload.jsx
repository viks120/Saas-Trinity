/**
 * Document upload component with drag-and-drop support.
 */

import { useState, useRef } from 'react';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function DocumentUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) {
      return 'Please select a file';
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
    }

    if (file.size === 0) {
      return 'File is empty';
    }

    return null;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setSuccess('');

    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    setSuccess('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
      } else {
        setFile(droppedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setSuccess(`Document uploaded successfully! Processing...`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card" style={{marginBottom: '2rem'}}>
      <h2 style={{marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>
        Upload New Document
      </h2>
      <div
        style={{
          border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'var(--gray-300)'}`,
          borderRadius: 'var(--radius)',
          padding: '3rem 2rem',
          textAlign: 'center',
          transition: 'var(--transition)',
          background: dragActive ? 'var(--gray-50)' : 'white',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius)',
            background: 'var(--gray-100)',
            border: '2px solid var(--gray-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            📄
          </div>

          <div>
            <p style={{fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--gray-900)'}}>
              {file ? `Selected: ${file.name}` : 'Drop your PDF here'}
            </p>
            <p style={{fontSize: '0.875rem', color: 'var(--gray-600)'}}>
              or click to browse • Maximum {MAX_FILE_SIZE_MB}MB
            </p>
          </div>

          {!file && (
            <button
              type="button"
              onClick={handleButtonClick}
              className="btn btn-primary"
              disabled={uploading}
            >
              Select PDF File
            </button>
          )}
        </div>
      </div>

      {file && !uploading && !success && (
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap'}}>
          <button onClick={handleUpload} className="btn btn-primary btn-large">
            Upload Document
          </button>
          <button
            onClick={() => {
              setFile(null);
              setError('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      )}

      {uploading && (
        <div className="loading" style={{padding: '2rem'}}>
          <div className="spinner"></div>
          <p style={{fontWeight: '500', color: 'var(--gray-700)'}}>Uploading your document...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{marginTop: '1.5rem'}}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{marginTop: '1.5rem'}}>
          {success}
        </div>
      )}
    </div>
  );
}
