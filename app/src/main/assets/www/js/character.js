/* Reino Cubano — Personaje real (rey/reina/príncipe/princesa) dibujado y animado */
(function () {
  "use strict";

  var DEFAULT = {
    body: "normal",
    hair: "hair",
    beard: "none",
    cloth: "#e63946",
    gender: "m",
    old: false
  };

  /* Dibuja el personaje. pose: idle | dance | sad | celebrate | point
     t: tiempo en ms para animación. scale: alto total aprox en px */
  function draw(ctx, cx, groundY, scale, custom, pose, t) {
    var c = custom || DEFAULT;
    var s = scale / 220;
    var fat = c.body === "fat" ? 1.35 : c.body === "thin" ? 0.75 : 1;
    var isQueen = c.gender === "f";
    var skin = "#e8b48a";
    var skinDark = "#d19a70";
    var cloth = c.cloth || "#e63946";
    var tSec = t / 1000;

    var bob = 0, sway = 0, armR = 0, armL = 0, headTilt = 0;
    if (pose === "dance") {
      bob = Math.sin(tSec * 6) * 6 * s;
      sway = Math.sin(tSec * 6) * 10 * s;
      armL = Math.sin(tSec * 6) * 0.9;
      armR = -Math.sin(tSec * 6) * 0.9;
      headTilt = Math.sin(tSec * 6) * 0.12;
    } else if (pose === "celebrate") {
      bob = Math.abs(Math.sin(tSec * 4)) * -10 * s;
      armL = -2.2 + Math.sin(tSec * 8) * 0.2;
      armR = 2.2 - Math.sin(tSec * 8) * 0.2;
    } else if (pose === "sad") {
      bob = 3 * s;
      headTilt = 0.25;
      armL = 0.15; armR = -0.15;
    } else if (pose === "point") {
      armR = -1.5;
      sway = Math.sin(tSec * 2) * 3 * s;
    } else {
      bob = Math.sin(tSec * 2) * 2.5 * s;
      sway = Math.sin(tSec * 2) * 3 * s;
      armL = Math.sin(tSec * 2) * 0.1;
      armR = -Math.sin(tSec * 2) * 0.1;
    }

    ctx.save();
    ctx.translate(cx + sway, groundY + bob);
    ctx.scale(s, s);
    ctx.rotate(headTilt * 0.15);

    /* sombra */
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 4 - bob / s, 46 * fat, 10, 0, 0, 7);
    ctx.fill();

    var bodyW = 62 * fat, bodyH = 74;
    var headR = 26;
    var headY = -bodyH - headR - 8;

    /* piernas */
    ctx.strokeStyle = "#2a2a3e";
    ctx.lineWidth = 13;
    ctx.lineCap = "round";
    var legSpread = 14 * (fat > 1 ? 1.4 : 1);
    var legSwing = pose === "dance" ? Math.sin(tSec * 6) * 8 : 0;
    ctx.beginPath();
    ctx.moveTo(-legSpread, -bodyH * 0.28);
    ctx.lineTo(-legSpread + legSwing, -2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legSpread, -bodyH * 0.28);
    ctx.lineTo(legSpread - legSwing, -2);
    ctx.stroke();
    /* zapatos */
    ctx.fillStyle = "#1a1a28";
    ctx.beginPath(); ctx.ellipse(-legSpread + legSwing, 0, 11, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(legSpread - legSwing, 0, 11, 5, 0, 0, 7); ctx.fill();

    /* cuerpo: abrigo real */
    var coatG = ctx.createLinearGradient(-bodyW / 2, -bodyH, bodyW / 2, 0);
    coatG.addColorStop(0, cloth);
    coatG.addColorStop(1, shade(cloth, -35));
    ctx.fillStyle = coatG;
    if (isQueen) {
      /* vestido */
      ctx.beginPath();
      ctx.moveTo(-bodyW * 0.42, -bodyH);
      ctx.quadraticCurveTo(-bodyW * 0.95, -bodyH * 0.4, -bodyW * 0.72, 0);
      ctx.lineTo(bodyW * 0.72, 0);
      ctx.quadraticCurveTo(bodyW * 0.95, -bodyH * 0.4, bodyW * 0.42, -bodyH);
      ctx.closePath();
      ctx.fill();
    } else {
      roundRect(ctx, -bodyW / 2, -bodyH, bodyW, bodyH, 16);
      ctx.fill();
      /* solapas */
      ctx.fillStyle = shade(cloth, -50);
      ctx.beginPath();
      ctx.moveTo(-8, -bodyH);
      ctx.lineTo(8, -bodyH);
      ctx.lineTo(0, -bodyH * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    /* cinturón/faja dorada */
    ctx.fillStyle = "#d4a017";
    ctx.fillRect(-bodyW / 2, -bodyH * 0.42, bodyW, 9);

    /* brazos */
    ctx.strokeStyle = cloth;
    ctx.lineWidth = 11;
    var shY = -bodyH * 0.85;
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2 + 4, shY);
    var lhx = -bodyW / 2 - 16 + Math.sin(armL) * 6;
    var lhy = shY + 32 + armL * 26;
    ctx.quadraticCurveTo(-bodyW / 2 - 10, shY + 16, lhx, lhy);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(lhx, lhy, 7, 0, 7); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bodyW / 2 - 4, shY);
    var rhx = bodyW / 2 + 16 - Math.sin(armR) * 6;
    var rhy = shY + 32 + armR * 26;
    ctx.quadraticCurveTo(bodyW / 2 + 10, shY + 16, rhx, rhy);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(rhx, rhy, 7, 0, 7); ctx.fill();

    /* bastón (rey) */
    if (!isQueen && pose !== "celebrate") {
      ctx.strokeStyle = "#8a5a2a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(rhx, rhy);
      ctx.lineTo(rhx + 4, rhy + 26);
      ctx.stroke();
      ctx.fillStyle = "#d4a017";
      ctx.beginPath(); ctx.arc(rhx + 4, rhy + 26, 5, 0, 7); ctx.fill();
    }

    /* cabeza */
    ctx.save();
    ctx.translate(0, headY);
    ctx.rotate(headTilt);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, 7);
    ctx.fill();
    /* orejas */
    ctx.beginPath(); ctx.arc(-headR + 2, 2, 5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(headR - 2, 2, 5, 0, 7); ctx.fill();

    /* pelo */
    if (c.hair === "afro") {
      ctx.fillStyle = "#2a1a10";
      ctx.beginPath();
      ctx.arc(0, -6, headR * 1.12, Math.PI, 0);
      ctx.fill();
      ctx.beginPath(); ctx.arc(-headR * 0.85, -headR * 0.4, headR * 0.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(headR * 0.85, -headR * 0.4, headR * 0.4, 0, 7); ctx.fill();
    } else if (c.hair !== "bald") {
      ctx.fillStyle = c.old ? "#d8d8d8" : "#3a2a1a";
      ctx.beginPath();
      ctx.arc(0, -4, headR, Math.PI * 1.02, Math.PI * 1.98);
      ctx.fill();
      if (isQueen) {
        /* melena */
        ctx.beginPath();
        ctx.moveTo(-headR, -6);
        ctx.quadraticCurveTo(-headR - 14, 14, -headR - 6, 34);
        ctx.lineTo(headR + 6, 34);
        ctx.quadraticCurveTo(headR + 14, 14, headR, -6);
        ctx.closePath();
        ctx.fill();
      }
    }

    /* ojos */
    var eyeY = -2;
    if (pose === "sad") {
      ctx.strokeStyle = "#3a2a1a";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(-9, eyeY + 2, 4.5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(9, eyeY + 2, 4.5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(-9, eyeY, 4.5, 5.5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(9, eyeY, 4.5, 5.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#2a1a10";
      var px = pose === "point" ? 1.5 : 0;
      ctx.beginPath(); ctx.arc(-9 + px, eyeY + 1, 2.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(9 + px, eyeY + 1, 2.2, 0, 7); ctx.fill();
    }
    /* cejas */
    ctx.strokeStyle = "#3a2a1a";
    ctx.lineWidth = 2.5;
    var browY = pose === "sad" ? -8 : -11;
    ctx.beginPath(); ctx.moveTo(-14, browY + (pose === "sad" ? 2 : 0)); ctx.lineTo(-4, browY - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, browY - 1); ctx.lineTo(14, browY + (pose === "sad" ? 2 : 0)); ctx.stroke();

    /* nariz y boca */
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 5, 3, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    ctx.strokeStyle = "#a05a3a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (pose === "sad") ctx.arc(0, 16, 5, Math.PI * 1.15, Math.PI * 1.85);
    else if (pose === "dance" || pose === "celebrate") ctx.arc(0, 9, 6, 0.15, Math.PI - 0.15);
    else ctx.arc(0, 10, 5, 0.25, Math.PI - 0.25);
    ctx.stroke();

    /* barba / bigote */
    if (c.beard === "beard") {
      ctx.fillStyle = c.old ? "#c8c8c8" : "#3a2a1a";
      ctx.beginPath();
      ctx.arc(0, 10, headR * 0.72, 0.3, Math.PI - 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (c.beard === "mustache") {
      ctx.strokeStyle = c.old ? "#c8c8c8" : "#3a2a1a";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-9, 10);
      ctx.quadraticCurveTo(-4, 7, 0, 10);
      ctx.quadraticCurveTo(4, 7, 9, 10);
      ctx.stroke();
    }

    /* corona / tiara */
    if (isQueen) {
      ctx.fillStyle = "#ffd75e";
      ctx.beginPath();
      ctx.moveTo(-headR * 0.75, -headR * 0.72);
      ctx.lineTo(-headR * 0.4, -headR * 1.05);
      ctx.lineTo(0, -headR * 0.8);
      ctx.lineTo(headR * 0.4, -headR * 1.05);
      ctx.lineTo(headR * 0.75, -headR * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e63946";
      ctx.beginPath(); ctx.arc(0, -headR * 0.88, 2.6, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = "#ffd75e";
      var cw = headR * 0.95, cy = -headR * 0.78;
      ctx.beginPath();
      ctx.moveTo(-cw, cy + 8);
      ctx.lineTo(-cw, cy - 4);
      ctx.lineTo(-cw * 0.5, cy + 2);
      ctx.lineTo(0, cy - 10);
      ctx.lineTo(cw * 0.5, cy + 2);
      ctx.lineTo(cw, cy - 4);
      ctx.lineTo(cw, cy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e63946";
      ctx.beginPath(); ctx.arc(0, cy + 3, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = "#4fd2ff";
      ctx.beginPath(); ctx.arc(-cw * 0.55, cy + 3, 2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cw * 0.55, cy + 3, 2, 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, (n >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
    var b = Math.min(255, Math.max(0, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function roleFor(age, gender) {
    if (age < 18) return gender === "f" ? "Princesa" : "Príncipe";
    if (age >= 60) return gender === "f" ? "Reina Vieja" : "Rey Viejo";
    return gender === "f" ? "Reina" : "Rey";
  }

  window.RCChar = {
    draw: draw,
    roleFor: roleFor,
    DEFAULT: DEFAULT
  };
})();
