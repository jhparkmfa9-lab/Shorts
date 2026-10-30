// 30s funny bouncy "shorts" track, synthesized from scratch -> music.wav
// 120 BPM, C major, oom-pah bass + pizzicato + kazoo lead + boings/slide whistles.
const fs = require("fs");
const SR = 44100, DUR = 30, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const BEAT = 0.5, S16 = BEAT / 4, DROP = 3;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(t0, buf, pan = 0, gain = 1) {
  const s0 = Math.floor(t0 * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length; i++) {
    const j = s0 + i;
    if (j < 0 || j >= N) continue;
    L[j] += buf[i] * gl; R[j] += buf[i] * gr;
  }
}
function biquadBP(buf, f, q) {
  const w = 2 * Math.PI * f / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
  const b0 = a, b2 = -a, a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  const out = new Float32Array(buf.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; out[i] = y;
  }
  return out;
}

// --- instruments ---
const kick = () => { const n = SR * 0.35, b = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (50 + 110 * Math.exp(-t * 30)) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t * 9) * 0.9; } return b; };
const clap = () => { const n = SR * 0.22, raw = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; const env = t < 0.03 ? (Math.sin(t * 600) > 0 ? 1 : 0.4) : Math.exp(-(t - 0.03) * 22);
    raw[i] = rnd() * env; } const b = biquadBP(raw, 1500, 0.8); for (let i = 0; i < n; i++) b[i] *= 1.6; return b; };
const hat = () => { const n = SR * 0.05, raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = rnd() * Math.exp(-i / SR * 70); return biquadBP(raw, 8000, 1.2); };
const bass = (m, len) => { const n = Math.floor(SR * len), b = new Float32Array(n), f = mtof(m);
  for (let i = 0; i < n; i++) { const t = i / SR, p = 2 * Math.PI * f * t;
    b[i] = (Math.sin(p) + 0.35 * Math.sin(2 * p) + 0.15 * Math.sin(3 * p)) * Math.exp(-t * 7) * Math.min(1, t * 400) * 0.55; } return b; };
const pluck = (m, len = 0.3) => { // Karplus-Strong pizzicato/ukulele
  const n = Math.floor(SR * len), b = new Float32Array(n), p = Math.round(SR / mtof(m)), d = new Float32Array(p);
  for (let i = 0; i < p; i++) d[i] = rnd();
  for (let i = 0; i < n; i++) { const k = i % p, nx = (k + 1) % p; const v = d[k]; d[k] = 0.5 * (d[k] + d[nx]) * 0.993; b[i] = v * 0.35; }
  return b; };
const kazoo = (m, len) => { const n = Math.floor(SR * len), raw = new Float32Array(n), f = mtof(m); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; const vib = 1 + 0.012 * Math.sin(2 * Math.PI * 6 * t) * Math.min(1, t * 6);
    const scoop = 1 - 0.06 * Math.exp(-t * 40); ph += f * vib * scoop / SR; ph -= Math.floor(ph);
    const env = Math.min(1, t * 80) * Math.min(1, (len - t) * 40);
    raw[i] = (2 * ph - 1 + rnd() * 0.08) * env; }
  const a = biquadBP(raw, 700, 3), c = biquadBP(raw, 1500, 4), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = (a[i] + c[i] * 0.8 + raw[i] * 0.15) * 1.4; out[i] = Math.tanh(v * 1.5) * 0.32; }
  return out; };
const whistle = (m, len) => { const n = Math.floor(SR * len), b = new Float32Array(n), f = mtof(m); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * f * (1 + 0.015 * Math.sin(2 * Math.PI * 5.5 * t)) / SR;
    b[i] = (Math.sin(ph) + rnd() * 0.03) * Math.min(1, t * 60) * Math.min(1, (len - t) * 30) * 0.28; } return b; };
const slide = (f0, f1, len) => { const n = Math.floor(SR * len), b = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, k = t / len; ph += 2 * Math.PI * f0 * Math.pow(f1 / f0, k * k) / SR;
    b[i] = Math.sin(ph) * Math.min(1, t * 30) * Math.min(1, (len - t) * 30) * 0.3; } return b; };
const boing = (len = 0.6) => { const n = Math.floor(SR * len), b = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; const f = 110 + 160 * (1 - t / len) + 45 * Math.sin(2 * Math.PI * 14 * t) * Math.exp(-t * 4);
    ph += 2 * Math.PI * f / SR; b[i] = Math.sin(ph) * Math.exp(-t * 3.5) * 0.6; } return b; };
