const msgsElement = document.querySelector('#msgs');
const usersElement = document.querySelector('#users');
const statusElement = document.querySelector('#status');
const countElement = document.querySelector('#count');

const params = new URLSearchParams(window.location.search);
const channel = params.get('channel') || 'd7gr';
const addhour = Number(params.get('addhours')) || 0;
const client = new tmi.Client({
    connection: {
        secure: true,
        reconnect: true,
    },
    channels: [channel],
});

client.connect().then(() => {
    console.log(`Listening for messages in ${channel}...`);
});

let users = {};
let msgCounter = 0;
var dictUserColour = {};
var dictSubGifter = {};
var subCheckTimer = null;

function getRandomColour() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    // Regenerate if colour is black
    if (color == '#000000') {
        color = getRandomColour();
    }
    return color;
}

function toggleDarkMode() {
    var element = document.body;
    element.classList.toggle('dark-mode');
}

function updateMessageBuffer() {
    // Count the messages and start deleting old ones after threshold is reached
    msgCounter += 1;
    if (msgCounter >= 30) {
        msgsElement.removeChild(msgsElement.lastChild);
        //console.log(msgCounter + ' | 30');
    } else {
        //console.log(msgCounter + ' | ' + msgCounter);
    }
}

function getUserColour(username, colour) {
    // user colour
    if (colour == null) {
        colour = dictUserColour[username];
        if (colour == null) {
            colour = getRandomColour();
            dictUserColour[username] = colour;
        }
    }

    return colour;
}

function createTimeElement() {
    // Create time string in the format hh:mm
    let currentDate = new Date();

    var minute = currentDate.getMinutes();
    var hour = currentDate.getHours();

    // fix time zone
    hour = (hour + addhour) % 24;

    let time = (hour < 10 ? '0' : '') + hour + ':' + (minute < 10 ? '0' : '') + minute;
    // Create element and add time
    let containerTime = createSpanElement(time);

    return containerTime;
}

function createUserElement(username, displayName, colour) {
    let containerUser = createSpanElement(displayName);
    containerUser.style.color = getUserColour(username, colour);

    return containerUser;
}

function createSpanElement(message) {
    let containerMsg = document.createElement('span');
    let nodeMsg = document.createTextNode(message);
    containerMsg.appendChild(nodeMsg);
    return containerMsg;
}

function createUnsafeSpanElement(message) {
    let containerMsg = document.createElement('span');
    containerMsg.innerHTML = message;
    return containerMsg;
}

function createChatMessageElement(containerTime, containerUser, containerMsg) {
    // Create element to display - Format: "[Time] [userDisplayName]: [message]"
    /*
  <div class="message">
    <span>[Time]</span><span> </span><span>[userDisplayName]</span><span>: </span><span>[message]</span>
  </div>
  */
    var container = document.createElement('div');
    container.appendChild(containerTime);
    let space = document.createTextNode(' ');
    container.appendChild(space);
    container.appendChild(containerUser);
    let seperator = document.createTextNode(': ');
    container.appendChild(seperator);

    container.appendChild(containerMsg);

    container.classList.value = 'message';

    return container;
}

/*
remove html from message
*/
function sanitizeHTML(text) {
    var element = document.createElement('div');
    element.innerText = text;
    let result = element.innerHTML;
    return result;
}

client.on('message', (wat, tags, message, self) => {
    if (self) return;
    const { username } = tags;
    const { color } = tags;
    const { 'display-name': displayName } = tags;

    if (username.includes('bot')) return;

    // the cleaned html message - removed html messages

    // console.log('Clean Message', cleanMessage);

    // Time
    let containerTime = createTimeElement();

    // Username
    let containerUser = createUserElement(username, displayName, color);

    // Message - enriched with emotes via getMessages, based on the escaped message
    let containerMsg = createUnsafeSpanElement(getMessageHTML(message, tags));

    // Create element to display
    var container = createChatMessageElement(containerTime, containerUser, containerMsg);

    msgsElement.prepend(container);

    updateMessageBuffer();
});

function getMessageHTML(message, { emotes }) {
    message = sanitizeHTML(message);
    if (!emotes) return message;
    // store all emote keywords
    // ! you have to first scan through
    // the message string and replace later
    const stringReplacements = [];

    // iterate of emotes to access ids and positions
    Object.entries(emotes).forEach(([id, positions]) => {
        // use only the first position to find out the emote key word
        const position = positions[0];
        const [start, end] = position.split('-');
        const stringToReplace = message.substring(parseInt(start, 10), parseInt(end, 10) + 1);

        stringReplacements.push({
            stringToReplace: stringToReplace,
            replacement: `<img style="width: 1.0001em; height: 1.0001em;" src="https://static-cdn.jtvnw.net/emoticons/v1/${id}/3.0">`,
        });
    });

    // generate HTML and replace all emote keywords with image elements
    const messageHTML = stringReplacements.reduce((acc, { stringToReplace, replacement }) => {
        // obs browser doesn't seam to know about replaceAll
        return acc.split(stringToReplace).join(replacement);
    }, message);

    return messageHTML;
}

