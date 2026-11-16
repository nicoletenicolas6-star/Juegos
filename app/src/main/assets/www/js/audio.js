/* Reino Cubano — Audio: música procedural (son cubano / mariachi) + efectos */
(function () {
  "use strict";

  var AC = null;
  var audioBroken = false;
  var musicGain = null;
  var sfxGain = null;
  var musicTimer = null;
  var step = 0;
  var currentSong = null;
  var settings = { music: 0.6, sfx: 0.8 };

  function ctx() {
    if (audioBroken) return null;
    if (!AC) {
      try {
        var Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) { audioBroken = true; return null; }
        AC = new Ctor();
        musicGain = AC.createGain();
        sfxGain = AC.createGain();
        musicGain.connect(AC.destination);
        sfxGain.connect(AC.destination);
        applyVolumes();
      } catch (e) {
        audioBroken = true;
        AC = null;
        return null;
      }
    }
    try {
      if (AC.state === "suspended") AC.resume();
    } catch (e) {}
    return AC;
  }

  function applyVolumes() {
    if (musicGain) musicGain.gain.value = settings.music * 0.5;
    if (sfxGain) sfxGain.gain.value = settings.sfx * 0.9;
  }

  function setVolumes(music, sfx) {
    settings.music = music;
    settings.sfx = sfx;
    applyVolumes();
  }

  /* ---------- SFX ---------- */
  function tone(freq, dur, type, vol, when, slide) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, when, filterFreq) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + (when || 0);
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filterFreq || 1200;
    var g = c.createGain();
    g.gain.value = vol || 0.4;
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t);
  }

  var SFX = {
    pop: function () { tone(420, 0.09, "sine", 0.35, 0, 1.8); },
    swap: function () { tone(300, 0.06, "triangle", 0.2, 0, 1.4); },
    bad: function () { tone(180, 0.15, "sawtooth", 0.18, 0, 0.7); },
    match: function (n) {
      var base = 440 * Math.pow(1.12, Math.min(n || 0, 8));
      tone(base, 0.12, "triangle", 0.3);
      tone(base * 1.25, 0.14, "triangle", 0.25, 0.05);
    },
    rocket: function () { noise(0.3, 0.4, 0, 3000); tone(900, 0.25, "sawtooth", 0.2, 0, 0.3); },
    tnt: function () { noise(0.5, 0.8, 0, 900); tone(70, 0.4, "sine", 0.6, 0, 0.5); },
    ball: function () {
      for (var i = 0; i < 6; i++) tone(500 + i * 150, 0.18, "sine", 0.2, i * 0.05);
    },
    prop: function () { tone(600, 0.3, "sawtooth", 0.15, 0, 2.2); },
    hammer: function () { noise(0.15, 0.8, 0, 600); tone(90, 0.2, "sine", 0.5, 0.02, 0.6); },
    arrow: function () { noise(0.2, 0.4, 0, 4000); tone(1200, 0.15, "sine", 0.2, 0, 0.4); },
    cannon: function () { noise(0.35, 0.7, 0, 700); tone(120, 0.3, "square", 0.3, 0, 0.4); },
    hat: function () { tone(300, 0.4, "triangle", 0.2, 0, 3); tone(600, 0.4, "triangle", 0.15, 0.1, 3); },
    coin: function () { tone(988, 0.07, "square", 0.2); tone(1319, 0.18, "square", 0.2, 0.07); },
    star: function (i) { tone(660 + i * 220, 0.25, "triangle", 0.35, i * 0.25); },
    lose: function () { tone(300, 0.4, "sawtooth", 0.25, 0, 0.5); tone(200, 0.6, "sawtooth", 0.25, 0.25, 0.5); },
    win: function () {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) tone(notes[i], 0.22, "triangle", 0.35, i * 0.13);
      tone(1319, 0.5, "triangle", 0.35, 0.55);
    }
  };

  function sfx(name, arg) {
    if (settings.sfx <= 0) return;
    if (SFX[name]) SFX[name](arg);
  }

  /* ---------- Instrument voices ---------- */
  function pluck(freq, when, dur, vol) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + when;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function bass(freq, when, dur) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + when;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function shaker(when, vol) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + when;
    var len = Math.floor(c.sampleRate * 0.05);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var src = c.createBufferSource();
    src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 6000;
    var g = c.createGain();
    g.gain.value = vol || 0.12;
    src.connect(f); f.connect(g); g.connect(musicGain);
    src.start(t);
  }

  function conga(freq, when) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + when;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.12);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + 0.2);
  }

  function trumpet(freq, when, dur) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime + when;
    var o = c.createOscillator();
    var g = c.createGain();
    var v = c.createOscillator();
    var vg = c.createGain();
    o.type = "sawtooth";
    o.frequency.value = freq;
    v.frequency.value = 5.5;
    vg.gain.value = freq * 0.012;
    v.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.04);
    g.gain.setValueAtTime(0.16, t + dur - 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    var f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 2400;
    o.connect(f); f.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.05);
    v.start(t); v.stop(t + dur + 0.05);
  }

  /* ---------- Songs ---------- */
  var N = { C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6, G3: 196, A3: 220, B3: 246.9,
            C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
            C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880 };

  /* Son cubano: clave 3-2 + tumbao + montuno, 16 pasos por compás */
  var sonClave = [0, 3, 6, 10, 12];
  var sonMontuno = [
    [N.C4, N.E4, N.G4], [N.E4, N.G4, N.C5], [N.F4, N.A4, N.C5], [N.G4, N.B4, N.D5],
    [N.C4, N.E4, N.G4], [N.E4, N.G4, N.C5], [N.F4, N.A4, N.C5], [N.G4, N.C5, N.E5]
  ];
  var sonBass = [N.C3, null, N.G3, null, N.C3, null, N.G2 || 98, null,
                 N.F3, null, N.C3, null, N.G3, null, N.C3, null];

  function playSonStep(s, bar) {
    var w = 0;
    if (sonClave.indexOf(s % 16) >= 0) { toneWood(s); }
    if (s % 2 === 0) shaker(w, 0.1);
    if (s % 4 === 0) conga(s % 8 === 0 ? 180 : 140, w);
    var b = sonBass[s % 16];
    if (b) bass(b, w, 0.28);
    if (s % 2 === 0) {
      var chord = sonMontuno[(bar * 2 + s / 2) % sonMontuno.length];
      for (var i = 0; i < chord.length; i++) pluck(chord[i], w + i * 0.03, 0.22, 0.1);
    }
  }

  function toneWood(s) {
    var c = ctx();
    if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "square";
    o.frequency.value = 2500;
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    var f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2000;
    o.connect(f); f.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + 0.06);
  }

  /* Mariachi/ranchera: vals 3/4 con trompeta */
  var mexMelody = [
    [N.G4, N.A4, N.B4], [N.C5, N.B4, N.A4], [N.G4, N.E4, N.G4], [N.A4, null, null],
    [N.F4, N.G4, N.A4], [N.B4, N.A4, N.G4], [N.E4, N.C4, N.E4], [N.G4, null, null],
    [N.C5, N.D5, N.E5], [N.E5, N.D5, N.C5], [N.B4, N.C5, N.D5], [N.C5, null, null],
    [N.A4, N.B4, N.C5], [N.D5, N.C5, N.B4], [N.A4, N.G4, N.E4], [N.C4, null, null]
  ];
  var mexChords = [[N.C4, N.E4], [N.G3, N.B3], [N.F3, N.A3], [N.G3, N.B3]];

  function playMexStep(s, bar) {
    var inBar = s % 6;
    var w = 0;
    if (inBar === 0) bass(N.C3 / 2, w, 0.3);
    if (inBar === 2 || inBar === 4) {
      var ch = mexChords[Math.floor(s / 6) % mexChords.length];
      pluck(ch[0], w, 0.18, 0.09);
      pluck(ch[1], w, 0.18, 0.09);
      shaker(w, 0.08);
    }
    var mel = mexMelody[Math.floor(s / 6) % mexMelody.length];
    var note = mel[inBar];
    if (note) trumpet(note, w, 0.28);
  }

  /* ---------- Sequencer ---------- */
  function startMusic(song) {
    stopMusic();
    if (!ctx()) return;
    currentSong = song;
    step = 0;
    var stepDur = song === "cubana" ? 0.125 : 0.15;
    var player = song === "cubana" ? playSonStep : playMexStep;
    var bar = 0;
    musicTimer = setInterval(function () {
      if (settings.music <= 0) return;
      try { player(step, bar); } catch (e) {}
      step++;
      if (song === "cubana" && step % 16 === 0) bar++;
      if (song === "cubana" && step % 64 === 0) bar = 0;
      if (song === "mexicana" && step % 96 === 0) bar = 0;
    }, stepDur * 1000);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function setSong(song) {
    if (currentSong !== song) startMusic(song);
  }

  window.RCAudio = {
    sfx: sfx,
    startMusic: startMusic,
    stopMusic: stopMusic,
    setSong: setSong,
    setVolumes: setVolumes,
    unlock: ctx
  };
})();
