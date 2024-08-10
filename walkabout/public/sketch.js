// Open and connect socket
let socket = io();


// Remembering where we are
let o = 0;
let po = 0;
let a;
let pr = 1;
let rate = 1;
let prate = 1;

let moverTagPairs = {
  'A': {
    0: null,
    1: null
  },
  'B': {
    2: null,
    3: null
  }
}

let tags2MoversLookup = {
  0: 'A',
  1: 'A',
  2: 'B',
  3: 'B'
}

// Track movers
let movers = {
  'A': undefined,
  'B': undefined
};

// Locales
let notes = [];

const RAD = 30;

// Listen for when the socket connects
socket.on('connect', function() {
  // Log a success message
  console.log("HEY I'VE CONNECTED");
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  osc = new p5.Oscillator("sine", 440);
  osc.amp(0);

  notes.push(new Note(width / 2, height / 2, PI / 2, 1));
  //notes.push(new Note(random(width), random(height), PI/4, 1));


  // Listen for data coming from the server
  socket.on('pozyx', function(message) {
    // Log the data
    //console.log('Received message: ', message);
    // Draw a circle at the y-position of the other user
    let tag = message[0];
    let data = tag.data;
    let id = tag.tagId;
    let ts = tag.ts;
    if (data) {
      if (data.coordinates) {
        let x = data.coordinates.x / 10;
        let y = data.coordinates.y / 10;

        //console.log(id, x, y);
        tags[id] = {
          x: x,
          y: y,
          ts: ts
        };
      }
    }
  });

  textSize(10);
  textAlign(RIGHT, BOTTOM);
}

function draw() {
  background(255);

  // Show the notes.
  for (let note of notes) note.display();

  // Draw all the tags
  for (let m in moverTagPairs) {
    let moverTagPair = moverTagPairs[m];
    let pcount = 0;
    let start, end;
    for (let t in moverTagPair) {
      let tag = moverTagPair[t];
      if (!tag) break;
      ellipse(tag.x, tag.y, 5);
      if (pcount == 0) start = tag;
      else end = tag;
      pcount++;
    }
    if (start && end) {
      line(start.x, start.y, end.x, end.y);
      if (start) {
        fill('darkgray');
        ellipse(start.x, start.y, 5, 5);
      }
      if (end) {
        fill('lightgray');
        ellipse(end.x, end.y, 5, 5);
      }
    }
  }


  for (let m in movers) {
    let mover = movers[m];
    if (mover) {
      mover.run();
    }
  }

}

let idx = 0;
let osc;
let active = false;

function keyPressed() {
  idx++;
  idx %= 4;

  // Test tags
  calc(idx, {
    x: mouseX,
    y: mouseY,
    ts: Date.now()
  });

  
}

function mousePressed() {
  if (active) return;
  osc.amp(0);
  osc.start();
  osc.amp(1);
  active = true;
}

function mouseReleased() {
  //vol.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 5);
  osc.amp(0, 2);


}
