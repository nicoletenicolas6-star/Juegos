(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  var W = 0;
  var H = 0;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  var STATE = { MENU: 0, PLAYING: 1, OVER: 2 };
  var state = STATE.MENU;

  var player = {
    w: 56,
    h: 56,
    x: 0,
    y: 0,
    speed: 0,
    maxSpeed: 0.9
  };

  var obstacles = [];
  var stars = [];
  var particles = [];

  var score = 0;
  var best = 0;
  var spawnTimer = 0;
  var spawnInterval = 55;
  var fallSpeedBase = 3.2;
  var frame = 0;
  var shake = 0;

  try {
    best = parseInt(localStorage.getItem("esquiva_best") || "0", 10) || 0;
  } catch (e) {
    best = 0;
  }

  function initStars() {
    stars = [];
    for (var i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.4,
        s: Math.random() * 1.2 + 0.3
      });
    }
  }
  initStars();

  function resetGame() {
    score = 0;
    frame = 0;
    shake = 0;
    obstacles = [];
    particles = [];
    spawnTimer = 0;
    spawnInterval = 55;
    fallSpeedBase = 3.2;
    player.w = Math.max(40, Math.min(56, W * 0.13));
    player.h = player.w;
    player.x = W / 2 - player.w / 2;
    player.y = H - player.h - Math.max(24, H * 0.06);
    player.speed = 0;
  }

  function spawnObstacle() {
    var size = Math.random() * (W * 0.09) + W * 0.06;
    obstacles.push({
      x: Math.random() * (W - size),
      y: -size * 2,
      w: size,
      h: size,
      vy: fallSpeedBase + Math.random() * 1.8,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.1,
      hue: Math.random() * 60 + 330
    });
  }

  function burst(x, y, hue) {
    for (var i = 0; i < 22; i++) {
      var a = Math.random() * Math.PI * 2;
      var v = Math.random() * 5 + 1.5;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1,
        hue: hue
      });
    }
  }

  function gameOver() {
    state = STATE.OVER;
    shake = 14;
    burst(player.x + player.w / 2, player.y + player.h / 2, 190);
    if (score > best) {
      best = score;
      try { localStorage.setItem("esquiva_best", String(best)); } catch (e) {}
    }
  }

  function update() {
    frame++;

    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      st.y += st.s;
      if (st.y > H) {
        st.y = -2;
        st.x = Math.random() * W;
      }
    }

    if (state !== STATE.PLAYING) {
      if (shake > 0) shake *= 0.85;
      for (var p = particles.length - 1; p >= 0; p--) {
        var pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.15;
        pt.life -= 0.02;
        if (pt.life <= 0) particles.splice(p, 1);
      }
      return;
    }

    if (shake > 0) shake *= 0.85;

    player.x += player.speed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;
    player.speed *= 0.82;

    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnObstacle();
      if (spawnInterval > 18) spawnInterval -= 0.6;
    }

    fallSpeedBase += 0.0015;

    for (var j = obstacles.length - 1; j >= 0; j--) {
      var o = obstacles[j];
      o.y += o.vy;
      o.rot += o.vr;

      if (o.y > H + o.h * 2) {
        obstacles.splice(j, 1);
        score++;
        continue;
      }

      if (
        o.x < player.x + player.w * 0.8 &&
        o.x + o.w > player.x + player.w * 0.2 &&
        o.y < player.y + player.h * 0.8 &&
        o.y + o.h > player.y + player.h * 0.2
      ) {
        burst(o.x + o.w / 2, o.y + o.h / 2, o.hue);
        obstacles.splice(j, 1);
        gameOver();
        return;
      }
    }

    for (var q = particles.length - 1; q >= 0; q--) {
      var pp = particles[q];
      pp.x += pp.vx;
      pp.y += pp.vy;
      pp.vy += 0.15;
      pp.life -= 0.02;
      if (pp.life <= 0) particles.splice(q, 1);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    ctx.save();
    if (shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0b1020");
    grad.addColorStop(1, "#141b3a");
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      ctx.fillRect(st.x, st.y, st.r, st.r);
    }

    if (state !== STATE.OVER) {
      var glow = ctx.createRadialGradient(
        player.x + player.w / 2, player.y + player.h / 2, 2,
        player.x + player.w / 2, player.y + player.h / 2, player.w
      );
      glow.addColorStop(0, "rgba(80,200,255,0.45)");
      glow.addColorStop(1, "rgba(80,200,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(player.x - player.w, player.y - player.w, player.w * 3, player.w * 3);

      ctx.fillStyle = "#4fd2ff";
      roundRect(player.x, player.y, player.w, player.h, player.w * 0.28);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      roundRect(player.x + player.w * 0.22, player.y + player.h * 0.2, player.w * 0.56, player.h * 0.28, player.w * 0.12);
      ctx.fill();
    }

    for (var j = 0; j < obstacles.length; j++) {
      var o = obstacles[j];
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.rot);
      ctx.fillStyle = "hsl(" + o.hue + ",80%,60%)";
      roundRect(-o.w / 2, -o.h / 2, o.w, o.h, o.w * 0.2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      roundRect(-o.w / 2, o.h * 0.1, o.w, o.h * 0.4, o.w * 0.15);
      ctx.fill();
      ctx.restore();
    }

    for (var p = 0; p < particles.length; p++) {
      var pt = particles[p];
      ctx.globalAlpha = Math.max(pt.life, 0);
      ctx.fillStyle = "hsl(" + pt.hue + ",90%,65%)";
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";

    if (state === STATE.PLAYING) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold " + Math.max(26, W * 0.075) + "px sans-serif";
      ctx.fillText(String(score), W / 2, Math.max(54, H * 0.09));
    }

    if (state === STATE.MENU) {
      ctx.fillStyle = "#4fd2ff";
      ctx.font = "bold " + Math.max(42, W * 0.14) + "px sans-serif";
      ctx.fillText("ESQUIVA", W / 2, H * 0.32);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = Math.max(15, W * 0.042) + "px sans-serif";
      ctx.fillText("Arrastra para moverte", W / 2, H * 0.46);
      ctx.fillText("Esquiva los bloques que caen", W / 2, H * 0.52);

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = Math.max(13, W * 0.035) + "px sans-serif";
      ctx.fillText("Récord: " + best, W / 2, H * 0.6);

      var pulse = 0.75 + Math.sin(frame * 0.06) * 0.25;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#4fd2ff";
      roundRect(W * 0.28, H * 0.68, W * 0.44, Math.max(52, H * 0.075), 14);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0b1020";
      ctx.font = "bold " + Math.max(18, W * 0.05) + "px sans-serif";
      ctx.fillText("JUGAR", W / 2, H * 0.68 + Math.max(52, H * 0.075) * 0.66);
    }

    if (state === STATE.OVER) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ff5470";
      ctx.font = "bold " + Math.max(36, W * 0.11) + "px sans-serif";
      ctx.fillText("GAME OVER", W / 2, H * 0.34);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold " + Math.max(24, W * 0.07) + "px sans-serif";
      ctx.fillText("Puntos: " + score, W / 2, H * 0.45);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = Math.max(15, W * 0.04) + "px sans-serif";
      ctx.fillText(score >= best && score > 0 ? "¡Nuevo récord! 🏆" : "Récord: " + best, W / 2, H * 0.52);

      ctx.fillStyle = "#4fd2ff";
      roundRect(W * 0.25, H * 0.62, W * 0.5, Math.max(52, H * 0.075), 14);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = "bold " + Math.max(18, W * 0.05) + "px sans-serif";
      ctx.fillText("REINTENTAR", W / 2, H * 0.62 + Math.max(52, H * 0.075) * 0.66);
    }

    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function startOrRestart(x, y) {
    if (state === STATE.MENU) {
      if (x > W * 0.28 && x < W * 0.72 && y > H * 0.68 && y < H * 0.68 + Math.max(52, H * 0.075) * 1.4) {
        resetGame();
        state = STATE.PLAYING;
      }
    } else if (state === STATE.OVER) {
      if (y > H * 0.55) {
        resetGame();
        state = STATE.PLAYING;
      }
    }
  }

  var lastTouchX = null;

  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    lastTouchX = t.clientX;
    startOrRestart(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    if (state !== STATE.PLAYING || lastTouchX === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - lastTouchX;
    player.x += dx;
    lastTouchX = t.clientX;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;
  }, { passive: false });

  canvas.addEventListener("touchend", function (e) {
    e.preventDefault();
    lastTouchX = null;
  }, { passive: false });

  var mouseDown = false;
  canvas.addEventListener("mousedown", function (e) {
    mouseDown = true;
    lastTouchX = e.clientX;
    startOrRestart(e.clientX, e.clientY);
  });
  canvas.addEventListener("mousemove", function (e) {
    if (!mouseDown || state !== STATE.PLAYING) return;
    player.x += e.clientX - lastTouchX;
    lastTouchX = e.clientX;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;
  });
  window.addEventListener("mouseup", function () {
    mouseDown = false;
    lastTouchX = null;
  });

  document.addEventListener("keydown", function (e) {
    if (state === STATE.MENU || state === STATE.OVER) {
      if (e.code === "Space" || e.code === "Enter") {
        resetGame();
        state = STATE.PLAYING;
      }
      return;
    }
    if (e.code === "ArrowLeft") player.speed = -player.maxSpeed;
    if (e.code === "ArrowRight") player.speed = player.maxSpeed;
  });
})();
