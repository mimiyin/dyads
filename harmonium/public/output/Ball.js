class Ball {
  constructor(x, y, w, h, xspeed, yspeed, lifespan) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.xspeed = xspeed;
    this.yspeed = yspeed;
    this.lifespan = lifespan;
    this.tx = random(50, 150);
    this.ty = random(500, 600);
    this.counter = 0;
  }

  run() {
    if(noise(this.tx) < 0.9) this.noise();
    this.update();
    this.display();
  }

  died() {
    return this.counter > this.lifespan;
  }

  //Update function
  update() {
    this.x += this.xspeed;
    this.y += this.yspeed;
    this.xspeed = bounce(this.x, this.xspeed, 0, width);
    this.yspeed = bounce(this.y, this.yspeed, 0, height);
    this.tx += 0.01;
    this.ty += 0.01;
    this.counter++;
  }

  noise() {
    //this.xspeed = noise(this.tx)-0.5;
    this.yspeed = noise(this.ty)-0.5;

  }

  // Display function
  display() {
    fill(100, 100, 100, this.counter);
    noStroke();
    ellipse(this.x, this.y, this.w, this.h);
  }
}

//Bounce function
function bounce(position, speed, min, max) {
  if (position < min || position > max) {
    speed *= -1;
  }

  return speed;
}
