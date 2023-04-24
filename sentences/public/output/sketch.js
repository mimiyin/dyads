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
  for (let l in lines) {
    if(l == 0) continue;
    let line = lines[l];
    if(line == '') continue;
    let tokens = splitTokens(line);
    words[idx].push(tokens);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // let voices = speech.listVoices();
  // console.log(voices, voices.length);
  //speech.setVoice('Google português do Brasil');

  socket.on("idx", function(message) {
    let _idx = message.idx;
    users[_idx] = new User(_idx);
    console.log("idx joined: ", _idx);
  });

  // Listen for new data
  socket.on("strike", function(_idx) {
    if (!(_idx in users)) users[_idx] = new User(_idx);
    let user = users[_idx];
    user.strike(_idx);
  });

  // Listen for new battery data
  socket.on('bat', function(message){
    let _idx = message.idx;
    if (!(_idx in users)) users[_idx] = new User(_idx);
    let bat = message.bat;
    let user = users[_idx];
    user.bat = bat;
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

  textSize(24);
  textAlign(LEFT, CENTER);
  text('SHIFT: 1', 10, 50);
  textAlign(RIGHT, CENTER);
  text('RETURN: 2', width-10, 50);

  textSize(16);
  for(let idx in words) {
    idx = int(idx);
    let scenes = words[idx];
    let y = height/2;
    textAlign(idx == 1 ? RIGHT : LEFT, CENTER);
    for(let sc in scenes) {

      let wordset = scenes[sc];
      y+=20;
      let str = idx == 2 ? '\t\t\t\t' + nfs(sc, 2, 0) + '\t\t\t\t\t' : '';
      for(let word of wordset) {
        str += word + ' ';
      }
      fill(sc == w ? 'red' : 'white');
      text(str, width/2, y);
    }
  }
}

class User {
  constructor(idx) {
    let x = width * (idx > 1 ? 0.67 : 0.34);
    let y = height / 3;
    this.loc = createVector(x, y);
    this.diam = 100;

    this.idx = idx;
    this.go = true;

    this.bat = -1;
  }

  run() {
    this.display();
  }

  strike() {
    if (this.go) {
      this.go = false;
      word = random(words[this.idx][w]);
      console.log("STRIKE", this.idx, word);
      //speech.setVoice(VOICES[int(this.idx)-1]);
      //speech.speak(word); // say something
      socket.emit('strike', {idx : this.idx, word: word});
      setTimeout(() => {
        this.go = true;
      }, STRIKE_DELAY);

    }
  }

  display() {
    push();

    translate(this.loc.x, this.loc.y);

    fill(this.go ? "red" : "green");
    ellipse(0, 0, this.diam, this.diam);

    fill(255);
    textAlign(CENTER, CENTER);
    text(this.bat, 0, 0);

    pop();
  }

}

// Manual mode
function keyPressed() {

  switch(keyCode) {
    case SHIFT:
      if(!(1 in users)) users[1] = new User(1);
      users[1].strike();
      break;
    case RETURN:
      if(!(2 in users)) users[2] = new User(2);
      users[2].strike();
      break;
    case 33:
      w++;
      break;
    case 34:
      w--;
      break;
  }

  // Wrap around
  if(w >= words[1].length) w = 0;
  if(w < 0) w = words[1].length-1;
}
