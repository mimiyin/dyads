class Mover {
  constructor(leftId, rightId) {
    this.tags = {};
    this.x;
    this.y;
    this.o;
    this.currentNote = notes[0];
    this.init = false;
  }

  update(id, x, y, ts) {

    this.tags[id] = {
      x: x,
      y: y,
      ts: ts
    };

    this.calc();
    this.display();
  }

  run() {
    if (!this.init) return;

    if (this.currentNote.inPosition(this.x, this.y, this.o)) {
      console.log("IN POSITION!");
      this.currentNote.play();
    }
    else this.currentNote.stop();
    this.display();
  }

  calc() {
    let pair = [];
    for (let t in this.tags) {
      let tag = this.tags[t];
      let x = tag.x;
      let y = tag.y;
      pair.push({
        x: x,
        y: y
      });
    }
    if (pair.length > 1) {
      stroke(0);
      line(pair[0].x, pair[0].y, pair[1].x, pair[1].y)

      let ox = (pair[1].x - pair[0].x);
      let oy = (pair[1].y - pair[0].y);

      this.x = (pair[0].x + pair[1].x) / 2;
      this.y = (pair[0].y + pair[1].y) / 2;

      this.o = createVector(ox, oy).heading();
      //o+=PI/2;
      //this.o -= PI;

      // Initialize mover
      this.init = true;
    }
  }

  display() {
    // Draw tags
    for (let t in this.tags) {
      let tag = this.tags[t];
      let x = tag.x;
      let y = tag.y;
      stroke('black');
      fill(t == 0 ? 'darkgray' : 'gray');
      ellipse(x, y, 5, 5);
    }

    if(!this.init) return;

    // Draw mover and heading
    fill('black');
    ellipse(this.x, this.y, 10, 10);

    push();
    translate(this.x, this.y);
    rotate(this.o + PI/2);
    strokeWeight(3);
    line(0, 0, 30, 0);
    pop();

  }


}
