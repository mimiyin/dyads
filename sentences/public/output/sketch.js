// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function() {
  console.log("Connected");
});

// Keep track of users
let users = {};
const VOICES = ['Victoria', 'Alex'];

// Pause between
const STRIKE_DELAY = 500;

// speech
let strikeIdx = 0;

// Array of words
let words = {
  1 : [],
  2 : []
};

// Which word set are we on?
let w = 0;
let word = '';

let speech = new p5.Speech(); // speech synthesis object

function preload() {
  loadStrings('1.txt', process);
  loadStrings('2.txt', process);
}

function process(lines) {
  let idx = lines[0];
  console.log(idx);
  for (let l in lines) {
    if(l == 0) continue;
    let line = lines[l];
    if(line == '') continue;
    let tokens = splitTokens(line);
    words[idx].push(tokens);
  }
  console.log("WORDS", words);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // let voices = speech.listVoices();
  // console.log(voices, voices.length);
  //speech.setVoice('Google português do Brasil');

  socket.on("idx", function(idx) {
    users[idx] = new User(idx);
    console.log("idx joined: ", users);
  });

  // Listen for new data
  socket.on("strike", function(idx) {
    if (!(idx in users)) users[idx] = new User(idx);
    let user = users[idx];
    user.strike(idx);
  });

  // Remove disconnected users
  socket.on("disconnect", function(id) {
    delete users[id];
  });
}



function draw() {
  background("black");
  for (let u in users) {
    let user = users[u];
    user.run();
  }

  textSize(64);
  textAlign(CENTER, CENTER);
  fill(255);
  text(w + ': ' + word, width/2, 100);
}

class User {
  constructor(idx) {
    let x = width * (idx > 1 ? 0.67 : 0.34);
    let y = height / 2;
    this.loc = createVector(x, y);
    this.diam = 100;

    this.idx = idx;
    this.go = true;
  }

  run() {
    this.display();
  }

  strike(idx) {
    this.idx = idx;
    if (this.go) {
      this.go = false;
      word = random(words[idx][w]);
      console.log("STRIKE", frameCount, this.go, idx, word);
      speech.setVoice(VOICES[int(idx)-1]);
      speech.speak(word); // say something
      //socket.emit('speak', {idx : idx, word: word});
      setTimeout(() => {
        this.go = true;
      }, STRIKE_DELAY);

    }
  }

  display() {
    noStroke();
    fill('red');
    ellipse(this.loc.x, this.loc.y, this.diam);
  }

}

function mousePressed() {
  speech.setVoice('Victoria');
  speech.speak(random(['hello', 'goodbye', 'forever', 'woof']));
}

// Manual mode
function keyPressed() {

  switch(key) {
    case 's':
      socket.emit('strike', {idx : 1, word: random(['yes1', 'probably1', 'yes2', 'maybe1']) });
      break;
  }

  switch(keyCode) {
    case RIGHT_ARROW:
      w++;
      break;
    case LEFT_ARROW:
      w--;
      break;
  }

  w = constrain(w, 0, words[1].length);
}
