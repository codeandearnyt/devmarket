/**
 * Hand-authored Lottie animation for DevMarket loaders.
 * Brand-matched "Code Orbit" spinner: counter-rotating arcs, orbiting dots,
 * pulsing core glow. Pure vector, ~2 KB, no external asset fetch.
 */

const LIME = [0.78, 0.969, 0.427, 1]; // #c7f76d
const TEAL = [0.075, 0.722, 0.69, 1]; // #13b8b0
const SKY = [0.639, 0.878, 0.902, 1]; // #a3e0e6

const LINEAR = {
  i: { x: [0.833, 0.833, 0.833], y: [0.833, 0.833, 0.833] },
  o: { x: [0.167, 0.167, 0.167], y: [0.167, 0.167, 0.167] },
};

const EASE_OUT = {
  i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] },
  o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] },
};

/** Static property helper */
const val = (k: unknown, ix: number) => ({ a: 0, k, ix });

/** Full 0 -> 360 spin over the whole comp */
const spin = (frames: number) => ({
  a: 1,
  k: [
    { t: 0, s: [0, 0, 0], h: 0, ...LINEAR },
    { t: frames, s: [360, 360, 360] },
  ],
  ix: 10,
});

/** Reverse (counter-clockwise) spin */
const spinReverse = (frames: number) => ({
  a: 1,
  k: [
    { t: 0, s: [360, 360, 360], h: 0, ...LINEAR },
    { t: frames, s: [0, 0, 0] },
  ],
  ix: 10,
});

/** Gentle 0 -> 100 -> 0 breathing pulse */
const breathe = (frames: number, from: number, to: number) => ({
  a: 1,
  k: [
    { t: 0, s: [from, from, from], h: 0, ...EASE_OUT },
    { t: Math.round(frames / 2), s: [to, to, to] },
    { t: frames, s: [from, from, from] },
  ],
  ix: 6,
});

const opacityPulse = (frames: number, from: number, to: number) => ({
  a: 1,
  k: [
    { t: 0, s: [from], h: 0, ...EASE_OUT },
    { t: Math.round(frames / 2), s: [to] },
    { t: frames, s: [from] },
  ],
  ix: 11,
});

const OP = 180;
const CENTER: [number, number, number] = [120, 120, 0];

/** Transform block shared by every shape layer. */
const transform = (extra: Record<string, unknown> = {}) => ({
  o: val(100, 11),
  r: val(0, 10),
  p: val(CENTER, 2),
  a: val([0, 0, 0], 1),
  s: val([100, 100, 100], 6),
  ...extra,
});

const ellipse = (size: number) => ({
  ty: "el" as const,
  d: 1,
  s: val([size, size], 2),
  p: val([0, 0], 3),
  nm: "Ellipse Path",
});

const fill = (color: number[]) => ({
  ty: "fl" as const,
  c: val(color, 3),
  o: val(100, 4),
  r: 1,
  bm: 0,
  nm: "Fill",
});

const stroke = (color: number[], width: number, opacity = 100) => ({
  ty: "st" as const,
  c: val(color, 3),
  o: val(opacity, 4),
  w: val(width, 5),
  lc: 2,
  lj: 1,
  ml: 4,
  bm: 0,
  nm: "Stroke",
});

const trim = (start: number, end: number, offset = 0) => ({
  ty: "tm" as const,
  s: val(start, 1),
  e: val(end, 2),
  o: val(offset, 3),
  m: 1,
  ix: 4,
  nm: "Trim Paths",
});

const groupTransform = () => ({
  ty: "tr" as const,
  p: val([0, 0], 2),
  a: val([0, 0], 1),
  s: val([100, 100], 3),
  r: val(0, 6),
  o: val(100, 7),
  sk: val(0, 4),
  sa: val(0, 5),
  nm: "Transform",
});

/**
 * One orbiting dot. The dot sits at a fixed local offset inside the layer,
 * and the layer's animated rotation sweeps it around the composition centre.
 */
function orbitLayer(index: number, x: number, y: number, color: number[], size: number) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: `Orbit Dot ${index}`,
    sr: 1,
    ks: transform({ r: spin(OP) }),
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "el",
            d: 1,
            s: val([size, size], 2),
            p: val([x, y], 3),
            nm: "Ellipse Path",
          },
          fill(color),
          groupTransform(),
        ],
        nm: "Dot",
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

function arcLayer(
  index: number,
  size: number,
  width: number,
  color: number[],
  end: number,
  reverse: boolean,
) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: `Arc ${index}`,
    sr: 1,
    ks: transform({ r: reverse ? spinReverse(OP) : spin(OP) }),
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [ellipse(size), stroke(color, width), trim(0, end), groupTransform()],
        nm: "Arc",
        np: 3,
        cix: 2,
        bm: 0,
        ix: 1,
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

function ringLayer(index: number, size: number, width: number, color: number[], opacity: number) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: `Ring ${index}`,
    sr: 1,
    ks: transform({ o: val(opacity, 11) }),
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [ellipse(size), stroke(color, width), trim(0, 100), groupTransform()],
        nm: "Ring",
        np: 3,
        cix: 2,
        bm: 0,
        ix: 1,
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

function glowLayer(index: number) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: "Core Glow",
    sr: 1,
    ks: transform({
      o: opacityPulse(OP, 35, 95),
      s: breathe(OP, 82, 124),
    }),
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [ellipse(46), fill(LIME), groupTransform()],
        nm: "Glow",
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

/** Three dots at 120 degrees apart on a 96px radius; layer rotation does the orbiting. */
const RADIUS = 96;
const DOT_SIZE = 15;

export const loaderAnimation = {
  v: "5.9.6",
  fr: 60,
  ip: 0,
  op: OP,
  w: 240,
  h: 240,
  nm: "DevMarket Code Orbit Loader",
  ddd: 0,
  assets: [],
  layers: [
    orbitLayer(1, 0, -RADIUS, LIME, DOT_SIZE),
    orbitLayer(2, RADIUS * 0.866, RADIUS * 0.5, TEAL, DOT_SIZE),
    orbitLayer(3, -RADIUS * 0.866, RADIUS * 0.5, SKY, DOT_SIZE),
    arcLayer(4, 196, 7, LIME, 24, false),
    arcLayer(5, 156, 5, TEAL, 18, true),
    glowLayer(6),
    ringLayer(7, 196, 3, TEAL, 22),
    ringLayer(8, 156, 3, SKY, 18),
  ],
};

export default loaderAnimation;