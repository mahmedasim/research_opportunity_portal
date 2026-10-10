/**
 * API client module for University Research Opportunity Portal.
 * Handles all network requests to the backend REST API using fetch().
 */

/**
 * Helper function to send HTTP requests to the API.
 * - Handles JSON serialization and parsing.
 * - Detects connection failures when the backend is unreachable.
 * - Throws enriched errors on non-2xx HTTP responses.
 *
 * @param {string} endpoint - The relative endpoint path (e.g. '/opportunities').
 * @param {Object} [options={}] - Fetch configuration options (method, headers, body).
 * @returns {Promise<Object>} Parsed JSON response from the server.
 */
async function apiRequest(endpoint, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    } catch (networkError) {
        // fetch() rejects with a TypeError when the network request fails
        // (for example, server is offline, port is closed, or CORS is blocked).
        throw new Error("Cannot connect to the server. Is the backend running?");
    }

    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        data = null;
    }

    // Check if the response status is outside the 200-299 range
    if (!response.ok) {
        const errorMessage = (data && data.error) ? data.error : `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.serverError = data && data.error ? data.error : null;
        error.details = data && data.details ? data.details : null;
        throw error;
    }

    return data;
}

/**
 * Fetches all research opportunities (newest first).
 * @returns {Promise<Object>} Resolves to { count: number, data: Array }
 */
async function getAllOpportunities() {
    return await apiRequest('/opportunities', {
        method: 'GET'
    });
}

/**
 * Fetches a single research opportunity by its ID.
 * @param {number|string} id - The opportunity ID.
 * @returns {Promise<Object>} Resolves to { data: Object }
 */
async function getOpportunity(id) {
    return await apiRequest(`/opportunities/${id}`, {
        method: 'GET'
    });
}

/**
 * Creates a new research opportunity.
 * @param {Object} data - Payload containing required opportunity fields.
 * @returns {Promise<Object>} Resolves to { message: string, data: Object }
 */
async function createOpportunity(data) {
    return await apiRequest('/opportunities', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/**
 * Updates an existing research opportunity.
 * @param {number|string} id - The opportunity ID.
 * @param {Object} data - Fields to update.
 * @returns {Promise<Object>} Resolves to { message: string, data: Object }
 */
async function updateOpportunity(id, data) {
    return await apiRequest(`/opportunities/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/**
 * Deletes a research opportunity by its ID.
 * @param {number|string} id - The opportunity ID.
 * @returns {Promise<Object>} Resolves to { message: string }
 */
async function deleteOpportunity(id) {
    return await apiRequest(`/opportunities/${id}`, {
        method: 'DELETE'
    });
}
