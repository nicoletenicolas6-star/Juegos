/* Reino Cubano — Flujo principal, economía, guardado y pantallas */
(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (window.RCBoard) RCBoard.layout();
  }
  window.addEventListener("resize", resize);
  resize();

  /* ---------- Guardado ---------- */
  var DEF_SAVE = {
    name: "", age: 0, gender: "m", role: "Rey", onboarded: false,
    coins: 200, stars: 0, level: 1, lives: 5, livesTs: Date.now(),
    boosters: { hammer: 1, arrow: 0, cannon: 0, hat: 0 },
    streak: 0, dailyLast: "", dailyDay: 0,
    custom: { body: "normal", hair: "hair", beard: "beard", cloth: "#e63946" },
    settings: { music: 0.6, sfx: 0.8, vib: true },
    renovated: [], tutorials: [], country: "cuba",
    levelStars: {}, dev: false
  };
  var S = load();

  function load() {
    try {
      var raw = localStorage.getItem("reino_cubano_save");
      if (raw) {
        var d = JSON.parse(raw);
        var out = JSON.parse(JSON.stringify(DEF_SAVE));
        for (var k in d) {
          if (typeof d[k] === "object" && d[k] !== null && !Array.isArray(d[k]) && typeof out[k] === "object") {
            for (var k2 in d[k]) out[k][k2] = d[k][k2];
          } else out[k] = d[k];
        }
        return out;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEF_SAVE));
  }
  function save() {
    try { localStorage.setItem("reino_cubano_save", JSON.stringify(S)); } catch (e) {}
  }

  /* ---------- Utilidades UI ---------- */
  function $(id) { return document.getElementById(id); }
  function show(id) { $(id).classList.remove("hidden"); }
  function hide(id) { $(id).classList.add("hidden"); }

  var screens = ["screen-splash", "screen-onboard", "screen-home", "screen-intro",
    "screen-game", "screen-pause", "screen-result", "screen-shop", "screen-daily",
    "screen-settings", "screen-travel", "screen-renov"];
  var current = "screen-splash";
  function goto(id) {
    screens.forEach(function (s) { hide(s); });
    show(id);
    current = id;
  }

  function toast(msg) {
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2500);
  }

  function floatText(msg) {
    var el = document.createElement("div");
    el.className = "float-text";
    el.textContent = msg;
    el.style.left = (W / 2 - 60) + "px";
    el.style.top = (H * 0.35) + "px";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }

  function vibrate(ms) {
    if (S.settings.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {}
  }

  function showError(e) {
    try { window.onerror(String(e && e.message || e), "main.js", 0, 0); } catch (x) {}
  }

  /* ---------- Vidas ---------- */
  var LIFE_MS = 10 * 60 * 1000;
  function tickLives() {
    if (S.dev) { S.lives = 5; return; }
    if (S.lives < 5) {
      var elapsed = Date.now() - S.livesTs;
      var gained = Math.floor(elapsed / LIFE_MS);
      if (gained > 0) {
        S.lives = Math.min(5, S.lives + gained);
        S.livesTs = Date.now();
        save();
      }
    } else S.livesTs = Date.now();
  }
  function loseLife() {
    if (S.dev) return;
    if (S.lives > 0) { S.lives--; S.livesTs = Date.now(); save(); }
  }

  /* ---------- Personaje ---------- */
  function charCustom() {
    var c = JSON.parse(JSON.stringify(S.custom));
    c.gender = S.gender;
    c.old = S.age >= 60;
    return c;
  }

  /* ---------- Música por país ---------- */
  function musicForCountry() {
    RCAudio.setSong(S.country === "mexico" ? "mexicana" : "cubana");
  }

  /* ================= SPLASH ================= */
  var splashCanvas = $("splash-king"), splashCtx = splashCanvas.getContext("2d");
  var started = false;

  function splashLoop(ts) {
    if (current !== "screen-splash") return;
    try {
      splashCtx.clearRect(0, 0, 220, 260);
      RCChar.draw(splashCtx, 110, 240, 200, charCustom(), "dance", ts);
    } catch (e) { showError(e); }
    requestAnimationFrame(splashLoop);
  }
  requestAnimationFrame(splashLoop);

  function enterGame() {
    if (started) return;
    started = true;
    try { RCAudio.unlock(); } catch (e) {}
    try { musicForCountry(); } catch (e) {}
    if (!S.onboarded) goto("screen-onboard");
    else goto("screen-home");
    try { updateHud(); } catch (e) {}
  }

  $("screen-splash").addEventListener("click", enterGame);
  $("screen-splash").addEventListener("touchend", function (e) {
    e.preventDefault();
    enterGame();
  }, { passive: false });
  $("screen-splash").addEventListener("touchstart", function (e) {
    e.preventDefault();
  }, { passive: false });

  /* ================= ONBOARDING ================= */
  var gender = "m";
  document.querySelectorAll(".gender-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".gender-btn").forEach(function (x) { x.classList.remove("selected"); });
      b.classList.add("selected");
      gender = b.getAttribute("data-g");
    });
  });

  $("btn-onboard-go").addEventListener("click", finishOnboard);
  $("btn-onboard-go").addEventListener("touchend", function (e) {
    e.preventDefault();
    finishOnboard();
  }, { passive: false });

  function finishOnboard() {
    var name = $("inp-name").value.trim();
    var age = parseInt($("inp-age").value, 10);
    if (!name) { toast("👑 Dinos tu nombre, majestad"); return; }
    if (!age || age < 3) { toast("🎂 Necesitamos tu edad"); return; }
    S.name = name; S.age = age; S.gender = gender;
    S.role = RCChar.roleFor(age, gender);
    S.onboarded = true;
    save();
    toast("👑 ¡" + S.role + " " + S.name + " de " + (S.country === "mexico" ? "México" : "Cuba") + "!");
    goto("screen-home");
    updateHud();
  }

  /* ================= HOME ================= */
  function updateHud() {
    $("hud-coins").textContent = S.coins;
    $("hud-stars").textContent = S.stars;
    var livesEl = $("hud-lives");
    livesEl.textContent = S.dev ? "♾️" : "❤️ " + S.lives;
    livesEl.classList.toggle("low", S.lives <= 1 && !S.dev);
    $("chip-avatar").textContent = S.gender === "f" ? "👸" : "🤴";
    $("country-badge").textContent = S.country === "mexico" ? "🇲🇽 MÉXICO" : "🇨🇺 CUBA";
    var zone = RCScenes.zoneFor(S.country, S.level);
    $("zone-name").textContent = S.name ? S.role + " " + S.name + " · " + zone.name : zone.name;
    $("btn-level-num").textContent = "Nivel " + S.level;
    $("btn-play").disabled = !S.dev && S.lives <= 0;
  }

  $("btn-play").addEventListener("click", function () {
    if (!S.dev && S.lives <= 0) { toast("💔 Sin vidas. Espera o visita la tienda"); return; }
    openIntro(RCLevels.genLevel(S.level));
  });

  $("btn-shop").addEventListener("click", function () { openShop(); });
  $("btn-daily").addEventListener("click", function () { openDaily(); });
  $("btn-settings").addEventListener("click", function () { openSettings(false); });
  $("btn-renov").addEventListener("click", function () { openRenov(); });
  $("btn-map").addEventListener("click", function () { openMap(); });

  /* ================= LEVEL INTRO ================= */
  var pendingLevel = null, pendingPre = null;

  function openIntro(level) {
    pendingLevel = level;
    pendingPre = null;
    $("intro-level").textContent = "Nivel " + level.num + " · " + RCScenes.zoneFor(S.country, level.num).name;
    var diffEl = $("intro-diff");
    if (level.diff === "hard") { diffEl.classList.remove("hidden", "super"); diffEl.textContent = "🔥 Difícil"; }
    else if (level.diff === "super") { diffEl.classList.remove("hidden"); diffEl.classList.add("super"); diffEl.textContent = "🌋 Súper Difícil"; }
    else diffEl.classList.add("hidden");

    if (level.bonus) {
      var bTitle = $("intro-level");
      bTitle.textContent = "🎁 NIVEL BONUS " + level.num;
    }

    var box = $("intro-missions");
    box.innerHTML = "";
    level.objectives.forEach(function (o) {
      var m = RCLevels.missionText(o);
      var row = document.createElement("div");
      row.className = "mission-row";
      row.innerHTML = '<span class="mi">' + m.icon + '</span><span>' + m.text + '</span>';
      box.appendChild(row);
    });

    /* Tutorial de potenciador nuevo */
    var newBooster = null;
    for (var key in RCLevels.BOOSTER_UNLOCK) {
      if (RCLevels.BOOSTER_UNLOCK[key] === level.num && S.tutorials.indexOf(key) < 0) newBooster = key;
    }
    var tut = $("intro-tutorial");
    if (newBooster) {
      tut.classList.remove("hidden");
      var info = RCLevels.BOOSTER_INFO[newBooster];
      $("tutorial-text").textContent = info.icon + " " + info.name + ": " + info.desc;
      runTutorialDemo(newBooster);
    } else tut.classList.add("hidden");

    /* Potenciadores pre-nivel */
    var pre = $("preboosters");
    if (level.num >= 4) {
      pre.classList.remove("hidden");
      document.querySelectorAll(".preb").forEach(function (b) {
        b.classList.remove("selected");
        b.disabled = S.coins < parseInt(b.querySelector("small").textContent, 10);
      });
    } else pre.classList.add("hidden");

    goto("screen-intro");
  }

  document.querySelectorAll(".preb").forEach(function (b) {
    b.addEventListener("click", function () {
      var cost = parseInt(b.querySelector("small").textContent, 10);
      if (b.classList.contains("selected")) {
        b.classList.remove("selected"); pendingPre = null; return;
      }
      if (S.coins < cost) { toast("🪙 Monedas insuficientes"); return; }
      document.querySelectorAll(".preb").forEach(function (x) { x.classList.remove("selected"); });
      b.classList.add("selected");
      pendingPre = { pu: b.getAttribute("data-pu"), cost: cost };
    });
  });

  $("btn-intro-back").addEventListener("click", function () { goto("screen-home"); });
  $("btn-intro-play").addEventListener("click", function () {
    if (pendingPre && S.coins >= pendingPre.cost) {
      S.coins -= pendingPre.cost;
      startLevel(pendingLevel, pendingPre.pu);
    } else startLevel(pendingLevel, null);
    pendingPre = null;
  });

  /* Demo animada del tutorial en un mini tablero */
  function runTutorialDemo(booster) {
    var tc = $("tutorial-canvas"), tctx = tc.getContext("2d");
    var frames = 0;
    function demoLoop() {
      if ($("intro-tutorial").classList.contains("hidden")) return;
      frames++;
      tctx.clearRect(0, 0, 280, 170);
      tctx.fillStyle = "rgba(20,26,60,0.9)";
      tctx.fillRect(0, 0, 280, 170);
      var cell = 44, ox = 30, oy = 30;
      for (var r = 0; r < 3; r++) for (var c = 0; c < 5; c++) {
        tctx.fillStyle = (r + c) % 2 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)";
        tctx.fillRect(ox + c * cell, oy + r * cell, cell - 3, cell - 3);
        tctx.font = "26px serif"; tctx.textAlign = "center";
        tctx.fillText(RCLevels.TILE_ICONS[(r * 5 + c) % 6], ox + c * cell + cell / 2, oy + r * cell + cell / 2 + 9);
      }
      var prog = (frames % 140) / 140;
      tctx.font = "34px serif";
      var icons = { hammer: "🔨", arrow: "🏹", cannon: "💥", hat: "🎩" };
      var icon = icons[booster] || "✨";
      if (booster === "hammer") {
        var hy = 20 + prog * 90;
        tctx.fillText(icon, ox + 2.5 * cell, hy);
        if (prog > 0.75) {
          tctx.font = "20px serif";
          for (var p = 0; p < 6; p++) {
            var ang = p * 1.05;
            tctx.fillText("✨", ox + 2.5 * cell + Math.cos(ang) * 30 * (prog - 0.75) * 4, oy + cell + Math.sin(ang) * 24 * (prog - 0.75) * 4);
          }
        }
      } else if (booster === "arrow") {
        var ax = prog * 300 - 20;
        tctx.fillText(icon, ax, oy + cell * 1.5);
        tctx.fillStyle = "rgba(79,210,255,0.5)";
        tctx.fillRect(0, oy + cell + 2, ax, cell - 8);
      } else if (booster === "cannon") {
        var ay = prog * 200 - 20;
        tctx.fillText(icon, ox + 2 * cell, ay);
        tctx.fillStyle = "rgba(255,154,60,0.5)";
        tctx.fillRect(ox + 2 * cell + 2, 0, cell - 8, ay);
      } else {
        tctx.save();
        tctx.translate(140, 85);
        tctx.rotate(prog * 12);
        tctx.fillText(icon, 0, 10);
        tctx.restore();
      }
      requestAnimationFrame(demoLoop);
    }
    demoLoop();
  }

  /* ================= JUEGO ================= */
  function startLevel(level, preBooster) {
    goto("screen-game");
    RCBoard.setState("game");
    RCBoard.start(level, preBooster || null, {
      onMoves: function (m) {
        $("hud-moves").textContent = m;
        var mb = document.querySelector(".moves-box");
        if (mb) mb.classList.toggle("danger", m <= 5);
      },
      onObjectives: function (objs) { renderObjectives(objs); },
      onObjective: function (kind, n, type) {
        var objs = RCBoard.objectives();
        for (var i = 0; i < objs.length; i++) {
          var o = objs[i];
          if (o.kind === kind && o.got < o.need) {
            if (kind === "collect" && type != null && o.type !== type) continue;
            o.got = Math.min(o.need, o.got + n);
          }
        }
        renderObjectives(objs);
      },
      onScore: function (score) {
        var objs = RCBoard.objectives();
        for (var i = 0; i < objs.length; i++) {
          if (objs[i].kind === "score") objs[i].got = Math.min(objs[i].need, score);
        }
        renderObjectives(objs);
      },
      onBoosterUsed: function (name) { S.boosters[name] = Math.max(0, (S.boosters[name] || 0) - 1); save(); renderBoosters(); },
      onWin: function (score) { setTimeout(function () { winLevel(level, score); }, 600); },
      onLose: function (score) { setTimeout(function () { loseLevel(level, score); }, 600); },
      floatText: floatText
    });
    renderBoosters();
    updateHud();
  }

  function renderObjectives(objs) {
    var box = $("objective-chips");
    box.innerHTML = "";
    objs.forEach(function (o) {
      var m = RCLevels.missionText(o);
      var chip = document.createElement("div");
      chip.className = "obj-chip" + (o.got >= o.need ? " done" : "");
      chip.innerHTML = '<span>' + m.icon + '</span><span>' + o.got + '/' + o.need + '</span>';
      box.appendChild(chip);
    });
  }

  function renderBoosters() {
    var unlockedAt = RCLevels.BOOSTER_UNLOCK;
    ["hammer", "arrow", "cannon", "hat"].forEach(function (b) {
      var el = $("b-" + b);
      var locked = S.level < unlockedAt[b];
      el.classList.toggle("locked", locked);
      el.disabled = locked || (S.boosters[b] || 0) <= 0;
      $("c-" + b).textContent = S.boosters[b] || 0;
      el.classList.toggle("armed", armedBooster === b);
    });
  }

  var armedBooster = null;
  document.querySelectorAll(".booster").forEach(function (b) {
    b.addEventListener("click", function () {
      var name = b.getAttribute("data-b");
      if (b.disabled) { toast("🔒 Se desbloquea en el nivel " + RCLevels.BOOSTER_UNLOCK[name]); return; }
      if ((S.boosters[name] || 0) <= 0) { toast("No tienes este potenciador. ¡Visita la tienda!"); return; }
      armedBooster = RCBoard.armBooster(name) ? name : null;
      renderBoosters();
      if (armedBooster) toast("Toca una ficha para usar " + RCLevels.BOOSTER_INFO[name].name);
    });
  });

  $("btn-pause").addEventListener("click", function () {
    RCBoard.setState("paused");
    goto("screen-pause");
  });
  $("btn-resume").addEventListener("click", function () {
    goto("screen-game");
    RCBoard.setState("game");
  });
  $("btn-pause-settings").addEventListener("click", function () { openSettings(true); });
  $("btn-quit").addEventListener("click", function () {
    RCBoard.setState("home");
    goto("screen-home");
    updateHud();
  });

  /* ================= VICTORIA / DERROTA ================= */
  var resultKing = $("result-king"), resultCtx = resultKing.getContext("2d");
  var resultPose = "dance", resultAnimating = false;

  function winLevel(level, score) {
    RCBoard.setState("result");
    var stars = 1;
    if (score >= level.starThresholds[1]) stars = 2;
    if (score >= level.starThresholds[2]) stars = 3;

    var coins = level.coinsReward;
    S.stars += stars;
    S.coins += coins;
    S.streak++;
    var streakBonus = S.streak >= 3 ? 25 * Math.min(S.streak, 6) : 0;
    S.coins += streakBonus;
    save();

    $("result-title").textContent = "¡VICTORIA, " + S.role.toUpperCase() + "!";
    $("result-title").className = "win";
    var starsEl = $("result-stars");
    starsEl.innerHTML = "";
    for (var i = 0; i < 3; i++) {
      var sp = document.createElement("span");
      sp.textContent = "⭐";
      if (i >= stars) sp.className = "off";
      starsEl.appendChild(sp);
      (function (idx) {
        setTimeout(function () { if (idx < stars) { RCAudio.sfx("star", idx); vibrate(60); } }, idx * 350 + 300);
      })(i);
    }
    var rewardTxt = "+" + coins + " 🪙";
    if (streakBonus > 0) rewardTxt += " · Racha 🔥 +" + streakBonus;
    $("result-rewards").textContent = rewardTxt;
    $("btn-result-next").textContent = level.num === 100 ? "🌍 ¡VIAJAR!" : "Siguiente →";

    resultPose = "celebrate";
    resultAnimating = true;
    RCAudio.sfx("win");
    vibrate([80, 60, 80, 60, 160]);
    goto("screen-result");

    pendingWin = { level: level, stars: stars };
  }

  var pendingWin = null;

  function loseLevel(level, score) {
    RCBoard.setState("result");
    /* El nivel bonus nunca se pierde: paga monedas por lo juntado */
    if (level.bonus) {
      var coins = Math.floor(score / 15);
      S.coins += coins;
      if (level.num >= S.level) { S.level = level.num + 1; }
      save();
      $("result-title").textContent = "🎁 ¡Bonus Terminado!";
      $("result-title").className = "win";
      $("result-stars").innerHTML = "";
      $("result-rewards").textContent = "+" + coins + " 🪙 ganados";
      $("btn-result-next").textContent = "Continuar →";
      $("btn-result-next").disabled = false;
      resultPose = "celebrate";
      resultAnimating = true;
      RCAudio.sfx("coin");
      goto("screen-result");
      pendingWin = { level: level, bonusPass: true };
      return;
    }
    loseLife();
    S.streak = 0;
    save();
    $("result-title").textContent = "Oh no... 😅";
    $("result-title").className = "lose";
    $("result-stars").innerHTML = "";
    $("result-rewards").textContent = "Te quedaste sin movimientos";
    $("btn-result-next").textContent = "🔄 Reintentar (" + S.lives + " ❤️)";
    $("btn-result-next").disabled = S.lives <= 0 && !S.dev;
    resultPose = "sad";
    resultAnimating = true;
    RCAudio.sfx("lose");
    vibrate(200);
    goto("screen-result");
    pendingWin = null;
  }

  function resultLoop(ts) {
    if (!resultAnimating) return;
    try {
      resultCtx.clearRect(0, 0, 200, 220);
      RCChar.draw(resultCtx, 100, 205, 190, charCustom(), resultPose, ts);
    } catch (e) { showError(e); }
    requestAnimationFrame(resultLoop);
  }

  $("btn-result-home").addEventListener("click", function () {
    resultAnimating = false;
    RCBoard.setState("home");
    goto("screen-home");
    updateHud();
  });

  $("btn-result-next").addEventListener("click", function () {
    resultAnimating = false;
    if (pendingWin && pendingWin.level.num === 100 && S.country === "cuba") {
      startTravel();
      return;
    }
    if (pendingWin) {
      if (pendingWin.level.num >= S.level) {
        S.level = pendingWin.level.num + 1;
        save();
      }
      openIntro(RCLevels.genLevel(S.level));
    } else {
      openIntro(RCLevels.genLevel(S.level));
    }
  });

  /* ================= VIAJE ENTRE PAÍSES ================= */
  var travelCanvas = $("travel-canvas"), travelCtx = travelCanvas.getContext("2d");
  var travelT = 0, travelActive = false;

  function startTravel() {
    travelActive = true;
    travelT = 0;
    $("travel-title").textContent = "🛳️ ¡Nivel 100 superado!";
    $("travel-text").textContent = "El horizonte llama... zarpando hacia México 🇲🇽";
    goto("screen-travel");
    RCAudio.stopMusic();
    travelLoop();
  }

  function travelLoop() {
    if (!travelActive) return;
    travelT += 0.012;
    var c = travelCtx, cw = 320, ch = 220;
    c.clearRect(0, 0, cw, ch);
    var g = c.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, "#2a1a5e");
    g.addColorStop(0.6, "#5e3a8a");
    g.addColorStop(1, "#1a6fa8");
    c.fillStyle = g;
    c.fillRect(0, 0, cw, ch);
    for (var i = 0; i < 30; i++) {
      c.fillStyle = "rgba(255,255,255,0.7)";
      c.fillRect((i * 47) % cw, (i * 31) % 80, 2, 2);
    }
    c.fillStyle = "#123a7a";
    c.fillRect(0, 150, cw, 70);
    c.strokeStyle = "rgba(255,255,255,0.3)";
    for (var w2 = 0; w2 < 5; w2++) {
      c.beginPath();
      for (var x = 0; x <= cw; x += 12) {
        var y = 155 + w2 * 12 + Math.sin(x * 0.04 + travelT * 8 + w2) * 3;
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
    var bx = -60 + travelT * 400;
    var by = 120 + Math.sin(travelT * 4) * 5;
    c.font = "50px serif";
    c.textAlign = "center";
    c.fillText("🛳️", bx, by);
    if (bx > cw * 0.45) {
      c.font = "30px serif";
      c.fillText("🇨🇺", bx - 60, 60);
      c.fillText("🇲🇽", bx + 60, 60);
    }
    if (travelT >= 1.1) {
      travelActive = false;
      finishTravel();
      return;
    }
    requestAnimationFrame(travelLoop);
  }

  function finishTravel() {
    S.country = "mexico";
    S.level = 101;
    S.coins += 500;
    save();
    musicForCountry();
    toast("🇲🇽 ¡Bienvenido a México! +500 🪙");
    RCBoard.setState("home");
    goto("screen-home");
    updateHud();
  }

  /* ================= TIENDA ================= */
  function openShop() {
    $("shop-coins").textContent = S.coins;
    $("shop-country").textContent = S.country === "mexico" ? "de México 🇲🇽" : "de Cuba 🇨🇺";
    var box = $("shop-items");
    box.innerHTML = "";
    RCLevels.SHOP[S.country].forEach(function (item) {
      var row = document.createElement("div");
      row.className = "shop-item";
      var priceTxt = item.starPrice ? item.starPrice + " ⭐" : item.price + " 🪙";
      var canAfford = item.starPrice ? S.stars >= item.starPrice : S.coins >= item.price;
      row.innerHTML =
        '<span class="si-icon">' + item.icon + '</span>' +
        '<span class="si-info"><b>' + item.name + '</b><small>' + item.desc + '</small></span>' +
        '<button class="btn ' + (canAfford ? "btn-gold" : "btn-grey") + '">' + priceTxt + '</button>';
      row.querySelector("button").addEventListener("click", function () {
        buyItem(item);
      });
      box.appendChild(row);
    });
    goto("screen-shop");
  }

  function buyItem(item) {
    if (!S.dev) {
      if (item.starPrice) {
        if (S.stars < item.starPrice) { toast("⭐ Estrellas insuficientes"); return; }
        S.stars -= item.starPrice;
      } else {
        if (S.coins < item.price) { toast("🪙 Monedas insuficientes"); return; }
        S.coins -= item.price;
      }
    }
    var g = item.give;
    if (g.booster) S.boosters[g.booster] = (S.boosters[g.booster] || 0) + g.n;
    if (g.lives === "full") { S.lives = 5; S.livesTs = Date.now(); }
    if (g.coins) S.coins += g.coins;
    save();
    RCAudio.sfx("coin");
    vibrate(40);
    toast("✅ ¡" + item.name + " comprado!");
    openShop();
    updateHud();
  }

  $("btn-shop-close").addEventListener("click", function () {
    goto(current === "screen-shop" ? "screen-home" : "screen-home");
    updateHud();
  });

  /* ================= DIARIAS ================= */
  function openDaily() {
    var grid = $("daily-grid");
    grid.innerHTML = "";
    var todayKey = new Date().toDateString();
    var dayIdx = S.dailyLast === todayKey ? S.dailyDay : S.dailyDay;
    RCLevels.DAILY.forEach(function (d, i) {
      var cell = document.createElement("div");
      cell.className = "daily-cell" + (d.combo ? " combo" : "");
      var claimed = i < S.dailyDay;
      var isToday = i === S.dailyDay && S.dailyLast !== todayKey;
      if (claimed) cell.classList.add("claimed");
      if (isToday) cell.classList.add("today");
      cell.innerHTML = '<b>Día ' + (i + 1) + '</b><span class="di">' + d.icon + '</span><small>' + d.label + '</small>';
      grid.appendChild(cell);
    });
    var canClaim = S.dailyLast !== todayKey;
    $("btn-claim").disabled = !canClaim;
    $("btn-claim").textContent = canClaim ? "RECLAMAR DÍA " + (S.dailyDay + 1) : "Vuelve mañana ✨";
    goto("screen-daily");
  }

  $("btn-claim").addEventListener("click", function () {
    var todayKey = new Date().toDateString();
    if (S.dailyLast === todayKey) return;
    var reward = RCLevels.DAILY[S.dailyDay % 7];
    var g = reward.give;
    var msg = "🎁 ";
    if (g.coins) { S.coins += g.coins; msg += "+" + g.coins + " 🪙 "; }
    if (g.booster) { S.boosters[g.booster] = (S.boosters[g.booster] || 0) + g.n; msg += "+" + g.n + " potenciador "; }
    if (g.boosterDynamite) { S.boosters.hammer++; msg += "+1 Martillo "; }
    if (g.boosters) {
      for (var b in g.boosters) { S.boosters[b] = (S.boosters[b] || 0) + g.boosters[b]; msg += "+" + g.boosters[b] + " "; }
      msg += "¡COMBO! 🎉";
    }
    S.dailyLast = todayKey;
    S.dailyDay = (S.dailyDay + 1) % 7;
    S.dailyClaimedToday = true;
    save();
    RCAudio.sfx("coin");
    vibrate([50, 50, 50]);
    toast(msg);
    openDaily();
    updateHud();
  });

  $("btn-daily-close").addEventListener("click", function () { goto("screen-home"); updateHud(); });

  /* ================= CONFIGURACIÓN ================= */
  var settingsFrom = null;
  var setKing = $("settings-king"), setKingCtx = setKing.getContext("2d");
  var setKingAnim = true;

  function openSettings(fromPause) {
    settingsFrom = fromPause ? "pause" : "home";
    $("set-music").value = S.settings.music * 100;
    $("set-sfx").value = S.settings.sfx * 100;
    $("set-vib").textContent = S.settings.vib ? "SÍ" : "NO";
    $("set-vib").classList.toggle("on", S.settings.vib);
    $("set-key").value = "";
    $("set-body").value = S.custom.body;
    $("set-hair").value = S.custom.hair;
    $("set-beard").value = S.custom.beard;
    $("set-cloth").value = S.custom.cloth;
    setKingAnim = true;
    settingsKingLoop();
    goto("screen-settings");
  }

  function settingsKingLoop() {
    if (!setKingAnim) return;
    var preview = {
      body: $("set-body").value, hair: $("set-hair").value,
      beard: $("set-beard").value, cloth: $("set-cloth").value,
      gender: S.gender, old: S.age >= 60
    };
    setKingCtx.clearRect(0, 0, 140, 160);
    RCChar.draw(setKingCtx, 70, 150, 135, preview, "idle", performance.now());
    requestAnimationFrame(settingsKingLoop);
  }

  $("set-vib").addEventListener("click", function () {
    S.settings.vib = !S.settings.vib;
    this.textContent = S.settings.vib ? "SÍ" : "NO";
    this.classList.toggle("on", S.settings.vib);
    vibrate(30);
  });

  $("btn-key").addEventListener("click", function () {
    var key = $("set-key").value.trim().toLowerCase();
    if (key === "manu") {
      if (!S.dev) {
        S.dev = true;
        save();
        toast("🔓 Modo desarrollador activado: compras gratis y vidas infinitas");
        RCAudio.sfx("win");
      } else {
        toast("🔓 El modo desarrollador ya está activo");
      }
      updateHud();
    } else if (key !== "") {
      toast("❌ Clave incorrecta");
    }
    $("set-key").value = "";
  });
  ["set-body", "set-hair", "set-beard", "set-cloth"].forEach(function (id) {
    $(id).addEventListener("change", function () { vibrate(20); });
  });

  $("btn-settings-close").addEventListener("click", function () {
    S.settings.music = $("set-music").value / 100;
    S.settings.sfx = $("set-sfx").value / 100;
    S.custom.body = $("set-body").value;
    S.custom.hair = $("set-hair").value;
    S.custom.beard = $("set-beard").value;
    S.custom.cloth = $("set-cloth").value;
    RCAudio.setVolumes(S.settings.music, S.settings.sfx);
    save();
    setKingAnim = false;
    if (settingsFrom === "pause") goto("screen-pause");
    else { goto("screen-home"); updateHud(); }
  });

  /* ================= RENOVACIÓN ================= */
  function openRenov() {
    $("renov-country").textContent = S.country === "mexico" ? "México 🇲🇽" : "Cuba 🇨🇺";
    var list = $("renov-list");
    list.innerHTML = "";
    RCLevels.RENOVATIONS[S.country].forEach(function (z) {
      var done = S.renovated.indexOf(S.country + ":" + z.id) >= 0;
      var row = document.createElement("div");
      row.className = "renov-item" + (done ? " done" : "");
      row.innerHTML =
        '<span class="ri-icon">' + z.icon + '</span>' +
        '<span class="ri-info"><b>' + z.name + '</b><small>' + (done ? "✅ Restaurado" : "Recompensa: +" + z.reward + " 🪙") + '</small></span>' +
        '<button class="btn ' + (done ? "btn-grey" : "btn-gold") + '">' + (done ? "Hecho" : z.cost + " ⭐") + '</button>';
      row.querySelector("button").addEventListener("click", function () {
        if (done) return;
        if (S.stars < z.cost) { toast("⭐ Te faltan estrellas. ¡Gana niveles!"); return; }
        S.stars -= z.cost;
        S.coins += z.reward;
        S.renovated.push(S.country + ":" + z.id);
        save();
        RCAudio.sfx("win");
        toast("🏰 ¡" + z.name + " restaurado! +" + z.reward + " 🪙");
        openRenov();
        updateHud();
      });
      list.appendChild(row);
    });
    goto("screen-renov");
  }
  $("btn-renov-close").addEventListener("click", function () { goto("screen-home"); updateHud(); });

  /* ================= MAPA DE NIVELES ================= */
  function openMap() {
    var grid = $("map-grid");
    grid.innerHTML = "";
    for (var n = 1; n <= S.level; n++) {
      (function (num) {
        var lv = RCLevels.genLevel(num);
        var cell = document.createElement("div");
        var stars = S.levelStars[num] || 0;
        cell.className = "map-cell" +
          (lv.bonus ? " bonus" : "") +
          (stars > 0 ? " done" : "") +
          (num === S.level ? " current" : "");
        var starTxt = lv.bonus ? "🎁" : (stars > 0 ? new Array(stars + 1).join("⭐") : "☆☆☆");
        cell.innerHTML = "<b>" + (lv.bonus ? "Bonus" : num) + "</b><small>" + starTxt + "</small>";
        cell.addEventListener("click", function () {
          if (!S.dev && S.lives <= 0 && num >= S.level) { toast("💔 Sin vidas"); return; }
          openIntro(RCLevels.genLevel(num));
        });
        grid.appendChild(cell);
      })(n);
    }
    goto("screen-map");
  }
  $("btn-map-close").addEventListener("click", function () { goto("screen-home"); updateHud(); });

  /* ================= INPUT DEL JUEGO ================= */
  var touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    if (current === "screen-game") RCBoard.handleTap(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener("touchend", function (e) {
    e.preventDefault();
    if (!touchStart || current !== "screen-game") return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > 24 || Math.abs(dy) > 24) swipeSwap(touchStart, dx, dy);
    touchStart = null;
  }, { passive: false });

  var mouseDown = false;
  canvas.addEventListener("mousedown", function (e) {
    mouseDown = true;
    touchStart = { x: e.clientX, y: e.clientY };
    if (current === "screen-game") RCBoard.handleTap(e.clientX, e.clientY);
  });
  window.addEventListener("mouseup", function (e) {
    if (!mouseDown) return;
    mouseDown = false;
    if (!touchStart || current !== "screen-game") return;
    var dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
    if (Math.abs(dx) > 24 || Math.abs(dy) > 24) swipeSwap(touchStart, dx, dy);
    touchStart = null;
  });

  function swipeSwap(from, dx, dy) {
    var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? [0, 1] : [0, -1]) : (dy > 0 ? [1, 0] : [-1, 0]);
    var target = RCBoard.neighborPoint(from.x, from.y, dir[1], dir[0]);
    if (target) RCBoard.handleTap(target.x, target.y);
  }

  /* ================= LOOP PRINCIPAL ================= */
  var lastTs = 0;
  function loop(ts) {
    try {
      var dt = Math.min(50, ts - lastTs);
      lastTs = ts;
      RCScenes.tick();
      var tod = RCScenes.timeOfDay();
      var zone = RCScenes.zoneFor(S.country, S.level);

      if (current === "screen-game") {
        RCBoard.update(dt);
        RCScenes.drawSky(ctx, W, H, tod);
        RCScenes.drawScene(ctx, W, H, zone.id, tod);
        ctx.fillStyle = "rgba(6,8,22,0.74)";
        ctx.fillRect(0, 0, W, H);
        RCBoard.draw(ctx);
      } else if (current === "screen-home") {
        RCScenes.drawSky(ctx, W, H, tod);
        RCScenes.drawScene(ctx, W, H, zone.id, tod);
        RCChar.draw(ctx, W / 2, H * 0.62, Math.min(W * 0.42, 240), charCustom(),
          S.streak >= 3 ? "dance" : "idle", ts);
      } else {
        RCScenes.drawSky(ctx, W, H, tod);
        RCScenes.drawScene(ctx, W, H, zone.id, tod);
      }
    } catch (e) { showError(e); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  requestAnimationFrame(resultLoop);

  /* ================= INIT ================= */
  RCAudio.setVolumes(S.settings.music, S.settings.sfx);
  tickLives();
  updateHud();
  window.addEventListener("resize", function () { RCBoard.layout(); });
})();
