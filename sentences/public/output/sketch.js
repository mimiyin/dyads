// Open and connect input socket
let socket = io("/output");

// Listen for confirmation of connection
socket.on("connect", function () {
  console.log("Connected");
});

// Keep track of users
let users = {};

// Pause between
const INTERVAL = 1000;

function setup() {
  createCanvas(windowWidth, windowHeight);

  socket.on("idx", function (idx) {
    users[idx] = new User(idx);
    console.log("idx joined: ", users);
  });

  // Listen for new data
  socket.on("strike", function (idx) {
    let user = users[idx];
    if (user) user.strike(idx);
  });

  // Remove disconnected users
  socket.on("disconnect", function (id) {
    delete users[id];
  });
}



function draw() {
  background("black");
  for (let u in users) {
    let user = users[u];
    user.run();
  }

}

class User {
  constructor(idx) {
    console.log("idx", idx);

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
    if(this.go) {
      // 1-3, 4-6 (2*2, 2*3)
      let bottom = this.idx * this.idx;
      let top = this.idx * 3 + 1;
      let strikeIdx = floor(random(bottom, top));
      console.log("STRIKE", strikeIdx);
      socket.emit('strike', strikeIdx);
      this.go = false;
      setTimeout(()=>{
        this.go = true;
      }, INTERVAL);

    }
  }

  display() {
    noStroke();
    fill('red');
    ellipse(this.loc.x, this.loc.y, this.diam);
  }

}

// Manual mode
function keyPressed() {
  socket.emit('strike', key);
}
