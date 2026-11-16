/* Reino Cubano — Fondos paisajísticos en capas con parallax y ciclo día/tarde/noche */
(function () {
  "use strict";

  /* Zonas por país: cada una con su paleta y capas */
  var ZONES = {
    cuba: [
      { id: "malecon", name: "Malecón Habanero", icon: "🏙️", from: 1 },
      { id: "vinales", name: "Valle de Viñales", icon: "⛰️", from: 26 },
      { id: "trinidad", name: "Trinidad Colonial", icon: "🏘️", from: 51 },
      { id: "varadero", name: "Playa Varadero", icon: "🏖️", from: 76 }
    ],
    mexico: [
      { id: "chichen", name: "Chichén Itzá", icon: "🏛️", from: 101 },
      { id: "cancun", name: "Cancún", icon: "🌴", from: 126 },
      { id: "cdmx", name: "Ciudad de México", icon: "🌆", from: 151 },
      { id: "oaxaca", name: "Oaxaca Mágico", icon: "🌵", from: 176 }
    ]
  };

  function zoneFor(country, level) {
    var list = ZONES[country] || ZONES.cuba;
    var z = list[0];
    for (var i = 0; i < list.length; i++) if (level >= list[i].from) z = list[i];
    return z;
  }

  function nextZone(country, level) {
    var list = ZONES[country] || ZONES.cuba;
    for (var i = 0; i < list.length; i++) if (level < list[i].from) return list[i];
    return null;
  }

  /* Hora real → momento del día */
  function timeOfDay() {
    var h = new Date().getHours();
    if (h >= 6 && h < 10) return "manana";
    if (h >= 10 && h < 17) return "dia";
    if (h >= 17 && h < 20) return "tarde";
    return "noche";
  }

  var SKY = {
    manana: ["#ffd9a0", "#ffb37a", "#7ec8e3", "#4a9fd8"],
    dia: ["#8ed4f7", "#5cb8ec", "#3a92d0", "#2a6fa8"],
    tarde: ["#ff9a5c", "#ff6b6b", "#c94f8a", "#6a3d9a"],
    noche: ["#0a1030", "#141b3f", "#1c2a5e", "#26386e"]
  };

  var clouds = [];
  for (var ci = 0; ci < 7; ci++) {
    clouds.push({ x: Math.random(), y: 0.08 + Math.random() * 0.25, s: 0.5 + Math.random() * 0.9, v: 0.00004 + Math.random() * 0.00008 });
  }
  var birds = [];
  for (var bi = 0; bi < 4; bi++) {
    birds.push({ x: Math.random(), y: 0.12 + Math.random() * 0.2, v: 0.0002 + Math.random() * 0.0002, ph: Math.random() * 6 });
  }
  var nightStars = [];
  for (var si = 0; si < 80; si++) {
    nightStars.push({ x: Math.random(), y: Math.random() * 0.55, r: Math.random() * 1.4 + 0.4, tw: Math.random() * 6 });
  }

  var time = 0;

  function drawSky(ctx, W, H, tod) {
    var cols = SKY[tod] || SKY.dia;
    var g = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    for (var i = 0; i < cols.length; i++) g.addColorStop(i / (cols.length - 1), cols[i]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (tod === "noche") {
      for (var i = 0; i < nightStars.length; i++) {
        var st = nightStars[i];
        var tw = 0.4 + Math.sin(time * 0.002 + st.tw) * 0.35;
        ctx.globalAlpha = tw;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.r, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawMoon(ctx, W, H);
    } else {
      drawSun(ctx, W, H, tod);
    }
    drawClouds(ctx, W, H, tod);
    if (tod !== "noche") drawBirds(ctx, W, H, tod);
  }

  function drawSun(ctx, W, H, tod) {
    var x = W * 0.78, y = H * (tod === "tarde" ? 0.3 : 0.14);
    var r = W * (tod === "tarde" ? 0.09 : 0.06);
    var col = tod === "tarde" ? "#ff8c5a" : tod === "manana" ? "#ffdd88" : "#fff3b0";
    var glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3.2);
    glow.addColorStop(0, col);
    glow.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }

  function drawMoon(ctx, W, H) {
    var x = W * 0.76, y = H * 0.13, r = W * 0.05;
    ctx.save();
    var glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
    glow.addColorStop(0, "rgba(220,230,255,0.35)");
    glow.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    ctx.fillStyle = "#e8ecf7";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(180,190,215,0.6)";
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.18, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.25, y + r * 0.3, r * 0.12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.35, r * 0.1, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawCloud(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 16 * s, 0, 7);
    ctx.arc(x + 18 * s, y - 8 * s, 20 * s, 0, 7);
    ctx.arc(x + 40 * s, y, 16 * s, 0, 7);
    ctx.arc(x + 20 * s, y + 8 * s, 18 * s, 0, 7);
    ctx.fill();
  }

  function drawClouds(ctx, W, H, tod) {
    var col = tod === "noche" ? "rgba(200,210,240,0.14)" : tod === "tarde" ? "rgba(255,190,160,0.75)" : "rgba(255,255,255,0.85)";
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.v;
      if (c.x > 1.25) c.x = -0.3;
      drawCloud(ctx, c.x * W, c.y * H, c.s * (W / 400), col);
    }
  }

  function drawBirds(ctx, W, H, tod) {
    ctx.strokeStyle = tod === "tarde" ? "rgba(80,30,60,0.7)" : "rgba(30,40,60,0.6)";
    ctx.lineWidth = 2;
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      b.x += b.v;
      if (b.x > 1.1) b.x = -0.1;
      var x = b.x * W, y = b.y * H + Math.sin(time * 0.003 + b.ph) * 6;
      var f = Math.sin(time * 0.01 + b.ph) * 5;
      ctx.beginPath();
      ctx.moveTo(x - 8, y + f);
      ctx.quadraticCurveTo(x, y - 4, x + 8, y + f);
      ctx.stroke();
    }
  }

  function sea(ctx, W, H, top, tod, waveCol) {
    var cols = {
      manana: ["#5ab4d8", "#2f7fae"],
      dia: ["#3fb0e0", "#1a6fa8"],
      tarde: ["#e08a6a", "#8a4a7a"],
      noche: ["#16305e", "#0e1f42"]
    };
    var c = cols[tod] || cols.dia;
    var g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, c[0]);
    g.addColorStop(1, c[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, H - top);
    ctx.strokeStyle = waveCol || "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    for (var l = 0; l < 4; l++) {
      ctx.beginPath();
      var y = top + 14 + l * 22;
      for (var x = 0; x <= W; x += 14) {
        var yy = y + Math.sin(x * 0.03 + time * 0.002 + l * 1.7) * 4;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.globalAlpha = 0.5 - l * 0.1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* Silueta genérica de montañas/mogotes */
  function mountains(ctx, W, H, baseY, h, col, seed, bump) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, baseY + 2);
    var x = 0, i = 0;
    while (x < W) {
      var w = W * (0.1 + ((Math.sin(seed + i * 3.7) + 1) / 2) * 0.08);
      var peak = baseY - h * (0.5 + ((Math.sin(seed * 2 + i * 2.3) + 1) / 2) * (bump ? 0.9 : 0.5));
      ctx.quadraticCurveTo(x + w * 0.5, peak, x + w, baseY);
      x += w;
      i++;
    }
    ctx.lineTo(W, baseY + 2);
    ctx.closePath();
    ctx.fill();
  }

  function buildingRow(ctx, W, H, baseY, col, seed, hMin, hMax, colored) {
    var x = -10;
    var i = 0;
    while (x < W) {
      var bw = W * (0.08 + ((Math.sin(seed + i * 5.1) + 1) / 2) * 0.06);
      var bh = H * (hMin + ((Math.sin(seed * 3 + i * 2.9) + 1) / 2) * (hMax - hMin));
      if (colored) {
        var hues = ["#d96a5a", "#e8b04a", "#5a9e8f", "#c96a94", "#6a8fc9"];
        ctx.fillStyle = hues[i % hues.length];
      } else {
        ctx.fillStyle = col;
      }
      ctx.fillRect(x, baseY - bh, bw * 0.92, bh);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (var wy = baseY - bh + 8; wy < baseY - 10; wy += 16) {
        for (var wx = x + 5; wx < x + bw * 0.92 - 8; wx += 14) {
          if ((wx + wy + i) % 3 !== 0) ctx.fillRect(wx, wy, 5, 7);
        }
      }
      x += bw;
      i++;
    }
  }

  function palms(ctx, W, H, baseY, n, col, seed) {
    for (var i = 0; i < n; i++) {
      var x = W * (0.08 + 0.84 * (((Math.sin(seed + i * 7.3) + 1) / 2)));
      var h = H * (0.1 + ((Math.sin(seed + i * 3.1) + 1) / 2) * 0.06);
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(3, W * 0.008);
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x + 8, baseY - h * 0.6, x + 4, baseY - h);
      ctx.stroke();
      for (var l = 0; l < 5; l++) {
        var a = -2.4 + l * 0.55 + Math.sin(time * 0.001 + i) * 0.05;
        ctx.beginPath();
        ctx.moveTo(x + 4, baseY - h);
        ctx.quadraticCurveTo(
          x + 4 + Math.cos(a) * h * 0.35, baseY - h + Math.sin(a) * h * 0.3 - h * 0.12,
          x + 4 + Math.cos(a) * h * 0.5, baseY - h + Math.sin(a) * h * 0.28 + h * 0.08
        );
        ctx.lineWidth = Math.max(2, W * 0.005);
        ctx.stroke();
      }
    }
  }

  function pyramid(ctx, cx, baseY, w, h, col, light) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.lineTo(cx, baseY - h);
    ctx.lineTo(cx + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx + w / 2, baseY);
    ctx.lineTo(cx + w * 0.08, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    for (var i = 1; i < 7; i++) {
      var yy = baseY - (h / 7) * i;
      var ww = (w / 2) * (1 - i / 7);
      ctx.beginPath();
      ctx.moveTo(cx - ww, yy);
      ctx.lineTo(cx + ww, yy);
      ctx.stroke();
    }
  }

  /* ---- Cada zona dibuja su escena ---- */
  var SCENES = {
    malecon: function (ctx, W, H, tod, baseY) {
      buildingRow(ctx, W, H, baseY - H * 0.02, tod === "noche" ? "#1e2a50" : "#b06a5f", 3.2, 0.08, 0.2, true);
      var capX = W * 0.72, capW = W * 0.16, capH = H * 0.16;
      ctx.fillStyle = tod === "noche" ? "#2a3560" : "#d8cfc0";
      ctx.fillRect(capX - capW / 2, baseY - H * 0.02 - capH, capW, capH);
      ctx.beginPath();
      ctx.moveTo(capX - capW * 0.62, baseY - H * 0.02 - capH);
      ctx.lineTo(capX, baseY - H * 0.02 - capH - H * 0.05);
      ctx.lineTo(capX + capW * 0.62, baseY - H * 0.02 - capH);
      ctx.closePath();
      ctx.fill();
      sea(ctx, W, H, baseY + H * 0.02, tod);
      palms(ctx, W, H, baseY + H * 0.02, 3, "#1e5f3a", 5.5);
    },
    vinales: function (ctx, W, H, tod, baseY) {
      mountains(ctx, W, H, baseY, H * 0.22, tod === "noche" ? "#16224a" : "#3a7a4a", 1.2, true);
      mountains(ctx, W, H, baseY - H * 0.04, H * 0.3, tod === "noche" ? "#101a3e" : "#2a5e3a", 4.7, true);
      ctx.fillStyle = tod === "noche" ? "#0e1836" : "#4a8a3a";
      ctx.fillRect(0, baseY - H * 0.04, W, H * 0.06);
      palms(ctx, W, H, baseY + H * 0.02, 5, "#1e4a2a", 2.2);
      var houseX = W * 0.3, houseY = baseY + H * 0.02;
      ctx.fillStyle = tod === "noche" ? "#2a2038" : "#c9553f";
      ctx.fillRect(houseX, houseY - H * 0.05, W * 0.1, H * 0.05);
      ctx.fillStyle = tod === "noche" ? "#1a1428" : "#7a3226";
      ctx.beginPath();
      ctx.moveTo(houseX - W * 0.012, houseY - H * 0.05);
      ctx.lineTo(houseX + W * 0.05, houseY - H * 0.085);
      ctx.lineTo(houseX + W * 0.112, houseY - H * 0.05);
      ctx.closePath();
      ctx.fill();
    },
    trinidad: function (ctx, W, H, tod, baseY) {
      buildingRow(ctx, W, H, baseY, tod === "noche" ? "#241c40" : "#e0b080", 8.4, 0.06, 0.13, true);
      var towerX = W * 0.2;
      ctx.fillStyle = tod === "noche" ? "#2c2448" : "#e8d5a8";
      ctx.fillRect(towerX, baseY - H * 0.2, W * 0.05, H * 0.2);
      ctx.fillStyle = tod === "noche" ? "#3a3058" : "#b03a3a";
      ctx.beginPath();
      ctx.moveTo(towerX - W * 0.008, baseY - H * 0.2);
      ctx.lineTo(towerX + W * 0.025, baseY - H * 0.25);
      ctx.lineTo(towerX + W * 0.058, baseY - H * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = tod === "noche" ? "#5a5078" : "#8a6a3a";
      ctx.fillRect(0, baseY, W, H * 0.04);
      palms(ctx, W, H, baseY + H * 0.04, 2, "#1e5f3a", 9.1);
    },
    varadero: function (ctx, W, H, tod, baseY) {
      sea(ctx, W, H, baseY - H * 0.06, tod, tod === "noche" ? "rgba(180,200,255,0.2)" : "rgba(255,255,255,0.45)");
      var sandG = ctx.createLinearGradient(0, baseY - H * 0.06, 0, H);
      sandG.addColorStop(0, tod === "noche" ? "#3a3a5e" : "#f7e8c8");
      sandG.addColorStop(1, tod === "noche" ? "#2a2a48" : "#e8d0a0");
      ctx.fillStyle = sandG;
      ctx.fillRect(0, baseY - H * 0.065, W, H);
      palms(ctx, W, H, baseY - H * 0.06, 4, "#1e6f4a", 6.6);
      for (var i = 0; i < 2; i++) {
        var ux = W * (0.3 + i * 0.35), uy = baseY - H * 0.02;
        ctx.strokeStyle = "#8a5a2a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(ux, uy - H * 0.035);
        ctx.stroke();
        ctx.fillStyle = tod === "noche" ? "#3a3a6e" : "#4fd2ff";
        ctx.beginPath();
        ctx.moveTo(ux, uy - H * 0.035);
        ctx.lineTo(ux - W * 0.045, uy - H * 0.028);
        ctx.lineTo(ux, uy - H * 0.022);
        ctx.closePath();
        ctx.fill();
      }
    },
    chichen: function (ctx, W, H, tod, baseY) {
      mountains(ctx, W, H, baseY - H * 0.02, H * 0.1, tod === "noche" ? "#182448" : "#4a7a3a", 2.8, false);
      pyramid(ctx, W * 0.5, baseY - H * 0.02, W * 0.34, H * 0.2,
        tod === "noche" ? "#3a3a5e" : "#c9b088", tod === "noche" ? "#46466a" : "#e0ccA0");
      ctx.fillStyle = tod === "noche" ? "#0e1836" : "#5a8a3a";
      ctx.fillRect(0, baseY - H * 0.02, W, H * 0.04);
      palms(ctx, W, H, baseY + H * 0.02, 3, "#1e5f3a", 3.3);
    },
    cancun: function (ctx, W, H, tod, baseY) {
      buildingRow(ctx, W, H, baseY - H * 0.05, tod === "noche" ? "#1e2a50" : "#d0d8e8", 5.9, 0.1, 0.22, false);
      sea(ctx, W, H, baseY - H * 0.04, tod, "rgba(255,255,255,0.4)");
      var sandG = ctx.createLinearGradient(0, baseY - H * 0.04, 0, H);
      sandG.addColorStop(0, tod === "noche" ? "#3a3a5e" : "#fbeed0");
      sandG.addColorStop(1, tod === "noche" ? "#2a2a48" : "#eed8a8");
      ctx.fillStyle = sandG;
      ctx.fillRect(0, baseY - H * 0.045, W, H);
      palms(ctx, W, H, baseY - H * 0.04, 5, "#1e6f4a", 1.8);
    },
    cdmx: function (ctx, W, H, tod, baseY) {
      mountains(ctx, W, H, baseY - H * 0.02, H * 0.14, tod === "noche" ? "#141e42" : "#5a6a8a", 7.7, true);
      buildingRow(ctx, W, H, baseY, tod === "noche" ? "#1a2448" : "#b8b0c8", 4.4, 0.1, 0.24, false);
      if (tod !== "noche") {
        ctx.fillStyle = "rgba(200,180,160,0.25)";
        ctx.fillRect(0, baseY - H * 0.16, W, H * 0.16);
      }
    },
    oaxaca: function (ctx, W, H, tod, baseY) {
      mountains(ctx, W, H, baseY - H * 0.02, H * 0.12, tod === "noche" ? "#1a2044" : "#8a5a3a", 6.1, false);
      buildingRow(ctx, W, H, baseY, tod === "noche" ? "#2a1e3e" : "#e0a860", 9.9, 0.05, 0.1, true);
      var churchX = W * 0.62;
      ctx.fillStyle = tod === "noche" ? "#3a2e52" : "#e8d0a0";
      ctx.fillRect(churchX, baseY - H * 0.13, W * 0.09, H * 0.13);
      ctx.fillRect(churchX + W * 0.035, baseY - H * 0.17, W * 0.02, H * 0.17);
      ctx.fillStyle = tod === "noche" ? "#4a3e62" : "#c9a050";
      ctx.beginPath();
      ctx.moveTo(churchX + W * 0.03, baseY - H * 0.17);
      ctx.lineTo(churchX + W * 0.045, baseY - H * 0.21);
      ctx.lineTo(churchX + W * 0.06, baseY - H * 0.17);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = tod === "noche" ? "#0e1836" : "#6a9a4a";
      ctx.fillRect(0, baseY, W, H * 0.03);
      for (var i = 0; i < 3; i++) {
        var cx2 = W * (0.15 + i * 0.3);
        ctx.strokeStyle = "#1e5f3a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx2, baseY + H * 0.02);
        ctx.lineTo(cx2, baseY - H * 0.05);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx2, baseY - H * 0.03);
        ctx.lineTo(cx2 - W * 0.02, baseY - H * 0.06);
        ctx.moveTo(cx2, baseY - H * 0.035);
        ctx.lineTo(cx2 + W * 0.02, baseY - H * 0.065);
        ctx.stroke();
      }
    }
  };

  /* Decoraciones por renovaciones compradas (0-4) */
  var renovCountFn = function () { return 0; };
  function setRenovCount(fn) { renovCountFn = fn || renovCountFn; }

  function drawRenoDecor(ctx, W, H, reno, tod, now) {
    if (reno <= 0) return;
    var night = (tod === "noche");
    var baseY = H * 0.72;
    var i, x, y;
    if (reno >= 1) {
      /* guirnalda de luces de colores */
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(40,30,20,0.7)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.16);
      for (x = 0; x <= W; x += 40) ctx.lineTo(x, H * 0.16 + Math.sin(x / W * Math.PI * 3) * 12);
      ctx.stroke();
      var cols = ["#ff5470", "#ffd75e", "#4fd2ff", "#7d3fd1", "#4ade80"];
      for (i = 0; i < Math.ceil(W / 40); i++) {
        x = i * 40 + 20;
        y = H * 0.16 + Math.sin(x / W * Math.PI * 3) * 12 + 8;
        var on = night || Math.sin(now / 400 + i) > -0.3;
        ctx.fillStyle = on ? cols[i % cols.length] : "rgba(120,120,120,0.5)";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 7);
        ctx.fill();
      }
    }
    if (reno >= 2) {
      /* banderas en el pueblo */
      for (i = 0; i < 3; i++) {
        x = W * (0.18 + i * 0.3);
        ctx.strokeStyle = "#d8d8d8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - 90);
        ctx.stroke();
        var wave = Math.sin(now / 300 + i * 2) * 6;
        ctx.fillStyle = i === 1 ? "#ff5470" : (i === 2 ? "#4fd2ff" : "#4ade80");
        ctx.beginPath();
        ctx.moveTo(x, baseY - 90);
        ctx.quadraticCurveTo(x + 22, baseY - 86 + wave, x + 40, baseY - 80 + wave);
        ctx.lineTo(x, baseY - 66);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (reno >= 3) {
      /* arcoiris sutil */
      var rg = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.4);
      rg.addColorStop(0, "rgba(255,105,180,0.10)");
      rg.addColorStop(0.5, "rgba(79,210,255,0.10)");
      rg.addColorStop(1, "rgba(74,222,128,0.10)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.75, H * 0.55, Math.PI, Math.PI * 2);
      ctx.arc(W / 2, H * 0.75, H * 0.42, Math.PI, Math.PI * 2, true);
      ctx.fill();
    }
    if (reno >= 4) {
      /* fuegos artificiales */
      for (i = 0; i < 3; i++) {
        var seed = Math.floor(now / 1600 + i * 2.3);
        var fx2 = W * (0.2 + ((seed * 37 + i * 91) % 60) / 100);
        var fy2 = H * (0.12 + ((seed * 53 + i * 29) % 25) / 100);
        var ft = (now % 1600) / 1600;
        var fa = 1 - ft;
        if (fa <= 0) continue;
        ctx.globalAlpha = fa;
        for (var k = 0; k < 10; k++) {
          var ang = k * Math.PI / 5 + seed;
          var dist = ft * H * 0.09;
          ctx.fillStyle = ["#ffd75e", "#ff5470", "#4fd2ff"][i];
          ctx.beginPath();
          ctx.arc(fx2 + Math.cos(ang) * dist, fy2 + Math.sin(ang) * dist, 2.5, 0, 7);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawScene(ctx, W, H, zoneId, tod) {
    var baseY = H * 0.72;
    var fn = SCENES[zoneId] || SCENES.malecon;
    fn(ctx, W, H, tod, baseY);
    var g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    drawRenoDecor(ctx, W, H, renovCountFn(), tod, Date.now());
  }

  function tick() { time += 16; }

  window.RCScenes = {
    ZONES: ZONES,
    zoneFor: zoneFor,
    nextZone: nextZone,
    timeOfDay: timeOfDay,
    drawSky: drawSky,
    drawScene: drawScene,
    setRenovCount: setRenovCount,
    tick: tick,
    drawSea: sea
  };
})();
