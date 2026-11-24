from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import json
import bcrypt
import uuid
import random

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['tourley_db']

# Collections
users_collection = db['users']
destinations_collection = db['destinations']
bookings_collection = db['bookings']
otp_collection = db['otp']

# Create indexes
users_collection.create_index('email', unique=True)
destinations_collection.create_index('name')

@app.route('/')
def home():
    return jsonify({"message": "Tourley API is running!"})

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName')
        mobile = data.get('mobile')
        
        if not all([email, password, full_name, mobile]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Check if user exists
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = {
            'userId': str(uuid.uuid4()),
            'email': email,
            'password': hashed_password.decode('utf-8'),
            'fullName': full_name,
            'mobile': mobile,
            'role': 'user',
            'isVerified': False,
            'createdAt': datetime.utcnow()
        }
        
        users_collection.insert_one(user)
        
        # Generate OTP (6-digit numeric)
        import random
        otp = str(random.randint(100000, 999999))
        otp_data = {
            'email': email,
            'otp': otp,
            'purpose': 'email_verification',
            'createdAt': datetime.utcnow()
        }
        otp_collection.insert_one(otp_data)
        
        return jsonify({
            'message': 'User created successfully',
            'email': email,
            'otp': otp  # For demo purposes
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        
        if not all([email, otp]):
            return jsonify({'error': 'Email and OTP are required'}), 400
        
        # Find OTP
        otp_record = otp_collection.find_one({
            'email': email,
            'otp': otp,
            'purpose': 'email_verification'
        })
        
        if not otp_record:
            return jsonify({'error': 'Invalid OTP'}), 400
        
        # Update user verification
        users_collection.update_one(
            {'email': email},
            {'$set': {'isVerified': True}}
        )
        
        # Delete used OTP
        otp_collection.delete_one({'_id': otp_record['_id']})
        
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 400
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 400
        
        if not user.get('isVerified', False):
            return jsonify({'error': 'Please verify your email first'}), 400
        
        # Create response (simplified token for demo)
        user_data = {
            'userId': user['userId'],
            'email': user['email'],
            'fullName': user['fullName'],
            'role': user['role'],
            'token': f"demo_token_{user['userId']}"  # Demo token
        }
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
def get_profile():
    try:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '').strip()

        user_id = None
        if token.startswith('demo_admin_token_'):
            user_id = token[len('demo_admin_token_'):]
        elif token.startswith('demo_token_'):
            user_id = token[len('demo_token_'):]

        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        user = users_collection.find_one({'userId': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_data = {
            'userId': user['userId'],
            'fullName': user['fullName'],
            'email': user['email'],
            'role': user['role'],
            'mobile': user.get('mobile')
        }

        return jsonify(user_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find admin user
        user = users_collection.find_one({'email': email, 'role': 'admin'})
        if not user:
            return jsonify({'error': 'Invalid admin credentials'}), 400
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid admin credentials'}), 400
        
        # Create admin response
        admin_data = {
            'userId': user['userId'],
            'email': user['email'],
            'fullName': user['fullName'],
            'role': user['role'],
            'token': f"demo_admin_token_{user['userId']}"  # Demo token
        }
        
        return jsonify(admin_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 400
        
        # Generate OTP (6-digit numeric)
        otp = str(random.randint(100000, 999999))
        otp_data = {
            'email': email,
            'otp': otp,
            'purpose': 'password_reset',
            'createdAt': datetime.utcnow()
        }
        otp_collection.insert_one(otp_data)
        
        return jsonify({
            'message': 'OTP sent to email',
            'otp': otp  # For demo purposes
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('newPassword')
        
        if not all([email, otp, new_password]):
            return jsonify({'error': 'Email, OTP, and new password are required'}), 400
        
        # Find OTP
        otp_record = otp_collection.find_one({
            'email': email,
            'otp': otp,
            'purpose': 'password_reset'
        })
        
        if not otp_record:
            return jsonify({'error': 'Invalid OTP'}), 400
        
        # Hash new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        # Update password
        users_collection.update_one(
            {'email': email},
            {'$set': {'password': hashed_password.decode('utf-8')}}
        )
        
        # Delete used OTP
        otp_collection.delete_one({'_id': otp_record['_id']})
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/destinations', methods=['GET'])
def get_destinations():
    try:
        destinations = list(destinations_collection.find({}, {'_id': 0}))
        return jsonify(destinations), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/destinations/<destination_id>', methods=['GET'])
def get_destination(destination_id):
    try:
        destination = destinations_collection.find_one({'destinationId': destination_id}, {'_id': 0})
        if not destination:
            return jsonify({'error': 'Destination not found'}), 404
        return jsonify(destination), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/destinations', methods=['POST'])
def create_destination():
    try:
        data = request.get_json()
        
        destination = {
            'destinationId': str(uuid.uuid4()),
            'name': data.get('name'),
            'description': data.get('description'),
            'location': data.get('location'),
            'price': data.get('price'),
            'duration': data.get('duration'),
            'images': data.get('images', []),
            'inclusions': data.get('inclusions', []),
            'exclusions': data.get('exclusions', []),
            'itinerary': data.get('itinerary', []),
            'createdAt': datetime.utcnow()
        }
        
        destinations_collection.insert_one(destination)
        
        return jsonify({'message': 'Destination created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/destinations/<destination_id>', methods=['PUT'])
def update_destination(destination_id):
    try:
        data = request.get_json()
        
        update_data = {k: v for k, v in data.items() if v is not None}
        
        result = destinations_collection.update_one(
            {'destinationId': destination_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Destination not found'}), 404
        
        return jsonify({'message': 'Destination updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/destinations/<destination_id>', methods=['DELETE'])
def delete_destination(destination_id):
    try:
        result = destinations_collection.delete_one({'destinationId': destination_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Destination not found'}), 404
        
        return jsonify({'message': 'Destination deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    try:
        data = request.get_json()
        
        booking = {
            'bookingId': str(uuid.uuid4()),
            'userId': data.get('userId'),
            'destinationId': data.get('destinationId'),
            'destinationName': data.get('destinationName'),
            'travelDate': data.get('travelDate'),
            'numberOfPeople': data.get('numberOfPeople'),
            'totalPrice': data.get('totalPrice'),
            'status': 'confirmed',
            'createdAt': datetime.utcnow()
        }
        
        bookings_collection.insert_one(booking)
        
        return jsonify({'message': 'Booking created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/user/<user_id>', methods=['GET'])
def get_user_bookings(user_id):
    try:
        bookings = list(bookings_collection.find({'userId': user_id}, {'_id': 0}))
        return jsonify(bookings), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create sample data
    if destinations_collection.count_documents({}) == 0:
        sample_destinations = [
            {
                'destinationId': 'dest_1',
                'name': 'Bali Paradise',
                'description': 'Experience the magical beauty of Bali with its stunning beaches, ancient temples, and vibrant culture.',
                'location': 'Bali, Indonesia',
                'price': 1299,
                'duration': '7 days',
                'images': ['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20Bali%20beach%20with%20temples%20and%20sunset&image_size=landscape_16_9'],
                'inclusions': ['Flight tickets', 'Hotel accommodation', 'Breakfast', 'Local transport', 'Tour guide'],
                'exclusions': ['Personal expenses', 'Lunch & dinner', 'Travel insurance'],
                'itinerary': ['Day 1: Arrival in Bali', 'Day 2: Temple tour', 'Day 3: Beach day', 'Day 4: Cultural experience', 'Day 5: Adventure activities', 'Day 6: Shopping & relaxation', 'Day 7: Departure']
            },
            {
                'destinationId': 'dest_2',
                'name': 'Swiss Alps Adventure',
                'description': 'Discover the breathtaking Swiss Alps with snow-capped mountains, pristine lakes, and charming villages.',
                'location': 'Switzerland',
                'price': 2499,
                'duration': '10 days',
                'images': ['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Swiss%20Alps%20mountain%20landscape%20with%20snow%20and%20lakes&image_size=landscape_16_9'],
                'inclusions': ['Flight tickets', 'Hotel accommodation', 'All meals', 'Mountain railway passes', 'Tour guide'],
                'exclusions': ['Personal expenses', 'Travel insurance', 'Optional activities'],
                'itinerary': ['Day 1: Arrival in Zurich', 'Day 2: Lucerne exploration', 'Day 3: Mount Pilatus', 'Day 4: Interlaken', 'Day 5: Jungfraujoch', 'Day 6: Grindelwald', 'Day 7: Lake Thun', 'Day 8: Bern capital', 'Day 9: Final shopping', 'Day 10: Departure']
            },
            {
                'destinationId': 'dest_3',
                'name': 'Tokyo & Kyoto Experience',
                'description': 'Immerse yourself in the perfect blend of modern Tokyo and traditional Kyoto with cultural experiences.',
                'location': 'Japan',
                'price': 1899,
                'duration': '8 days',
                'images': ['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Tokyo%20cityscape%20with%20traditional%20Japanese%20temples%20and%20modern%20buildings&image_size=landscape_16_9'],
                'inclusions': ['Flight tickets', 'Hotel accommodation', 'Daily breakfast', 'JR Pass', 'Cultural activities'],
                'exclusions': ['Lunch & dinner', 'Personal expenses', 'Travel insurance'],
                'itinerary': ['Day 1: Arrival in Tokyo', 'Day 2: Tokyo city tour', 'Day 3: Traditional Tokyo', 'Day 4: Travel to Kyoto', 'Day 5: Kyoto temples', 'Day 6: Arashiyama', 'Day 7: Nara day trip', 'Day 8: Departure']
            }
        ]
        destinations_collection.insert_many(sample_destinations)
        
        # Create admin user
        admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        admin_user = {
            'userId': 'admin_1',
            'email': 'admin@tourley.com',
            'password': admin_password.decode('utf-8'),
            'fullName': 'Tourley Admin',
            'mobile': '1234567890',
            'role': 'admin',
            'isVerified': True,
            'createdAt': datetime.utcnow()
        }
        users_collection.insert_one(admin_user)
    
    print("Starting Tourley API server...")
    print("API endpoints available at http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)