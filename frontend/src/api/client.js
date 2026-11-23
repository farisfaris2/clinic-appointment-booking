/* =====================================================================
   client.js — the ONE place that talks to the backend over HTTP.
   Every page calls the functions in endpoints.js, which call `request`.

   Why the path starts with "/api" and has no "http://localhost:5000":
   vite.config.js forwards (proxies) every /api request to the Express
   server on port 5000. To the browser it looks like the same website,
   so the login cookie is sent automatically and no CORS setup is needed.
   ===================================================================== */

/** Error type that also remembers the HTTP status (401, 403, 409 …). */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Friendly fallback messages for when the server doesn't send one.
const STATUS_MESSAGES = {
  400: 'Some of the information is missing or invalid.',
  401: 'Please log in to continue.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That conflicts with an existing booking or time slot.',
  500: 'Something went wrong on the server. Please try again.',
  502: 'Cannot reach the server. Is the backend running on port 5000?',
};

/**
 * Send a request to the API and return the parsed JSON.
 * Throws ApiError if the server answers with an error status.
 *
 * @param {string} path    e.g. "/api/doctors"
 * @param {object} options { method: "POST", body: { ... } }
 */
export async function request(path, { method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(path, {
      method,
      credentials: 'include', // send the HttpOnly "token" cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only throws when the server can't be reached at all.
    throw new ApiError('Cannot reach the server. Is the backend running on port 5000?', 0);
  }

  // 204 No Content (e.g. after deleting a slot) has no body to read.
  if (response.status === 204) return null;

  // Only parse JSON when the server says it is JSON. Express's default
  // error page is HTML, and parsing that would throw a confusing error.
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.message || STATUS_MESSAGES[response.status] || `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return data;
}