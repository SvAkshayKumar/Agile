from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit
import sqlite3

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# 📌 Initialize SQLite Database
def init_db():
    conn = sqlite3.connect('database.sqlite')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_code TEXT,
            sender_email TEXT,
            receiver_email TEXT,
            text TEXT,
            image BLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()  # Call this once to create the database

# 📌 **POST: Send Message to a Room**
@app.route('/messages', methods=['POST'])
def send_message():
    data = request.json
    room_code = data['room_code']
    sender_email = data['sender_email']
    receiver_email = data['receiver_email']
    text = data.get('text', '')
    image = data.get('image', None)

    conn = sqlite3.connect('database.sqlite')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO messages (room_code, sender_email, receiver_email, text, image) VALUES (?, ?, ?, ?, ?)',
        (room_code, sender_email, receiver_email, text, image)
    )
    conn.commit()
    message_id = cursor.lastrowid
    conn.close()

    message = {
        "message_id": message_id,
        "room_code": room_code,
        "sender_email": sender_email,
        "receiver_email": receiver_email,
        "text": text,
        "image": image
    }

    socketio.emit('new_message', message, room=room_code)  # Broadcast message to the room
    return jsonify({"success": True, "message_id": message_id})

# 📌 **GET: Fetch Chat History of a Room**
@app.route('/messages/<room_code>', methods=['GET'])
def get_messages(room_code):
    conn = sqlite3.connect('database.sqlite')
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM messages WHERE room_code = ? ORDER BY created_at',
        (room_code,)
    )
    messages = cursor.fetchall()
    conn.close()

    return jsonify([{
        "message_id": msg[0],
        "room_code": msg[1],
        "sender_email": msg[2],
        "receiver_email": msg[3],
        "text": msg[4],
        "image": msg[5],
        "created_at": msg[6]
    } for msg in messages])

# 📌 **Socket Events for Real-Time Chat**
@socketio.on('join_room')
def handle_join(data):
    room_code = data['room_code']
    join_room(room_code)
    emit('user_joined', {"message": f"User joined {room_code}"}, room=room_code)

@socketio.on('leave_room')
def handle_leave(data):
    room_code = data['room_code']
    leave_room(room_code)
    emit('user_left', {"message": f"User left {room_code}"}, room=room_code)

@socketio.on('send_message')
def handle_message(data):
    room_code = data['room_code']
    sender_email = data['sender_email']
    receiver_email = data['receiver_email']
    text = data.get('text', '')
    image = data.get('image', None)

    conn = sqlite3.connect('database.sqlite')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO messages (room_code, sender_email, receiver_email, text, image) VALUES (?, ?, ?, ?, ?)',
        (room_code, sender_email, receiver_email, text, image)
    )
    conn.commit()
    message_id = cursor.lastrowid
    conn.close()

    message = {
        "message_id": message_id,
        "room_code": room_code,
        "sender_email": sender_email,
        "receiver_email": receiver_email,
        "text": text,
        "image": image
    }

    emit('new_message', message, room=room_code)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
