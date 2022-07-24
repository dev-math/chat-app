const socket = io();

// Elements
const $locationBtn = document.getElementById('send-location')
const $messages = document.getElementById('messages');
const $messageForm = document.getElementById('message-form');
const $messageFormBtn = $messageForm.querySelector('button');
const $messageFormInput = $messageForm.querySelector('input');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationMsgTemplate = document.getElementById('location-message-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  document.getElementById('sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormBtn.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;
  socket.emit('sendMessage', message, (error) => {
    $messageFormBtn.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('Message delivered.');
  });
});

socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    time: moment(message.createdAt).format('hh:mm A')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

$locationBtn.addEventListener('click', () => {
  $locationBtn.setAttribute('disabled', 'disabled');

  if (!navigator.geolocation) {
    return alert('Your browser not support geolocation!');
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      lat: position.coords.latitude,
      long: position.coords.longitude
    }, 
      () => {
        $locationBtn.removeAttribute('disabled');
        console.log('Location shared!');
      });
  });
});

socket.on('sendLocation', (url) => {
  console.log(url);
  const html = Mustache.render(locationMsgTemplate, {
    username: url.username,
    url: url.text,
    time: moment(url.createdAt).format('hh:mm A')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
