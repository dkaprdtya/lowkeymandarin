// Lowkey Mandarin — speech and tone synthesis
// Speech uses the browser's zh-CN voice. Tone contours are synthesised with
// WebAudio so the pitch line the learner sees is the pitch line they hear.

let ctx = null;
let voices = [];
let activeTone = null;

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices();
}
if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

export function hasSpeech() {
  return "speechSynthesis" in window;
}

export function pickVoice() {
  if (!voices.length) loadVoices();
  const chinese = voices.filter((v) => /zh[-_]?cn|cmn|chinese/i.test(`${v.lang} ${v.name}`));
  return chinese.find((v) => /xiaoxiao|tingting|huihui|yaoyao|female|natural/i.test(v.name))
    || chinese[0]
    || null;
}

export function speak(text, options = {}) {
  const { rate = 0.86, pitch = 1, onStart, onEnd } = options;
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  utterance.pitch = pitch;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function audioContext() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function contourFrequencies(contour) {
  const points = contour.length > 2 ? contour : [contour[0], contour[0], contour[0], contour[0]];
  const dense = [];
  const steps = 42;
  for (let i = 0; i < steps; i += 1) {
    const pos = (i / (steps - 1)) * (points.length - 1);
    const low = Math.floor(pos);
    const high = Math.min(points.length - 1, low + 1);
    const t = pos - low;
    const value = points[low] * (1 - t) + points[high] * t;
    dense.push(value);
  }
  // 5 levels mapped to a speaking range, 140 Hz to 320 Hz.
  return dense.map((v) => 140 * Math.pow(2, (v - 1) / 2.2));
}

export function playTone(contour = [3, 3, 4, 5], options = {}) {
  const { duration = 1.15, onFrame, onEnd } = options;
  const audio = audioContext();
  if (!audio) { onEnd?.(); return null; }
  stopTone();

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const analyser = audio.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.7;

  oscillator.type = "sawtooth";
  const frequencies = contourFrequencies(contour);
  const start = audio.currentTime + 0.04;
  oscillator.frequency.setValueCurveAtTime(Float32Array.from(frequencies), start, duration);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.13, start + 0.06);
  gain.gain.setValueAtTime(0.13, start + duration - 0.14);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(analyser);
  analyser.connect(audio.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);

  let raf = null;
  const data = new Uint8Array(analyser.fftSize);
  const tick = () => {
    if (onFrame) {
      analyser.getByteTimeDomainData(data);
      onFrame(data, analyser);
    }
    raf = requestAnimationFrame(tick);
  };
  if (onFrame) tick();

  const finish = () => {
    if (raf) cancelAnimationFrame(raf);
    onEnd?.();
    activeTone = null;
  };
  oscillator.onended = finish;
  activeTone = { oscillator, stop: () => { try { oscillator.stop(); } catch (_e) { /* already stopped */ } } };
  return activeTone;
}

export function stopTone() {
  if (activeTone) {
    try { activeTone.stop(); } catch (_e) { /* noop */ }
    activeTone = null;
  }
}

export function toneContourPath(contour, width = 100, height = 50, pad = 6) {
  const points = contour && contour.length ? contour : [1, 1, 1, 1];
  const stepX = (width - pad * 2) / (points.length - 1);
  return points.map((value, index) => {
    const x = pad + index * stepX;
    const y = height - pad - ((value - 1) / 4) * (height - pad * 2);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

export function drawWave(canvas, data, color = "#151515") {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  if (canvas.width !== Math.floor(rect.width * dpr)) {
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  }
  const g = canvas.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, rect.width, rect.height);
  g.strokeStyle = color;
  g.lineWidth = 1.25;
  g.beginPath();
  const mid = rect.height / 2;
  const step = Math.max(1, Math.floor(data.length / rect.width));
  for (let i = 0; i < data.length; i += step) {
    const x = (i / data.length) * rect.width;
    const y = mid + ((data[i] - 128) / 128) * (rect.height * 0.42);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}

export function marqueeWave(canvas, onFrame) {
  // idle waveform for cards that are not playing
  const audio = audioContext();
  if (!audio) return () => {};
  const analyser = audio.createAnalyser();
  analyser.fftSize = 256;
  const data = new Uint8Array(analyser.fftSize);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = 128 + Math.sin(i * 0.32) * Math.sin(i * 0.07) * 26;
  }
  onFrame?.(data, analyser);
  return () => {};
}
