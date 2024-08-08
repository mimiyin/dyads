class Note {
  constructor(x, y, o, b) {
    this.x = x;
    this.y = y;
    this.o = o;
    this.r = this.mapRate(o);
    this.pr = this.r;
    this.f = this.r * base * b;
    this.osc = new p5.Oscillator("sine", this.f);
    this.osc.amp(0, 0);
    this.osc.start();
    this.isActive = false;
  }

  isInside(x, y) {
    console.log(this.x, this.y, x, y);
    return dist(this.x, this.y, x, y) < RAD;
  }

  isOriented(o) {
    console.log(this.o, o);
    return abs(this.o - o) < 1;
  }

  inPosition(x, y, o) {
    return this.isInside(x, y) && this.isOriented(o);
  }

  play() {
    // create Oscillator node
    if(this.isActive) return;
    this.osc.amp(1, 2);
    this.isActive = true;
  }

  stop() {
    this.isActive = false;
    this.osc.amp(0, 5);
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(255);
    ellipse(0, 0, RAD);
    rotate(this.o);
    line(0, 0, 10, 10);
    ellipse(10, 10, 10);
    pop();

  }

  mapRate(o) {
    // Map pitch
    let r = map(o, 0, 360, 1, 2);

    // Snap to closest diatonic note
    let closest = 10;
    let nr = r;
    for (let ratio of ratios) {
      let _r = ratio.num / ratio.den;
      let dr = abs(r - _r);
      if (dr < closest) {
        nr = _r;
        closest = dr;
      }
    }
    // Snap to closest r
    return nr;
  }
}
