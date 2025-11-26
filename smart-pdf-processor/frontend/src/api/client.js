/**
 * API client for making authenticated requests to the backend.
 * Uses cookie-based authentication - no manual token management needed.
 */

const API_BASE = '/api';

/**
 * Make an authenticated API request.
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} path - API path (e.g., '/auth/login')
 * @param {object} body - Request body (optional)
 * @param {object} options - Additional options (e.g., skipAuthRedirect)
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(method, path, body = null, options = {}) {
  const fetchOptions = {
    method,
    credentials: 'include', // Send cookies automatically
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, fetchOptions);

  // Handle authentication errors
  if (response.status === 401) {
    // Don't redirect if this is an auth check (to avoid infinite loops)
    if (!options.skipAuthRedirect && !path.includes('/auth/me')) {
      // Redirect to login page
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }

  // Handle authorization errors (upgrade required)
  if (response.status === 403) {
    throw new Error('Access denied - upgrade required');
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  // Return JSON response
  return response.json();
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
};
