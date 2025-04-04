const socket = io("http://localhost:5000");

// Join a Room
socket.emit("join_room", { room_code: "room123" });

// Send a Message
socket.emit("send_message", {
    room_code: "room123",
    sender_email: "user1@example.com",
    receiver_email: "user2@example.com",
    text: "Hello! This is a test message."
});

// Receive a Message
socket.on("new_message", (message) => {
    console.log("New Message:", message);
});

// Leave a Room
socket.emit("leave_room", { room_code: "room123" });
