//the socket here is just a relay, whatever it gets it spits out
//this sketch should run on desktop (not phone)
var socket = io("/output");

let yaw=0;
let pitch=0;
let roll=0;

let r,g,b=0;

socket.on('connect', ()=>{ console.log("Connected!")});

function setup() {
  createCanvas(windowWidth, windowHeight,WEBGL);
  fill(200);
  angleMode(DEGREES);
}

function draw() {
  background(r,g,b);
  push();
  rotateX(pitch);
  rotateY(yaw);
  rotateZ(roll);
  box(60,20,100);
  pop();
}

//
socket.on("message", function (data) {
  console.log("message", data.l);
  //if(data.idx==2){
    yaw=data.yaw;
    pitch=data.l;
    roll=data.o;
    // console.log(pitch);
  //}

  // r=abs(data.acc_x*500);
  // g=abs(data.acc_y*500);
  // b=abs(data.acc_z*500);
});

function keyPressed(){
  if(key=='a'){
      socket.emit("set_data_rate",150);
  }
  if(key=='s'){
      socket.emit("set_sample_rate",50);
  }
  if(key=='d'){
      socket.emit("set_strike_th",5);
  }
}

function mousePressed(){
  // socket.emit("message","beep");
  // socket.emit("set_data_rate",100);

  // background(random(255));
}
