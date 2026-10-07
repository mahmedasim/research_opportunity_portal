import os
import traceback
from datetime import date, datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

from db import get_connection
from validators import validate_opportunity

# Load environment variables from .env
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) for all origins in development
CORS(app)

def format_opportunity(row):
    """
    Converts date and timestamp values in a MySQL row dictionary
    to formatted strings so they can be serialized by jsonify.
    """
    if not row:
        return None
    formatted = dict(row)
    if isinstance(formatted.get('application_deadline'), (date, datetime)):
        formatted['application_deadline'] = formatted['application_deadline'].strftime('%Y-%m-%d')
    elif formatted.get('application_deadline') is not None:
        formatted['application_deadline'] = str(formatted['application_deadline'])

    if isinstance(formatted.get('created_at'), (date, datetime)):
        formatted['created_at'] = formatted['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    elif formatted.get('created_at') is not None:
        formatted['created_at'] = str(formatted['created_at'])

    if isinstance(formatted.get('updated_at'), (date, datetime)):
        formatted['updated_at'] = formatted['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
    elif formatted.get('updated_at') is not None:
        formatted['updated_at'] = str(formatted['updated_at'])

    return formatted

# -----------------------------------------------------------------------------
# Health Route
# -----------------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check route to verify that the server is running."""
    return jsonify({"status": "ok"}), 200

# -----------------------------------------------------------------------------
# Opportunity Routes (CREATE & READ)
# -----------------------------------------------------------------------------
@app.route('/api/opportunities', methods=['POST'])
def create_opportunity():
    """
    Creates a new research opportunity.
    Validates input data, inserts into MySQL, and returns the created record.
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({
            "error": "Validation failed",
            "details": {"body": "Invalid or missing JSON payload"}
        }), 400

    cleaned, errors = validate_opportunity(data, partial=False)
    if errors:
        return jsonify({
            "error": "Validation failed",
            "details": errors
        }), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        insert_sql = """
            INSERT INTO research_opportunities (
                title, description, research_area, faculty_name,
                department, required_skills, available_positions,
                application_deadline, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_sql, (
            cleaned['title'],
            cleaned['description'],
            cleaned['research_area'],
            cleaned['faculty_name'],
            cleaned['department'],
            cleaned['required_skills'],
            cleaned['available_positions'],
            cleaned['application_deadline'],
            cleaned['status']
        ))
        conn.commit()
        new_id = cursor.lastrowid

        # Re-select the inserted row
        cursor.execute("SELECT * FROM research_opportunities WHERE id = %s", (new_id,))
        created_row = cursor.fetchone()

        return jsonify({
            "message": "Opportunity created successfully",
            "data": format_opportunity(created_row)
        }), 201

    except Exception:
        # Print actual error to server console for debugging, never leak to client
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

@app.route('/api/opportunities', methods=['GET'])
def list_opportunities():
    """
    Retrieves all research opportunities ordered newest first (by created_at DESC).
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM research_opportunities ORDER BY created_at DESC")
        rows = cursor.fetchall()
        opportunities = [format_opportunity(row) for row in rows]

        return jsonify({
            "count": len(opportunities),
            "data": opportunities
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

@app.route('/api/opportunities/<opportunity_id>', methods=['GET'])
def get_opportunity(opportunity_id):
    """
    Retrieves a single research opportunity by ID.
    Returns 404 if not found or if ID is non-numeric.
    """
    if not opportunity_id.isdigit():
        return jsonify({"error": f"Opportunity with id {opportunity_id} not found"}), 404

    opp_id = int(opportunity_id)
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM research_opportunities WHERE id = %s", (opp_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": f"Opportunity with id {opportunity_id} not found"}), 404

        return jsonify({"data": format_opportunity(row)}), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

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
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True)
