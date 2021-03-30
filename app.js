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
  if (color == '#000000'){
    color = getRandomColor();
  }
  return color;
}

function toggleDarkMode() {
  var element = document.body;
  element.classList.toggle("dark-mode");
}

function updateMessageBuffer(){
  // Count the messages and start deleting old ones after threshold is reached
  msgCounter += 1;
  if (msgCounter >= 30) {
    msgsElement.removeChild(msgsElement.lastChild);
    countElement.textContent = msgCounter + " | 30";
  }
  else {
    countElement.textContent = msgCounter + " | " + msgCounter;
  }
}

function getUserColour(username, colour){
  // user colour
  if (colour == null) {
    colour = dictUserColour[username];
    if ( colour == null) {
      colour = getRandomColor();
      dictUserColour[username] = colour;
    }
  }

  return colour;
}

function createTimeContainer(){
  let currentDate = new Date();
  let time = (currentDate.getHours()<10?'0':'') + currentDate.getHours() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes();
  let containerTime = document.createElement("span");
  let nodeTime = document.createTextNode (time);
  containerTime.appendChild(nodeTime);

  return containerTime;
}

function createUserContainer(username, displayName, color){
  let containerUser = document.createElement("span");
  let nodeUserDisplayName = document.createTextNode (displayName);
  containerUser.appendChild(nodeUserDisplayName);
  containerUser.style.color = getUserColour(username, color);

  return containerUser;
}

function createEventTypeContainer(username, displayName, color){
  let containerUser = document.createElement("span");
  let nodeUserDisplayName = document.createTextNode (displayName);
  containerUser.appendChild(nodeUserDisplayName);
  containerUser.style.color = getUserColour(username, color);

  return containerUser;
}

function createMessageContainer(message){
  let containerMsg = document.createElement("span");
  let nodeMsg = document.createTextNode (message);
  containerMsg.appendChild(nodeMsg);

  return containerMsg;
}

function createMessageElement(containerTime, containerUser, containerMsg){
  // Create element to display - Format: "[Time] [userDisplayName]: [message]"
  var container = document.createElement("div");
  container.appendChild(containerTime);
  let space = document.createTextNode(" ");
  container.appendChild(space);
  container.appendChild(containerUser);
  let seperator = document.createTextNode(": ");
  container.appendChild(seperator);
  container.appendChild(containerMsg);

  return container;
}

client.on('message', (wat, tags, message, self) => {
  if (self) return;
  const { username } = tags;
  const { color } = tags;
  const { 'display-name': displayName } = tags;

  if (username.includes("bot")) return;

  // Time
  let containerTime = createTimeContainer();

  // Username
  let containerUser = createUserContainer(username, displayName, color);

  // Message
  let containerMsg = createMessageContainer(message);

  // Create element to display
  var container = createMessageElement(containerTime, containerUser, containerMsg);
  
  msgsElement.prepend(container);
  
  updateMessageBuffer();
});

function createEventContainer(strEventType, strMessage){

}

client.on("subscription", (channel, username, method, message, userstate) => {
  console.log("sub");
});

client.on("cheer", (channel, userstate, message) => {
  const { username } = userstate;
  const { color } = userstate;
  const { 'display-name': displayName } = userstate;
  const { bits } = userstate;
  message = message.replace("cheer"+bits, "");
  console.log(username + " ; " + color + " ; " + displayName + " ; " + bits + " ; " + message);
});

client.on("raided", (channel, username, viewers) => {
  console.log("raided");
});