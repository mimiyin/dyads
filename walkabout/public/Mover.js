class Mover {
  constructor(id, x, y, o) {
    console.log("Create new mover: ", x, y, o);
    this.id = id;
    this.x;
    this.y;
    this.o;
    this.ox;
    this.oy;

    this.update(x, y, o);

    this.positioning = false;
    this.orienting = false;

    // Assign note
    this.n = -1;
    this.notes = notes[this.id];
    this.note = null;
    this.next();

    // Assign click
    this.click = loadSound('click.wav');

    // Track status
    this.timer = 0;
  }

  update(x, y, o, ts) {
    this.x = x;
    this.y = y;
    this.o = o;
    this.ox = RAD * cos(this.o) + this.x;
    this.oy = RAD * sin(this.o) + this.y;

  }

  move(x, y) {
    this.position(x, y);
    this.orient(x, y);
    this.update();
  }

  next() {
    this.n++;
    this.note = this.notes[this.n];

    //Play the click sound
    this.click.play();
  }

  run() {

    this.display();

    if (this.note.inPosition(this.x, this.y, this.o)) this.note.play();
    else this.note.stop();

    // If note is done
    return this.timer > this.note.t;
  }

  display() {

    // Draw mover and heading
    push();
    translate(this.x, this.y);
    fill('black');
    textSize(14)
    textAlign(CENTER, BOTTOM);
    text(this.id, 0, -10);
    ellipse(0, 0, 10, 10);
    rotate(this.o);
    strokeWeight(1);
    line(0, 0, RAD, 0);
    ellipse(RAD, 0, 5, 5);
    pop();
  }

  position() {
    if (dist(this.x, this.y, mouseX, mouseY) < 5) this.positioning = true;
    if (this.positioning) {
      this.x = mouseX;
      this.y = mouseY;
    }
  }

  orient(x, y) {
    if (dist(this.ox, this.oy, x, y) < 5) this.orienting = true;
    if (this.orienting) this.o = createVector(x - this.x, y - this.y).heading();
  }

  release() {
    this.positioning = false;
    this.orienting = false;
  }
}
