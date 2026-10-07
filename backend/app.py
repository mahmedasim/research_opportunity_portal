import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

# Load environment variables from .env
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) for all domains.
# Note: Enabling CORS for all origins is convenient during development so our
# frontend running in a browser can communicate with the backend API.
CORS(app)

# -----------------------------------------------------------------------------
# Health Route
# -----------------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check route to verify that the server is running."""
    return jsonify({"status": "ok"}), 200

# -----------------------------------------------------------------------------
# Global Error Handlers (Always return JSON)
# -----------------------------------------------------------------------------
@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 Not Found errors with a JSON response."""
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(405)
def method_not_allowed_error(error):
    """Handle 405 Method Not Allowed errors with a JSON response."""
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_server_error(error):
    """Handle 500 Internal Server errors without leaking stack traces or SQL details."""
    return jsonify({"error": "Internal server error"}), 500

# -----------------------------------------------------------------------------
# Application Runner
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    # Listen on 127.0.0.1 and port configured via FLASK_PORT (default to 5000)
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True)
