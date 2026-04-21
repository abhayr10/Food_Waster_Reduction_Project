from flask import Flask, jsonify
from flask_cors import CORS
import os
import psycopg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for communication from React frontend
CORS(app)

# Database connection setup (mock for now)
def get_db_connection():
    try:
        conn = psycopg.connect(os.environ.get("DATABASE_URL"))
        return conn
    except Exception as e:
        print("Database connection failed:", e)
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Success", "message": "Backend and Frontend are connected!"}), 200

@app.route('/api/test-db', methods=['GET'])
def test_db():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "Success", "message": "Database connection successful!"}), 200
    return jsonify({"status": "Error", "message": "Database connection failed. Please check your credentials."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