const musicBox = (m) => { const n = SR * 1.2, b = new Float32Array(n), f = mtof(m);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 4.02 * t) * Math.exp(-t * 8)) * Math.exp(-t * 3) * 0.18; } return b; };
const crash = () => { const n = SR * 1.2, raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = rnd() * Math.exp(-i / SR * 3.5); return biquadBP(raw, 6000, 0.6); };
const scratch = () => { const n = SR * 0.25, raw = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; raw[i] = rnd() * Math.sin(Math.PI * t / 0.25); }
  const b = biquadBP(raw, 900, 2); return b; };

// --- intro (quiet October) ---
[[0.2, 76], [0.95, 79], [1.7, 84], [2.2, 83]].forEach(([t, m]) => add(t, musicBox(m), 0.2));
add(2.45, slide(300, 1800, 0.5), -0.2, 0.9);
add(2.75, scratch(), 0, 0.8);

// --- main groove ---
const chords = [[48, [60, 64, 67]], [53, [60, 65, 69]], [55, [59, 62, 67]], [48, [60, 64, 67]]]; // C F G C
const mel = [ // [eighth index in 4-bar phrase, midi, eighths]
  [0, 67, 1], [2, 72, 1], [3, 72, 1], [5, 76, 1], [6, 74, 1], [7, 72, 1],
  [8, 69, 1], [10, 72, 1], [11, 77, 1], [13, 76, 1], [14, 74, 1], [15, 72, 1],
  [16, 71, 1], [18, 74, 1], [19, 79, 1], [21, 77, 1], [22, 76, 1], [23, 74, 1],
  [24, 72, 1], [25, 76, 1], [26, 79, 1], [27, 84, 3], [31, 79, 1]];
const END = 29.5;
for (let t = DROP; t < END - 0.01; t += BEAT) {
  const beat = Math.round((t - DROP) / BEAT), bar = Math.floor(beat / 4), inBar = beat % 4;
  const [root, ch] = chords[bar % 4];
  const build = t >= 28;
  add(t, kick(), 0, 1);
  if (inBar % 2 === 1 || build) add(t, clap(), 0.1, build ? 0.5 + (t - 28) * 0.4 : 0.8);
  add(t + BEAT / 2, hat(), 0.4, 0.5); add(t + BEAT / 4 * 3, hat(), 0.4, 0.25);
  if (!build) {
    add(t, bass(inBar % 2 === 0 ? root : root + 7 - (inBar === 3 ? 12 : 0), 0.4), 0, 1);       // oom
    ch.forEach((m, k) => add(t + BEAT / 2 + k * 0.006, pluck(m + 12, 0.25), -0.35 + k * 0.1, 0.9)); // pah
  }
}
// lead: kazoo 3-17s and 24-28s, whistle 17-24s
const phraseLen = 16 * BEAT;
for (let p0 = DROP + 4 * BEAT * 0; p0 < 28; p0 += phraseLen) {
  mel.forEach(([e, m, l]) => {
    const t = p0 + e * BEAT / 2; if (t >= 28 || t < DROP + 1) return;
    const len = l * BEAT / 2 * 0.85;
    if (t >= 17 && t < 24) add(t, whistle(m + 12, len), 0.15, 1); else add(t, kazoo(m, len), -0.05, 1);
  });
}
// accents
[10, 17, 24].forEach((t) => { add(t - 0.25, slide(400, 1400, 0.25), 0.3, 0.8); add(t, boing(), -0.3, 1); add(t, crash(), 0, 0.5); });
[6.5, 13.5, 20.5, 26].forEach((t) => add(t, boing(0.4), 0.4, 0.7));
add(DROP, crash(), 0, 0.7); add(DROP, boing(), 0, 0.8);
// build-up slide + final stab
add(28, slide(250, 2000, 1.4), 0, 0.8);
add(END, kick(), 0, 1.2); add(END, crash(), 0, 0.9);
[48, 60, 64, 67, 72, 76].forEach((m) => add(END, pluck(m, 0.5), 0, 1.3));
add(END, kazoo(72, 0.45), 0, 1.2);

// master: soft clip + fade
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.95 / Math.max(1, peak * 0.7);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.3));
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * g) * fade * 32000), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * g) * fade * 32000), 46 + i * 4);
}
fs.writeFileSync(__dirname + "/music.wav", buf);
console.log("music.wav written, peak", peak.toFixed(2));
