from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import psycopg
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
import random
import google.generativeai as genai
import jwt
from functools import wraps
from datetime import timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for communication from React frontend
# In production, set FRONTEND_URL to your Vercel domain to restrict access
allowed_origins = os.environ.get("FRONTEND_URL", "*").split(",")
CORS(app, origins=allowed_origins)

# Database connection setup
def get_db_connection():
    try:
        conn = psycopg.connect(os.environ.get("DATABASE_URL"))
        return conn
    except Exception as e:
        print("Database connection failed:", e)
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        email VARCHAR(120) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        role VARCHAR(50) NOT NULL
                    )
                ''')
                cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='otp_code'")
                if not cur.fetchone():
                    cur.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE')
                    cur.execute('ALTER TABLE users ADD COLUMN otp_code VARCHAR(10)')
                cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='phone'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT ''")
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS donations (
                        id SERIAL PRIMARY KEY,
                        donor_id INTEGER REFERENCES users(id),
                        food_type VARCHAR(255) NOT NULL,
                        quantity VARCHAR(100) NOT NULL,
                        location VARCHAR(255) NOT NULL,
                        expiry_state VARCHAR(50) NOT NULL,
                        expiry_date TIMESTAMP NOT NULL,
                        pickup_time VARCHAR(100) NOT NULL,
                        status VARCHAR(50) DEFAULT 'Pending',
                        ngo_id INTEGER REFERENCES users(id),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
            conn.commit()
            print("Database tables initialized successfully.")
        except Exception as e:
            print("Failed to initialize database:", e)
        finally:
            conn.close()

# Initialize DB on startup
init_db()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            
        if not token:
            return jsonify({'status': 'Error', 'message': 'Authentication token is missing!'}), 401
            
        try:
            secret = os.environ.get('SECRET_KEY', 'default_fallback_secret_change_me_in_prod')
            data = jwt.decode(token, secret, algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'status': 'Error', 'message': 'Token is invalid or expired!'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('email') or not data.get('password') or not data.get('name') or not data.get('role') or not data.get('phone'):
        return jsonify({"status": "Error", "message": "Missing required fields"}), 400

    hashed_password = generate_password_hash(data['password'])
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
            if cur.fetchone():
                return jsonify({"status": "Error", "message": "Email already registered"}), 409
                
            # Insert new user
            otp_code = str(random.randint(100000, 999999))
            cur.execute(
                "INSERT INTO users (name, email, password, role, is_verified, otp_code, phone) VALUES (%s, %s, %s, %s, FALSE, %s, %s) RETURNING id, name, email, role, phone",
                (data['name'], data['email'], hashed_password, data['role'], otp_code, data['phone'])
            )
            new_user = cur.fetchone()
            conn.commit()
            
            # send email
            sender_email = os.environ.get("MAIL_USERNAME")
            sender_pass = os.environ.get("MAIL_PASSWORD")
            if sender_email and sender_pass:
                try:
                    msg = MIMEText(f"Your Registration Verification Code is: {otp_code}")
                    msg['Subject'] = 'FoodRescue Verification Code'
                    msg['From'] = sender_email
                    msg['To'] = data['email']
                    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                        server.login(sender_email, sender_pass)
                        server.send_message(msg)
                except Exception as e:
                    print("Failed to send email via SMTP:", e)
            else:
                print(f"\n[MOCK EMAIL NOTIFICATION] Sent OTP '{otp_code}' to => {data['email']}\n")

            return jsonify({
                "status": "Success", 
                "message": "User registered successfully",
                "requires_verification": True,
                "email": new_user[2],
                "user": {"id": new_user[0], "name": new_user[1], "email": new_user[2], "role": new_user[3]}
            }), 201
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/verify_otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, role, otp_code FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            
            if not user or user[4] != otp:
                return jsonify({"status": "Error", "message": "Invalid verification code"}), 400
                
            cur.execute("UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE email = %s", (email,))
            conn.commit()
            
            return jsonify({
                "status": "Success", 
                "user": {"id": user[0], "name": user[1], "email": user[2], "role": user[3]}
            }), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"status": "Error", "message": "Missing email or password"}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, password, role, is_verified FROM users WHERE email = %s", (data['email'],))
            user = cur.fetchone()
            
            if not user or not check_password_hash(user[3], data['password']):
                return jsonify({"status": "Error", "message": "Invalid email or password"}), 401
            if not user[5]:
                return jsonify({"status": "Error", "message": "Account not verified by email"}), 401
                
            secret = os.environ.get('SECRET_KEY', 'default_fallback_secret_change_me_in_prod')
            token = jwt.encode({
                'user_id': user[0],
                'exp': datetime.now() + timedelta(hours=24)
            }, secret, algorithm="HS256")
                
            return jsonify({
                "status": "Success", 
                "message": "Logged in successfully",
                "token": token,
                "user": {"id": user[0], "name": user[1], "email": user[2], "role": user[4]}
            }), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

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

@app.route('/api/donations', methods=['POST'])
@token_required
def create_donation(current_user_id):
    data = request.json
    required_fields = ['food_type', 'quantity', 'location', 'expiry_state', 'expiry_date', 'pickup_time']
    data['donor_id'] = current_user_id
    if not all(field in data for field in required_fields):
        return jsonify({"status": "Error", "message": "Missing required fields"}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO donations (donor_id, food_type, quantity, location, expiry_state, expiry_date, pickup_time)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (data['donor_id'], data['food_type'], data['quantity'], data['location'], data['expiry_state'], data['expiry_date'], data['pickup_time']))
            new_id = cur.fetchone()[0]
            
            # Fetch all NGOs to notify
            cur.execute("SELECT email FROM users WHERE role = 'ngo'")
            ngo_records = cur.fetchall()
            conn.commit()

            # Send email notifications securely
            sender_email = os.environ.get("MAIL_USERNAME")
            sender_pass = os.environ.get("MAIL_PASSWORD")
            if sender_email and sender_pass and ngo_records:
                try:
                    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                        server.login(sender_email, sender_pass)
                        for record in ngo_records:
                            ngo_email = record[0]
                            msg = MIMEText(f"A new donation for '{data['food_type']}' ({data['quantity']}) has been posted near '{data['location']}'. Pickup Time: {data['pickup_time']}. Please log in to your dashboard to accept the request.")
                            msg['Subject'] = 'FoodRescue: New Donation Available!'
                            msg['From'] = sender_email
                            msg['To'] = ngo_email
                            server.send_message(msg)
                except Exception as e:
                    print("Failed to send NGO notifications via SMTP:", e)
            else:
                print(f"\n[MOCK EMAIL NOTIFICATION] New donation alert sent to NGOs: {[r[0] for r in ngo_records]}\n")

            return jsonify({"status": "Success", "message": "Donation created and NGOs notified", "id": new_id}), 201
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/donations/donor/<int:donor_id>', methods=['GET'])
@token_required
def get_donor_donations(current_user_id, donor_id):
    if current_user_id != donor_id:
        return jsonify({"status": "Error", "message": "Unauthorized"}), 403
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.food_type, d.quantity, d.location, d.expiry_state, d.expiry_date, d.pickup_time, d.status, n.name, n.phone
                FROM donations d
                LEFT JOIN users n ON d.ngo_id = n.id
                WHERE d.donor_id = %s
                ORDER BY d.created_at DESC
            """, (donor_id,))
            donations = cur.fetchall()
            
            result = []
            for row in donations:
                expiry_dt = row[5]
                expiry_state = row[4]
                if expiry_dt:
                    now = datetime.now()
                    diff_hours = (expiry_dt - now).total_seconds() / 3600
                    if diff_hours > 48:
                        expiry_state = 'Fresh'
                    elif diff_hours > 0:
                        expiry_state = 'Near Expiry'
                    elif diff_hours >= -24:
                        expiry_state = 'Safe for Animal Feed'
                    else:
                        expiry_state = 'Compost Only'
                        
                result.append({
                    "id": row[0], "foodType": row[1], "quantity": row[2], "location": row[3],
                    "expiryState": expiry_state, "expiryDate": expiry_dt.strftime("%Y-%m-%d %H:%M:%S") if row[5] else None, 
                    "pickupTime": row[6], "status": row[7], "ngoName": row[8], "ngoPhone": row[9]
                })
            return jsonify({"status": "Success", "donations": result}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/donations/ngo/<int:ngo_id>', methods=['GET'])
@token_required
def get_ngo_donations(current_user_id, ngo_id):
    if current_user_id != ngo_id:
        return jsonify({"status": "Error", "message": "Unauthorized"}), 403
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.food_type, d.quantity, d.location, d.expiry_state, d.expiry_date, d.pickup_time, d.status, u.name, u.phone
                FROM donations d
                JOIN users u ON d.donor_id = u.id
                WHERE d.status = 'Pending' OR d.ngo_id = %s
                ORDER BY d.created_at DESC
            """, (ngo_id,))
            donations = cur.fetchall()
            
            result = []
            for row in donations:
                expiry_dt = row[5]
                expiry_state = row[4]
                if expiry_dt:
                    now = datetime.now()
                    diff_hours = (expiry_dt - now).total_seconds() / 3600
                    if diff_hours > 48:
                        expiry_state = 'Fresh'
                    elif diff_hours > 0:
                        expiry_state = 'Near Expiry'
                    elif diff_hours >= -24:
                        expiry_state = 'Safe for Animal Feed'
                    else:
                        expiry_state = 'Compost Only'
                        
                result.append({
                    "id": row[0], "foodType": row[1], "quantity": row[2], "location": row[3],
                    "expiryState": expiry_state, "expiryDate": expiry_dt.strftime("%Y-%m-%d %H:%M:%S") if row[5] else None, 
                    "pickupTime": row[6], "status": row[7], "donorName": row[8], "donorPhone": row[9]
                })
            return jsonify({"status": "Success", "donations": result}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/donations/<int:donation_id>/<action>', methods=['PUT'])
@token_required
def update_donation_status(current_user_id, donation_id, action):
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            if action == 'accept':
                ngo_id = current_user_id
                cur.execute("UPDATE donations SET status = 'Accepted', ngo_id = %s WHERE id = %s AND status = 'Pending'", (ngo_id, donation_id))
            elif action == 'complete':
                cur.execute("UPDATE donations SET status = 'Completed' WHERE id = %s AND status = 'Accepted'", (donation_id,))
            elif action == 'confirm':
                cur.execute("UPDATE donations SET status = 'Confirmed' WHERE id = %s AND status = 'Completed'", (donation_id,))
            else:
                return jsonify({"status": "Error", "message": "Invalid action"}), 400
                
            if cur.rowcount == 0:
                return jsonify({"status": "Error", "message": "Update failed (invalid state or id)"}), 400
                
            conn.commit()
            return jsonify({"status": "Success", "message": f"Donation {action} successful"}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/donations/donor/<int:donor_id>/stats', methods=['GET'])
@token_required
def get_donor_stats(current_user_id, donor_id):
    if current_user_id != donor_id:
        return jsonify({"status": "Error", "message": "Unauthorized"}), 403
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
        
    try:
        with conn.cursor() as cur:
            # Count successfully completed or confirmed donations
            cur.execute("""
                SELECT COUNT(*) FROM donations 
                WHERE donor_id = %s AND status IN ('Completed', 'Confirmed')
            """, (donor_id,))
            completed_count = cur.fetchone()[0]
            
            # Gamification Logic
            badges = []
            if completed_count >= 1:
                badges.append({
                    "id": "first_donation", 
                    "name": "First Donation!", 
                    "icon": "Medal", 
                    "color": "text-yellow-500",
                    "description": "Successfully completed your first food donation."
                })
            if completed_count >= 5:
                badges.append({
                    "id": "zero_waste_hero", 
                    "name": "Zero-Waste Hero", 
                    "icon": "ShieldCheck",
                    "color": "text-green-500", 
                    "description": "Completed 5 or more successful donations."
                })
            
            return jsonify({
                "status": "Success", 
                "stats": {
                    "completedDonations": completed_count,
                    "badges": badges
                }
            }), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/donations/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = get_db_connection()
    if not conn:
        return jsonify({"status": "Error", "message": "Database connection failed"}), 500
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.name, COUNT(*) as donation_count
                FROM donations d
                JOIN users u ON d.donor_id = u.id
                WHERE d.status IN ('Completed', 'Confirmed')
                GROUP BY u.id, u.name
                ORDER BY donation_count DESC
                LIMIT 10
            """)
            leaders = cur.fetchall()
            leaderboard = [{"name": row[0], "donations": row[1]} for row in leaders]
            return jsonify({"status": "Success", "leaderboard": leaderboard}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/chatbot', methods=['POST'])
def chatbot_endpoint():
    data = request.json
    if not data or not data.get('message'):
        return jsonify({"status": "Error", "message": "Missing message"}), 400
    
    user_message = data['message']
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"status": "Error", "message": "Gemini API key not configured on server"}), 500
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""You are a helpful and concise AI assistant for a local food waste reduction platform named FoodRescue. 
        The user asks: "{user_message}". 
        Please provide a concise, highly accurate, and friendly answer strictly focusing on:
        - general food hygiene/safety.
        - estimating how long this specific food stays fresh.
        - giving practical advice on what can be done with it if it is expired (e.g. repacking, animal shelters, or composting).
        Do not hallucinate facts if you do not know. Keep your response under 100 words total. Format with emojis where helpful!"""
        
        response = model.generate_content(prompt)
        return jsonify({"status": "Success", "reply": response.text}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
