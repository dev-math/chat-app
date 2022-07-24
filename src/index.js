const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users');

const PORT = process.env.PORT;
const PUBLIC_FOLDER = path.join(__dirname, '../public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(PUBLIC_FOLDER));

io.on('connection', (socket) => {
  socket.on('join', (params, cb) => {
    const { error, user } = addUser({ id: socket.id, ...params });

    if (error) {
      cb(error);
    }

    socket.join(user.room);

    socket.emit('message', { username: 'Admin', ...generateMessage('Welcome!') });
    socket.broadcast.to(user.room).emit('message', { username: 'Admin', ...generateMessage(`${user.username} has connected`) });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    cb();
  });


  socket.on('sendMessage', (message, cb) => {
    const user = getUser(socket.id);

    if (user) {
      const filter = new Filter();

      if (filter.isProfane(message)) {
        return cb('Profanity is not allowed!');
      }

      io.to(user.room).emit('message', { username: user.username, ...generateMessage(message) });
      cb('Delivered!');
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { username: 'Admin', ...generateMessage(`${user.username} has disconnected`) });
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });

  socket.on('sendLocation', (location, cb) => {
    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit('sendLocation', { username: user.username, ...generateMessage(`https://google.com/maps?q=${location.lat},${location.long}`) });
      cb();
    }
  })
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
