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
var dictUserGiftCount = {};

function getRandomColour() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  // Regenerate if colour is black
  if (color == '#000000'){
    color = getRandomColour();
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
      colour = getRandomColour();
      dictUserColour[username] = colour;
    }
  }

  return colour;
}

function createTimeElement(){
  // Create time string in the format hh:mm
  let currentDate = new Date();
  let time = (currentDate.getHours()<10?'0':'') + currentDate.getHours() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes();
  // Create element and add time
  let containerTime = createSpanElement(time);

  return containerTime;
}

function createUserElement(username, displayName, colour){
  let containerUser = createSpanElement(displayName);
  containerUser.style.color = getUserColour(username, colour);

  return containerUser;
}

function createSpanElement(message){
  let containerMsg = document.createElement("span");
  let nodeMsg = document.createTextNode (message);
  containerMsg.appendChild(nodeMsg);

  return containerMsg;
}

function createChatMessageElement(containerTime, containerUser, containerMsg){
  // Create element to display - Format: "[Time] [userDisplayName]: [message]"
  /*
  <div>
    <span>[Time]</span><span> </span><span>[userDisplayName]</span><span>: </span><span>[message]</span>
  </div>
  */
  var container = document.createElement("div");
  container.appendChild(containerTime);
  let space = document.createTextNode(" ");
  container.appendChild(space);
  container.appendChild(containerUser);
  let seperator = document.createTextNode(": ");
  container.appendChild(seperator);
  container.appendChild(containerMsg);

  container.classList.value = "message";

  return container;
}

client.on('message', (wat, tags, message, self) => {
  if (self) return;
  const { username } = tags;
  const { color } = tags;
  const { 'display-name': displayName } = tags;

  if (username.includes("bot")) return;

  // Time
  let containerTime = createTimeElement();

  // Username
  let containerUser = createUserElement(username, displayName, color);

  // Message
  let containerMsg = createSpanElement(message);

  // Create element to display
  var container = createChatMessageElement(containerTime, containerUser, containerMsg);
  
  msgsElement.prepend(container);
  
  updateMessageBuffer();
});

function createEventContainer(strEventType, strMessage){
  /*
  <div class="event">
    <div class="event-background">
      <div class="event-message">
        <span>13:37</span><span class="message">Blechkelle hat ein Abo abgeschlossen!</span>
      </div>
    </div>
    <div class="event-type">
      <span>Sub</span>
    </div>
  </div>
  */
  var containerEvent = document.createElement("div");
  containerMsg.classList.value = "event";

  var containerEventBackground = document.createElement("div");
  containerEventBackground.classList.value = "event-background";

  // Add event-background to event
  containerEventMessage.appendChild(containerEventBackground);

  var containerEventMessage = document.createElement("div");
  containerEventMessage.classList.value = "event-message";
  
  // Add the event-message to event-background
  containerEventBackground.appendChild(containerEventMessage);

  // Create time span and add to event-message
  var containerTimeSpan = createTimeElement();
  containerEventMessage.appendChild(containerTimeSpan);

  // Create message span and add to event-message
  var containerMessageSpan = createSpanElement(strMessage);
  containerMessageSpan.classList.value = "message";
  containerEventMessage.appendChild(containerMessageSpan);


  // Event type div
  var containerEventType = document.createElement("div");
  containerEventType.classList.value = "event-type";
  var containerEventTypeSpan = createSpanElement(strEventType);
  containerEventType.appendChild(containerEventTypeSpan);

  // Add event-type to event
  containerEventMessage.appendChild(containerEventType);
  
  if (strEventType == "Sub"){
    console.log(strMessage);
  }
  else if (strEventType == "Sub Gift"){
    console.log(strMessage);
  } 
  else if (strEventType == "Cheer"){
    console.log(strMessage);
  }
  else if (strEventType == "Raid"){
    console.log(strMessage);
  }

  return containerEvent;
}

client.on("subscription", (channel, username, method, message, userstate) => {
  var strMessage = username + " stürmt mit " + viewers + " zuschauern!";
  
  var container = createEventContainer("Sub", strMessage);

  msgsElement.prepend(container);
  updateMessageBuffer();
});

client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
  // Put message in chat with number of gifted subs
  if (dictUserGiftCount[username] == null || dictUserGiftCount[username] == 0){
    let giftCount = Number(~~userstate["msg-param-sender-count"]);
    let senderDisplayName = ~~userstate["msg-param-sender-display-name"];

    var strMessage = senderDisplayName + " hat " + giftCount + " Abos verschenkt!";
    var container = createEventContainer("Sub Gift", strMessage);

    msgsElement.prepend(container);
    updateMessageBuffer();
  }

  // Count down number of events
  if (dictUserGiftCount[username] != null && dictUserGiftCount[username] > 0){
    dictUserGiftCount[username] -= 1;
  }
});

client.on("cheer", (channel, userstate, message) => {
  const { 'display-name': displayName } = userstate;
  const { bits } = userstate;

  // remove cheer icon an bits from message
  bits = bits.toString();
  var n = str.indexOf(bits);
  message = message.slice(n + bits.length)

  // Create message
  var strMessage = displayName + " hat " + bits + " spendiert!";
  // Append custom message if given
  if (message.length > 0){
    strMessage += " - " + message;
  }

  var container = createEventContainer("Cheer", strMessage);

  msgsElement.prepend(container);
  updateMessageBuffer();
});

client.on("raided", (channel, username, viewers) => {
  var strMessage = username + " stürmt mit " + viewers + " zuschauern!";

  var container = createEventContainer("Raid", strMessage);

  msgsElement.prepend(container);
  updateMessageBuffer();
});