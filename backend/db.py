import os
from dotenv import load_dotenv
import mysql.connector

# Load environment variables from .env file
# This ensures sensitive credentials like passwords are not hard-coded in the source code.
load_dotenv()

def get_connection():
    """
    Creates and returns a new MySQL database connection.
    Reads connection details from environment variables.
    """
    connection = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME', 'research_portal')
    )
    return connection
