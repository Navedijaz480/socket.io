const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: "*", // allow any origin for testing
      methods: ["GET", "POST"]
   }
});

app.use(express.json()); // for parsing application/json

const users = {}; // userId -> socketId
const socketToUser = {}; // socketId -> userId

io.on('connection', (socket) => {
   console.log('A user connected:', socket.id);

   // User joins with their userId
   socket.on('join', ({ userId }) => {
      console.log("🚀 ~ socket.on ~ userId:", userId);
      users[userId] = socket.id;
      socketToUser[socket.id] = userId;
      console.log(`User ${userId} joined with socket ${socket.id}`);
   });

   // Receive a private message
   socket.on('private_message', ({ toUserId, message }) => {
      console.log(11111111111111, users);
      const toSocketId = users[toUserId];
      console.log("🚀 ~ socket.on ~ toSocketIddddddddddddddd:", toSocketId)
      if (toSocketId) {
         io.to(toSocketId).emit('private_message', {
            from: socket.id,
            message,
            success: true
         });
      }

      // Send back to sender
      socket.emit('private_message', {
         from: 'you',
         to: toUserId,
         message,
      });
   });

   // Handle disconnection
   socket.on('disconnect', () => {
      const userId = socketToUser[socket.id];
      if (userId) {
         delete users[userId];
         delete socketToUser[socket.id];
         console.log(`User ${userId} disconnected from socket ${socket.id}`);
      } else {
         console.log(`Unknown user disconnected from socket ${socket.id}`);
      }
   });
});

app.post('/send-message', (req, res) => {
   const { toUserId, message } = req.body;
   const toSocketId = users[toUserId];
   console.log("🚀 ~ app.post ~ toSocketId:", toSocketId)
   if (toSocketId) {
      io.to(toSocketId).emit('private_message', { from: toUserId, message });
      return res.send({ success: true });
   } else {
      return res.status(404).send({ error: "User not connected" });
   }
});

server.listen(3000, () => {
   console.log('Server is running on http://localhost:3000');
});