function createEventContainer(strEventType, strMessage) {
    //console.log('event',strEventType,strMessage)

    /*
  <div class="event">
    <div class="event-message">
      <span>[strEventType]</span><span class="message">[strMessage]</span>
    </div>
    <div class="event-type">
      <span>Sub</span>
    </div>
  </div>
  */

    var containerEvent = document.createElement('div');
    containerEvent.classList.value = 'event';

    var containerEventMessage = document.createElement('div');
    containerEventMessage.classList.value = 'event-message';

    // Add the event-message to event-background
    containerEvent.appendChild(containerEventMessage);

    // Create time span and add to event-message
    var containerTimeSpan = createTimeElement();
    containerEventMessage.appendChild(containerTimeSpan);

    // Create message span and add to event-message
    var containerMessageSpan = createSpanElement(strMessage);
    containerMessageSpan.classList.value = 'message';
    containerEventMessage.appendChild(containerMessageSpan);

    // Event type div
    var containerEventType = document.createElement('div');
    containerEventType.classList.value = 'event-type';
    var containerEventTypeSpan = createSpanElement(strEventType);
    containerEventType.appendChild(containerEventTypeSpan);

    // Add event-type to event
    containerEvent.appendChild(containerEventType);

    if (strEventType == 'Sub') {
        //console.log(strMessage);
    } else if (strEventType == 'Sub Gift') {
        //console.log(strMessage);
    } else if (strEventType == 'Cheer') {
        //console.log(strMessage);
    } else if (strEventType == 'Raid') {
        //console.log(strMessage);
    }

    return containerEvent;
}

client.on('subscription', (channel, username, method, message, userstate) => {
    var strMessage = userstate['display-name'] + ' hat Abonniert!';

    var container = createEventContainer('Sub', strMessage);

    msgsElement.prepend(container);
    updateMessageBuffer();
});

function checkGiftSub() {
    for (let username of Object.keys(dictSubGifter)) {
        if (dictSubGifter[username] != null) var [lastAccess, count] = dictSubGifter[username];

        // if no new gifts in the last x millisecond then show message and remove user from dict
        if (Date.now() - lastAccess > 1000) {
            var strMessage = username + ' hat ' + count;
            if (count == 1) {
                strMessage += ' Abo verschenkt!';
            } else {
                strMessage += ' Abos verschenkt!';
            }
            var container = createEventContainer('Sub Gift', strMessage);

            msgsElement.prepend(container);
            updateMessageBuffer();

            delete dictSubGifter[username];
        }
    }

    // Stop timer if no more users in the dict
    if (Object.keys(dictSubGifter).length == 0) {
        clearInterval(subCheckTimer);
    }
}

client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
    var senderDisplayName = userstate['display-name'];
    // Create dict entry
    if (dictSubGifter[senderDisplayName] == null) {
        dictSubGifter[senderDisplayName] = [Date.now(), 0];
        // activate timer to put message after received all events for this user
        subCheckTimer = setInterval(checkGiftSub, 500);
        //console.log("Create gifter " + senderDisplayName);
    }

    // Count number of gifts
    if (dictSubGifter[senderDisplayName] != null) {
        var [lastAccess, count] = dictSubGifter[senderDisplayName];
        dictSubGifter[senderDisplayName] = [Date.now(), count + 1];
        //console.log("Gifter " + senderDisplayName + " add 1");
    }
});

client.on('cheer', (channel, userstate, message) => {
    const { 'display-name': displayName } = userstate;
    //console.log(userstate);
    var { bits } = userstate;

    // remove cheer icon an bits from message
    bits = bits.toString();
    var n = message.indexOf(bits);
    message = message.slice(n + bits.length);

    // Create message
    var strMessage = displayName + ' hat ' + bits + ' spendiert!';
    // Append custom message if given
    //if (message.length > 0){
    //  strMessage += " - " + message;
    //}

    var container = createEventContainer('Cheer', strMessage);

    msgsElement.prepend(container);
    updateMessageBuffer();
});

client.on('raided', (channel, username, viewers) => {
    var strMessage = username + ' stürmt mit ' + viewers + ' Zuschauern!';

    var container = createEventContainer('Raid', strMessage);

    msgsElement.prepend(container);
    updateMessageBuffer();
});
