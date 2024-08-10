class Mover {
  constructor(x, y, o) {
    console.log("Create new mover: ", x, y, o);

    this.x = x;
    this.y = y;
    this.o = o;
    this.positioning = false;
    this.orienting = false;
    this.currentNote = notes[0];
  }

  update(x, y, o, ts) {
    this.x = x;
    this.y = y;
    this.o = o;
    this.ts = ts;
  }

  run() {

    this.display();
    this.position();
    this.orient();

    if (this.currentNote.inPosition(this.x, this.y, this.o)) this.currentNote.play();
    else this.currentNote.stop();

  }

  display() {

    // Draw mover and heading
    push();
    translate(this.x, this.y);
    fill('black');
    ellipse(0, 0, 10, 10);
    rotate(this.o);
    strokeWeight(1);
    line(0, 0, RAD, 0);
    pop();
  }

  position() {
    if (mouseIsPressed) {
      if (dist(this.x, this.y, mouseX, mouseY) < 5) this.positioning = true;
      if (this.positioning) {
        this.x = mouseX;
        this.y = mouseY;
      }
    }
    else this.positioning = false;
  }

  orient() {
    let x = RAD * cos(this.o) + this.x;
    let y = RAD * sin(this.o) + this.y;
    ellipse(x, y, 5, 5);
    if (mouseIsPressed) {
      if (dist(x, y, mouseX, mouseY) < 5) this.orienting = true;
      if (this.orienting) this.o = createVector(mouseX - this.x, mouseY - this.y).heading();
    }
    else this.orienting = false;
  }


}
