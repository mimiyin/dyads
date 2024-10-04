//
// Set note positions of notes with mousedrag
// When both people have occupied a position for a certain amount of time - click them to the next stage

// Load and save spreadsheet of settings
// Initial set of positions for each movers
// Notes for each mover
// Time delay for each pair of positions

let cues = [{
    x: 100,
    y: 100,
    n: 'do'
  },
  {
    x: 300,
    y: 100,
    n: 'mi'
  },
  {
    x: 300,
    y: 400,
    n: 'so'
  },
  {
    x: 300,
    y: 500,
    n: 'ti'
  },
]


// Open and connect socket
let socket = io();

// 10 seconds in each location
const DURATION = 10000;

// Set the mode
let mode = 1;
const MOVER = 0;
const NOTE = 1;

// Remembering where we are
let o = 0;
let po = 0;
let a;
let pr = 1;
let rate = 1;
let prate = 1;

let moverTagPairs = {
  'A': {
    10002038: null,
    10002092: null
  },
  'B': {
    10002041: null,
    10002032: null
  }
}

let tags2MoversLookup = {
  10002038: 'A',
  10002092: 'A',
  10002041: 'B',
  10002032: 'B'
}

// Track movers
let movers = {
  'A': undefined,
  'B': undefined
};

// Locales
let notes = [];
let START;

// Test sound
let osc;

// Size of note area
const RAD = 30;



// Listen for when the socket connects
socket.on('connect', function() {
  // Log a success message
  console.log("HEY I'VE CONNECTED");
});

function preload() {
  cues = loadJSON('cues.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  osc = new p5.Oscillator("sine", 440);
  osc.amp(0);

  // Load all the cues
  for (let c in cues) {
    let cue = cues[c];
    let x = cue.x;
    let y = cue.y;
    let n = cue.n;

    // Create new note
    notes.push(new Note(c, x, y, n));
  }

  // Set starting note
  START = notes[0];


  // Listen for data coming from the server
  socket.on('pozyx', function(message) {
    //return;
    // Log the data
    //console.log('Received message: ', message);
    // Draw a circle at the y-position of the other user
    let tag = message[0];
    let data = tag.data;
    let id = tag.tagId;
    let ts = tag.ts;
    if (data) {
      if (data.coordinates) {
        let x = data.coordinates.x / 20;
        let y = (data.coordinates.y / 20) + 250;
        console.log(data.coordinates.x);
        calc(id, {
          x: x,
          y: y,
          ts: ts
        });
      }
    }
  });

  textSize(10);
  textAlign(RIGHT, BOTTOM);
}

function draw() {
  background(255);

  // Show the notes.
  for (let note of notes) {
    note.display();
  }

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

  if (mouseIsPressed) {
    position();
  }


  try {
    // Is everyone ready to move on?
    let _movers = Object.values(movers);
    // Run every mover
    _movers.forEach((mover) => { if(mover) mover.run() });

    // let ready = _movers.every((mover) => mover.ready());
    // // If everyone ready, move everyone ahead
    // if (ready) _movers.forEach((mover) => {
    //   mover.next()
    // })
  } catch (e) {
    //console.log("No movers yet!", e);
  }
}

function position() {
  switch (mode) {
    case MOVER:
      // Straight mouse testing
      for (let m in movers) {
        let mover = movers[m];
        if (mover) mover.move(mouseX, mouseY);
      }
      break;
    case NOTE:
      // Straight mouse testing
      for (let note of notes) note.position(mouseX, mouseY);

      break;
  }
}

function mouseReleased() {

  switch (mode) {
    case MOVER:
      for (let m in movers) {
        let mover = movers[m];
        if (mover) mover.release();
      }
      break;
    case NOTE:
      for (let note of notes) {
        if (note.isInside(mouseX, mouseY)) note.release();
      }
      break;
  }
}

function keyPressed() {

  switch (key) {
    case 's':
      osc.amp(0);
      osc.start();
      osc.amp(1);
      console.log(movers);

      try {
        for(let m in movers){
          let mover = movers[m];
          if(mover) {
            mover.osc.amp(1);
            mover.osc.start();
            mover.click.play();
          }
        }

        for(let note of notes) {
          note.osc.amp(1);
          note.osc.start();
        }
      } catch(e) {
        console.log('No movers yet!');
      }

      break;
    case 'm':
      mode = MOVER;
      console.log("Mode: Mover");
      break;
    case 'n':
      mode = NOTE;
      console.log("Mode: Note");
      break;
    case 'w':
      saveJSON(cues, 'cues-' + Date.now() + '.json');
      break;
  }
}

function keyReleased() {
  if (key == 's') {
    osc.amp(0);

    try {
      for(let m in movers){
        let mover = movers[m];
        mover.white.stop();
      }

      for(let note of notes) {
        note.osc.amp(1);
        note.osc.start();
      }
    } catch(e) {
      console.log('No movers yet!');
    }
  }

  for(let note of notes) note.osc.amp(0);

  switch (mode) {
    case MOVER:
      for(let m in movers) {
        if(m == key.toUpperCase()) movers[m] = new Mover(m, mouseX, mouseY, PI / 2, Date.now());
      }
      break;
  }
}
