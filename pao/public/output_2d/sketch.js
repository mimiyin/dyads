//the socket here is just a relay, whatever it gets it spits out
//this sketch should run on desktop (not phone)
var socket = io("/output");


const DATA_RATE = 20;
const SAMPLE_RATE = 20;
const STRIKE_TH = 10;

let diag = 0;
let o = 0;

socket.on('connect', () => {
  console.log("Connected!")
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  fill(200);
  angleMode(DEGREES);
  diag = sqrt(sq(width) + sq(height));
  strokeCap(PROJECT);

}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  for (let r = 0; r < ratios.length; r++) {
    let ratio = ratios[r];
    let angle = map(ratio.num / ratio.den, 1, 2, -90, 270);
    strokeWeight(25 - (ratio.num + ratio.den));
    push();
    // NORTH
    if (angle == 0) stroke("green");
    else stroke(255, 32);
    rotate(angle);
    line(0, 0, diag / 2, 0);
    pop();
  }

  push();
  rotate(o);
  stroke("red");
  strokeWeight(20);
  line(0, 0, 0, -diag / 2);
  pop();

  if(frameCount%60 == 1) console.log(round(frameCount/60), o);

}

//
socket.on("orientation", function(message) {
  o = message.o;
});

function keyPressed() {
  if (key == 'a') {
    socket.emit("set_data_rate", SEND_RATE);
  }
  if (key == 's') {
    socket.emit("set_sample_rate", SAMPLE_RATE);
  }
  if (key == 'd') {
    socket.emit("set_strike_th", STRIKE_TH);
  }
}

function mousePressed() {
  // socket.emit("message","beep");
  // socket.emit("set_data_rate",100);

  // background(random(255));
}
