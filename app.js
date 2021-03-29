const msgsElement = document.querySelector('#msgs');
const usersElement = document.querySelector('#users');
const statusElement = document.querySelector('#status');
const countElement = document.querySelector('#count');

const params = new URLSearchParams(window.location.search);
const channel = params.get('channel') || 'd7gr';
const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true,
  },
  channels: [channel],
});

client.connect().then(() => {
  statusElement.textContent = `Listening for messages in ${channel}...`;
});

let users = {};
let msgCounter = 0;
var dictUserColour = {};

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function toggleDarkMode() {
  var element = document.body;
  element.classList.toggle("dark-mode");
}

client.on('message', (wat, tags, message, self) => {
  if (self) return;
  const { username } = tags;
  const { color } = tags;
  const { 'display-name': displayName } = tags;

  if (username.includes("bot")) return;

  // Time
  let currentDate = new Date();
  let time = currentDate.getHours() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes();
  let containerTime = document.createElement("span");
  let nodeTime = document.createTextNode (time);
  containerTime.appendChild(nodeTime);

  // Username
  let containerUser = document.createElement("span");
  let nodeUserDisplayName = document.createTextNode (displayName);
  containerUser.appendChild(nodeUserDisplayName);
  // user colour
  if (color != null) {
    containerUser.style.color = color;
  }
  else {
    var userColour = dictUserColour[username];
    if ( userColour == null) {
      userColour = getRandomColor();
      dictUserColour[username] = userColour;
    }
    containerUser.style.color = userColour;
  }

  // Message
  let containerMsg = document.createElement("span");
  let nodeMsg = document.createTextNode (message);
  containerMsg.appendChild(nodeMsg);

  // Create element to display
  var container = document.createElement("div");
  container.appendChild(containerTime);
  let space = document.createTextNode(" ");
  container.appendChild(space);
  container.appendChild(containerUser);
  let seperator = document.createTextNode(": ");
  container.appendChild(seperator);
  container.appendChild(containerMsg);
  msgsElement.prepend(container);
  
  // Count the messages and start deleting old ones after threshold is reached
  msgCounter += 1;
  if (msgCounter >= 30) {
    msgsElement.removeChild(msgsElement.lastChild);
    countElement.textContent = msgCounter + " | 30";
  }
  else {
    countElement.textContent = msgCounter + " | " + msgCounter;
  }
});
