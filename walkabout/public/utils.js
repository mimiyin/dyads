// Base frequency
const BASE = 200;

// Ratios for diatonic scale
const RATIOS = {
  'do': {
    num: 1,
    den: 1
  },
  're': {
    num: 9,
    den: 8
  },
  'mi': {
    num: 5,
    den: 4
  },
  'fa': {
    num: 4,
    den: 3
  },
  'so': {
    num: 3,
    den: 2
  },
  'la': {
    num: 5,
    den: 3
  },
  'ti': {
    num: 15,
    den: 8
  },
  'do2': {
    num: 2,
    den: 1
  }
}

function calc(id, data) {

  // Look up the moverId for this tag
  let m = tags2MoversLookup[id];

  // Track number of tags for this pair
  let pcount = 0;
  // Get the mover's pair of tags
  let pair = moverTagPairs[m];
  let left, right;
  // Store the data
  pair[id] = data;
  // For every tagId in pair
  for (t in pair) {
    let tag = pair[t];
    // If there is data for this tag
    if (tag) {
      if (pcount == 0) left = tag;
      else right = tag;
    }
    pcount++;
  }

  // If it's a pair
  if (left && right) {

    let ox = (right.x - left.x);
    let oy = (right.y - left.y);

    let x = (left.x + right.x) / 2;
    let y = (left.y + right.y) / 2;

    let o = createVector(ox, oy).heading() + PI / 2;

    // Create new mover
    let mover = movers[m];

    if (mover) mover.update(x, y, o, Date.now())
    else new Mover(m, x, y, o, Date.now());

    movers[m] = mover;
  }
}

function noteToRate(n) {
  let ratio = RATIOS[n];
  return ( ratio.num/ratio.den );
}

function noteToFrequency(n) {
  let r = noteToRate(n);
  return r * BASE;
}

function noteToOrientation(n) {
  let r = noteToRate(n);
  return map(r, 1, 2, 0, TWO_PI);
}

function orientationToRate(o) {
  // Map pitch
  let r = map(o, -PI, PI, 1, 2);

  // Snap to closest diatonic note
  let closest = 10;
  let nr = r;
  for (let n in RATIOS) {
    let ratio = RATIOS[n];
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

function orientationToFrequency(o){
  let r = orientationToRate(o);
  console.log("Nearest rate: " + r);
  return  r * BASE;
}
