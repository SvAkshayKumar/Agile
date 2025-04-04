from flask import Flask, render_template, request, jsonify
import requests
import sqlite3

app = Flask(__name__, template_folder='templates', static_folder='static')
API_URL = "http://localhost:4000"  # Change this if running on a different server

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send', methods=['POST'])
def send_message():
    data = request.json
    response = requests.post(f"{API_URL}/messages", json=data)
    return jsonify(response.json())

@app.route('/messages/<roomCode>')
def get_messages(roomCode):
    response = requests.get(f"{API_URL}/messages/room/{roomCode}")
    return jsonify(response.json())

@app.route('/messages/<sender_email>/<receiver_email>', methods=['GET'])
def get_user_messages(sender_email, receiver_email):  # Renamed function
    response = requests.get(f"{API_URL}/messages/{sender_email}/{receiver_email}")
    
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)