/* Reino Cubano — Motor match-3: fichas, cascadas, power-ups, combos y boosters */
(function () {
  "use strict";

  var ROWS = 8, COLS = 7;
  var board = null;
  var cb = {};
  var PU = { ROCKET_H: "rocketH", ROCKET_V: "rocketV", TNT: "tnt", BALL: "ball", PROP: "prop" };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function rndType(max) { return Math.floor(Math.random() * max); }

  /* ---------- Creación ---------- */
  function makeTile(type) {
    return { id: Math.random(), type: type, pu: null, frozen: 0, x: 0, y: 0, scale: 1, born: 0 };
  }
  function makeBox(layers) {
    var t = makeTile(-1);
    t.box = layers;
    return t;
  }

  function start(level, preBooster, callbacks) {
    cb = callbacks || {};
    var mask = RCLevels.shapeMask(level.shape || "full");
    board = {
      cfg: level,
      mask: mask,
      grid: [],
      lock: false,
      over: false,
      selected: null,
      armed: null,
      shake: 0,
      idle: 0,
      hint: null,
      hintTimer: 0,
      particles: [],
      score: 0,
      cascade: 0,
      boardX: 0, boardY: 0, cell: 0,
      flash: 0
    };
    var g = [];
    for (var r = 0; r < ROWS; r++) {
      g.push([]);
      for (var c = 0; c < COLS; c++) {
        if (!mask[r][c]) { g[r].push(null); continue; }
        var t;
        do { t = makeTile(rndType(level.types)); } while (createsMatch(g, r, c, t.type));
        g[r].push(t);
      }
    }
    /* Obstáculos */
    var spots = [];
    for (var r2 = 2; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) if (mask[r2][c2]) spots.push([r2, c2]);
    shuffle(spots);
    var si = 0;
    for (var b = 0; b < level.boxes && si < spots.length; b++, si++) {
      g[spots[si][0]][spots[si][1]] = makeBox(1);
    }
    for (var ic = 0; ic < level.ice && si < spots.length; ic++, si++) {
      var it = g[spots[si][0]][spots[si][1]];
      if (it.type >= 0) it.frozen = 1;
    }
    board.grid = g;
    layout();

    if (preBooster) {
      for (var k = 0; k < 3; k++) {
        var rr = Math.floor(Math.random() * ROWS), cc = Math.floor(Math.random() * COLS);
        var pt = g[rr][cc];
        if (pt && pt.type >= 0 && !pt.pu) { pt.pu = preBooster; break; }
      }
    }
    cb.onMoves && cb.onMoves(level.moves);
    cb.onObjectives && cb.onObjectives(level.objectives);
  }

  function createsMatch(g, r, c, type) {
    if (c >= 2 && g[r][c - 1] && g[r][c - 2] && g[r][c - 1].type === type && g[r][c - 2].type === type) return true;
    if (r >= 2 && g[r - 1][c] && g[r - 2][c] && g[r - 1][c].type === type && g[r - 2][c].type === type) return true;
    return false;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
  }

  function layout() {
    if (!board) return;
    var W = window.innerWidth, H = window.innerHeight;
    var topPad = 90, botPad = 92;
    var availW = W - 16, availH = H - topPad - botPad;
    var cell = Math.min(availW / COLS, availH / ROWS);
    board.cell = cell;
    board.boardX = (W - cell * COLS) / 2;
    board.boardY = topPad + (availH - cell * ROWS) / 2;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var t = board.grid[r][c];
      if (t) { t.x = px(c); t.y = py(r); }
    }
  }

  function px(c) { return board.boardX + c * board.cell; }
  function py(r) { return board.boardY + r * board.cell; }

  /* ---------- Búsqueda de jugadas ---------- */
  function findMatches(grid) {
    var matches = [];
    for (var r = 0; r < ROWS; r++) {
      var run = 1;
      for (var c = 1; c <= COLS; c++) {
        var cur = c < COLS ? grid[r][c] : null;
        var prev = grid[r][c - 1];
        if (cur && prev && cur.type >= 0 && cur.type === prev.type) run++;
        else {
          if (run >= 3 && prev && prev.type >= 0) {
            var cells = [];
            for (var k = c - run; k < c; k++) cells.push({ r: r, c: k });
            matches.push({ cells: cells, type: prev.type, len: run, horiz: true });
          }
          run = 1;
        }
      }
    }
    for (var c3 = 0; c3 < COLS; c3++) {
      var run2 = 1;
      for (var r3 = 1; r3 <= ROWS; r3++) {
        var cur2 = r3 < ROWS ? grid[r3][c3] : null;
        var prev2 = grid[r3 - 1][c3];
        if (cur2 && prev2 && cur2.type >= 0 && cur2.type === prev2.type) run2++;
        else {
          if (run2 >= 3 && prev2 && prev2.type >= 0) {
            var cells2 = [];
            for (var k2 = r3 - run2; k2 < r3; k2++) cells2.push({ r: k2, c: c3 });
            matches.push({ cells: cells2, type: prev2.type, len: run2, horiz: false });
          }
          run2 = 1;
        }
      }
    }
    return matches;
  }

  function findSquares(grid) {
    var out = [];
    for (var r = 0; r < ROWS - 1; r++) for (var c = 0; c < COLS - 1; c++) {
      var t = grid[r][c];
      if (t && t.type >= 0 && grid[r][c + 1] && grid[r + 1][c] && grid[r + 1][c + 1] &&
          grid[r][c + 1].type === t.type && grid[r + 1][c].type === t.type && grid[r + 1][c + 1].type === t.type) {
        var already = out.some(function (s) {
          return s.cells.some(function (cell) { return Math.abs(cell.r - r) <= 1 && Math.abs(cell.c - c) <= 1; });
        });
        if (!already) out.push({ cells: [{ r: r, c: c }, { r: r, c: c + 1 }, { r: r + 1, c: c }, { r: r + 1, c: c + 1 }], type: t.type, square: true });
      }
    }
    return out;
  }

  function hasValidMove() {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var t = board.grid[r][c];
      if (t && t.pu) return true;
      if (c < COLS - 1 && trySwapMatch(r, c, r, c + 1)) return true;
      if (r < ROWS - 1 && trySwapMatch(r, c, r + 1, c)) return true;
    }
    return false;
  }

  function trySwapMatch(r1, c1, r2, c2) {
    var a = board.grid[r1][c1], b = board.grid[r2][c2];
    if (!a || !b || a.type < 0 || b.type < 0 || a.frozen || b.frozen) return false;
    board.grid[r1][c1] = b; board.grid[r2][c2] = a;
    var m = findMatches(board.grid);
    board.grid[r1][c1] = a; board.grid[r2][c2] = b;
    return m.length > 0;
  }

  function getHint() {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var t = board.grid[r][c];
      if (t && t.pu) return [{ r: r, c: c }];
      if (c < COLS - 1 && trySwapMatch(r, c, r, c + 1)) return [{ r: r, c: c }, { r: r, c: c + 1 }];
      if (r < ROWS - 1 && trySwapMatch(r, c, r + 1, c)) return [{ r: r, c: c }, { r: r + 1, c: c }];
    }
    return null;
  }

  /* ---------- Resolución ---------- */
  async function resolveBoard(swapCell) {
    var cascade = 0;
    while (true) {
      var matches = findMatches(board.grid).concat(findSquares(board.grid));
      if (!matches.length) break;
      cascade++;
      board.cascade = cascade;
      var cleared = {};
      var spawnPU = null, spawnAt = null, matchType = null;

      /* decidir power-up a crear */
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        if (m.square && !spawnPU) { spawnPU = PU.PROP; spawnAt = m.cells[1]; }
      }
      for (var j = 0; j < matches.length; j++) {
        var mm = matches[j];
        if (mm.square) continue;
        matchType = mm.type;
        if (mm.len >= 5 && !spawnPU) { spawnPU = PU.BALL; spawnAt = mm.cells[2]; }
        else if (mm.len === 4 && !spawnPU) {
          spawnPU = mm.horiz ? PU.ROCKET_H : PU.ROCKET_V;
          spawnAt = (swapCell && inCells(mm.cells, swapCell)) ? swapCell : mm.cells[1];
        }
      }
      /* L/T → TNT: celda compartida entre match horizontal y vertical */
      if (!spawnPU) {
        outer:
        for (var a = 0; a < matches.length; a++) {
          if (matches[a].square) continue;
          for (var b2 = 0; b2 < matches.length; b2++) {
            if (b2 === a || matches[b2].square) continue;
            if (matches[a].horiz !== matches[b2].horiz) {
              for (var x = 0; x < matches[a].cells.length; x++) {
                for (var y = 0; y < matches[b2].cells.length; y++) {
                  if (matches[a].cells[x].r === matches[b2].cells[y].r && matches[a].cells[x].c === matches[b2].cells[y].c) {
                    spawnPU = PU.TNT;
                    spawnAt = matches[a].cells[x];
                    break outer;
                  }
                }
              }
            }
          }
        }
      }

      var allCells = {};
      for (var m2 = 0; m2 < matches.length; m2++) {
        for (var cc = 0; cc < matches[m2].cells.length; cc++) {
          var cell = matches[m2].cells[cc];
          allCells[cell.r + "," + cell.c] = cell;
        }
      }

      var keys = Object.keys(allCells);
      var mult = cascade;
      var popped = 0;
      for (var k = 0; k < keys.length; k++) {
        var pos = allCells[keys[k]];
        popped += await clearCell(pos.r, pos.c, mult, true);
      }

      if (spawnPU && spawnAt) {
        var st = board.grid[spawnAt.r][spawnAt.c];
        if (!st || st.type < 0) {
          var nt = makeTile(matchType != null ? matchType : rndType(board.cfg.types));
          nt.x = px(spawnAt.c);
          nt.y = py(spawnAt.r);
          board.grid[spawnAt.r][spawnAt.c] = nt;
          st = nt;
        }
        st.pu = spawnPU;
        burst(px(spawnAt.c) + board.cell / 2, py(spawnAt.r) + board.cell / 2, "#ffffff", 14);
        RCAudio.sfx("star", 1);
      }

      if (popped > 0) {
        board.score += popped * 30 * mult;
        updateScoreObjective();
        cb.onScore && cb.onScore(board.score);
        if (cascade > 1) {
          cb.floatText && cb.floatText("¡COMBO x" + cascade + "! 🔥");
          board.shake = Math.min(10, cascade * 3);
        }
      }

      await applyGravity();
      await sleep(120);
      swapCell = null;
    }
    board.cascade = 0;
  }

  function updateScoreObjective() {
    var objs = board.cfg.objectives;
    for (var i = 0; i < objs.length; i++) {
      if (objs[i].kind === "score") {
        var before = objs[i].got;
        objs[i].got = Math.min(objs[i].need, board.score);
        if (objs[i].got > before && cb.onObjective) cb.onObjective("score", objs[i].got - before);
      }
    }
  }

  function inCells(cells, p) {
    for (var i = 0; i < cells.length; i++) if (cells[i].r === p.r && cells[i].c === p.c) return true;
    return false;
  }

  /* Limpia una celda; devuelve 1 si se rompió algo */
  async function clearCell(r, c, mult, fromMatch) {
    var t = board.grid[r][c];
    if (!t) return 0;
    if (t.box) {
      t.box--;
      burst(px(c) + board.cell / 2, py(r) + board.cell / 2, "#a06a3a", 8);
      RCAudio.sfx("hammer");
      if (t.box <= 0) { board.grid[r][c] = null; cb.onObjective && cb.onObjective("box", 1); }
      return 1;
    }
    if (t.frozen > 0) {
      t.frozen--;
      burst(px(c) + board.cell / 2, py(r) + board.cell / 2, "#a8e8ff", 8);
      RCAudio.sfx("pop");
      cb.onObjective && cb.onObjective("ice", 1);
      return 1;
    }
    if (t.pu) { activatePU(r, c, t.pu, t.type); return 1; }
    burst(px(c) + board.cell / 2, py(r) + board.cell / 2, RCLevels.TILE_COLORS[t.type], 10);
    RCAudio.sfx("match", mult);
    cb.onObjective && cb.onObjective("collect", 1, t.type);
    board.grid[r][c] = null;
    return 1;
  }

  /* ---------- Power-ups ---------- */
  function cellsForPU(r, c, pu) {
    var out = [];
    if (pu === PU.ROCKET_H) { for (var i = 0; i < COLS; i++) out.push({ r: r, c: i }); }
    else if (pu === PU.ROCKET_V) { for (var j = 0; j < ROWS; j++) out.push({ r: j, c: c }); }
    else if (pu === PU.TNT) {
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
        if (Math.abs(dr) + Math.abs(dc) <= 3) {
          var nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push({ r: nr, c: nc });
        }
      }
    }
    return out;
  }

  function activatePU(r, c, pu, colorType) {
    var cx2 = px(c) + board.cell / 2, cy2 = py(r) + board.cell / 2;
    if (pu === PU.ROCKET_H || pu === PU.ROCKET_V) {
      RCAudio.sfx("rocket");
      board.shake = 5;
      var cells = cellsForPU(r, c, pu);
      for (var i = 0; i < cells.length; i++) {
        (function (cell, delay) {
          setTimeout(function () {
            burst(px(cell.c) + board.cell / 2, py(cell.r) + board.cell / 2, "#ffd75e", 6);
            smashCell(cell.r, cell.c);
          }, delay);
        })(cells[i], Math.abs(i - (pu === PU.ROCKET_H ? c : r)) * 30);
      }
    } else if (pu === PU.TNT) {
      RCAudio.sfx("tnt");
      board.shake = 12;
      board.flash = 1;
      var cells2 = cellsForPU(r, c, pu);
      for (var j = 0; j < cells2.length; j++) smashCell(cells2[j].r, cells2[j].c);
      burst(cx2, cy2, "#ff9a3c", 26);
    } else if (pu === PU.BALL) {
      RCAudio.sfx("ball");
      board.shake = 8;
      var target = colorType != null ? colorType : rndType(board.cfg.types);
      for (var rr = 0; rr < ROWS; rr++) for (var cc = 0; cc < COLS; cc++) {
        var t = board.grid[rr][cc];
        if (t && t.type === target && !t.box) {
          burst(px(cc) + board.cell / 2, py(rr) + board.cell / 2, RCLevels.TILE_COLORS[target], 5);
          smashCell(rr, cc);
        }
      }
      burst(cx2, cy2, "#ffffff", 20);
    } else if (pu === PU.PROP) {
      RCAudio.sfx("prop");
      var target2 = randomObjectiveCell() || { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) };
      board.propFly = { x: cx2, y: cy2, tx: px(target2.c) + board.cell / 2, ty: py(target2.r) + board.cell / 2, t: 0 };
      setTimeout(function () {
        RCAudio.sfx("tnt");
        board.shake = 8;
        for (var dr2 = -1; dr2 <= 1; dr2++) for (var dc2 = -1; dc2 <= 1; dc2++) {
          smashCell(target2.r + dr2, target2.c + dc2);
        }
        burst(px(target2.c) + board.cell / 2, py(target2.r) + board.cell / 2, "#4fd2ff", 16);
      }, 450);
    }
    board.grid[r][c] = null;
    cb.onObjective && cb.onObjective("collect", 0);
  }

  function randomObjectiveCell() {
    var objs = board.cfg.objectives;
    var collect = objs.filter(function (o) { return o.kind === "collect" && o.got < o.need; });
    if (!collect.length) return null;
    var type = collect[0].type;
    for (var tries = 0; tries < 40; tries++) {
      var r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      var t = board.grid[r][c];
      if (t && t.type === type) return { r: r, c: c };
    }
    return null;
  }

  /* Rompe una celda inmediatamente (para power-ups/boosters), respetando capas */
  function smashCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    var t = board.grid[r][c];
    if (!t) return;
    if (t.box) {
      t.box--;
      burst(px(c) + board.cell / 2, py(r) + board.cell / 2, "#a06a3a", 6);
      if (t.box <= 0) { board.grid[r][c] = null; cb.onObjective && cb.onObjective("box", 1); }
      return;
    }
    if (t.frozen > 0) {
      t.frozen--;
      burst(px(c) + board.cell / 2, py(r) + board.cell / 2, "#a8e8ff", 6);
      cb.onObjective && cb.onObjective("ice", 1);
      return;
    }
    if (t.type >= 0) {
      burst(px(c) + board.cell / 2, py(r) + board.cell / 2, RCLevels.TILE_COLORS[t.type], 6);
      cb.onObjective && cb.onObjective("collect", 1, t.type);
      board.grid[r][c] = null;
    }
  }

  /* ---------- Combos de power-ups ---------- */
  async function comboSwap(a, b) {
    var ra = a.r, ca = a.c, rb = b.r, cb2 = b.c;
    var ta = board.grid[ra][ca], tb = board.grid[rb][cb2];
    var pa = ta.pu, pb = tb.pu;
    board.grid[ra][ca] = null; board.grid[rb][cb2] = null;
    board.shake = 14;
    board.flash = 1;
    cb.floatText && cb.floatText("¡COMBO ÉPICO! ✨");

    var isR = function (p) { return p === PU.ROCKET_H || p === PU.ROCKET_V; };

    if (pa === PU.BALL && pb === PU.BALL) {
      RCAudio.sfx("ball");
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) smashCell(r, c);
    } else if (pa === PU.BALL || pb === PU.BALL) {
      var ball = pa === PU.BALL ? ta : tb;
      var other = pa === PU.BALL ? pb : pa;
      RCAudio.sfx("ball");
      if (other === PU.TNT) {
        for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) {
          var t2 = board.grid[r2][c2];
          if (t2 && t2.type === ball.type) {
            for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) smashCell(r2 + dr, c2 + dc);
          }
        }
      } else {
        for (var r3 = 0; r3 < ROWS; r3++) for (var c3 = 0; c3 < COLS; c3++) {
          var t3 = board.grid[r3][c3];
          if (t3 && t3.type === ball.type) {
            if (isR(other)) {
              for (var i = 0; i < COLS; i++) smashCell(r3, i);
              for (var j = 0; j < ROWS; j++) smashCell(j, c3);
            } else smashCell(r3, c3);
          }
        }
      }
    } else if (isR(pa) && isR(pb)) {
      RCAudio.sfx("rocket");
      for (var i2 = 0; i2 < COLS; i2++) smashCell(rb, i2);
      for (var j2 = 0; j2 < ROWS; j2++) smashCell(j2, ca);
    } else if ((isR(pa) && pb === PU.TNT) || (pa === PU.TNT && isR(pb))) {
      RCAudio.sfx("tnt");
      for (var d = -1; d <= 1; d++) {
        for (var i3 = 0; i3 < COLS; i3++) smashCell(rb + d, i3);
        for (var j3 = 0; j3 < ROWS; j3++) smashCell(j3, ca + d);
      }
    } else if (pa === PU.TNT && pb === PU.TNT) {
      RCAudio.sfx("tnt");
      board.flash = 2;
      for (var dr2 = -2; dr2 <= 2; dr2++) for (var dc2 = -2; dc2 <= 2; dc2++) {
        smashCell(rb + dr2, ca + dc2);
        smashCell(ra + dr2, cb2 + dc2);
      }
    } else {
      /* Prop + anything o fallback */
      RCAudio.sfx("tnt");
      for (var dr3 = -2; dr3 <= 2; dr3++) for (var dc3 = -2; dc3 <= 2; dc3++) {
        if (Math.abs(dr3) + Math.abs(dc3) <= 3) { smashCell(rb + dr3, cb2 + dc3); smashCell(ra + dr3, ca + dc3); }
      }
    }
    burst(px(ca) + board.cell / 2, py(ra) + board.cell / 2, "#ffffff", 30);
    burst(px(cb2) + board.cell / 2, py(rb) + board.cell / 2, "#ffd75e", 30);
    await applyGravity();
    await resolveBoard(null);
  }

  /* ---------- Gravedad (respeta las formas del tablero) ---------- */
  async function applyGravity() {
    var fell = false;
    for (var c = 0; c < COLS; c++) {
      var tiles = [], slots = [];
      for (var r = ROWS - 1; r >= 0; r--) {
        if (!board.mask[r][c]) continue;
        slots.push(r);
        if (board.grid[r][c]) { tiles.push({ t: board.grid[r][c], from: r }); board.grid[r][c] = null; }
      }
      for (var s = 0; s < slots.length; s++) {
        var target = slots[s];
        if (s < tiles.length) {
          var pair = tiles[s];
          board.grid[target][c] = pair.t;
          if (pair.from !== target) { pair.t.y = py(target); fell = true; }
        } else {
          var nt = makeTile(rndType(board.cfg.types));
          nt.x = px(c);
          nt.y = py(target) - (slots.length - s + 1) * board.cell;
          board.grid[target][c] = nt;
          fell = true;
        }
      }
    }
    if (fell) {
      RCAudio.sfx("swap");
      await sleep(300);
    }
  }

  /* ---------- Input ---------- */
  function cellAt(x, y) {
    var c = Math.floor((x - board.boardX) / board.cell);
    var r = Math.floor((y - board.boardY) / board.cell);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    if (!board.mask[r][c]) return null;
    return { r: r, c: c };
  }

  async function handleTap(x, y) {
    if (!board || board.lock || board.over) return;
    board.idle = 0;
    board.hint = null;
    var pos = cellAt(x, y);
    if (!pos) return;
    var t = board.grid[pos.r][pos.c];
    if (!t) return;

    /* Booster armado */
    if (board.armed) {
      await useBooster(board.armed, pos);
      return;
    }

    if (t.pu) {
      board.lock = true;
      var col = t.type;
      board.grid[pos.r][pos.c] = null;
      activatePU(pos.r, pos.c, t.pu, col);
      await applyGravity();
      await resolveBoard(null);
      afterMove();
      return;
    }

    if (board.selected) {
      var s = board.selected;
      if (s.r === pos.r && s.c === pos.c) { board.selected = null; return; }
      if (Math.abs(s.r - pos.r) + Math.abs(s.c - pos.c) === 1) {
        board.selected = null;
        await trySwap(s, pos);
      } else {
        board.selected = pos;
        RCAudio.sfx("swap");
      }
    } else {
      board.selected = pos;
      RCAudio.sfx("swap");
    }
  }

  async function trySwap(a, b) {
    var ta = board.grid[a.r][a.c], tb = board.grid[b.r][b.c];
    if (!ta || !tb || ta.type < 0 || tb.type < 0 || ta.frozen || tb.frozen) {
      RCAudio.sfx("bad");
      return;
    }
    board.lock = true;
    var tmpY = ta.y; ta.y = tb.y; tb.y = tmpY;
    var tmpX = ta.x; ta.x = tb.x; tb.x = tmpX;
    board.grid[a.r][a.c] = tb; board.grid[b.r][b.c] = ta;
    RCAudio.sfx("swap");
    await sleep(180);

    /* ¿combo de power-ups? */
    if (ta.pu && tb.pu) {
      board.cfg.moves--; cb.onMoves && cb.onMoves(board.cfg.moves);
      await comboSwap(b, a);
      afterMove();
      return;
    }
    /* bola + ficha normal → limpia ese color */
    if ((ta.pu === PU.BALL && !tb.pu) || (tb.pu === PU.BALL && !ta.pu)) {
      var ballPos = ta.pu === PU.BALL ? a : b;
      var colorTile = ta.pu === PU.BALL ? tb : ta;
      board.cfg.moves--; cb.onMoves && cb.onMoves(board.cfg.moves);
      board.lock = true;
      RCAudio.sfx("ball");
      board.grid[ballPos.r][ballPos.c] = null;
      activatePU(ballPos.r, ballPos.c, PU.BALL, colorTile.type);
      await applyGravity();
      await resolveBoard(null);
      afterMove();
      return;
    }

    var matches = findMatches(board.grid);
    var squares = findSquares(board.grid);
    if (!matches.length && !squares.length) {
      var tmpY2 = ta.y; ta.y = tb.y; tb.y = tmpY2;
      var tmpX2 = ta.x; ta.x = tb.x; tb.x = tmpX2;
      board.grid[a.r][a.c] = ta; board.grid[b.r][b.c] = tb;
      RCAudio.sfx("bad");
      board.lock = false;
      return;
    }
    board.cfg.moves--; cb.onMoves && cb.onMoves(board.cfg.moves);
    await resolveBoard(b);
    afterMove();
  }

  function afterMove() {
    board.lock = false;
    board.idle = 0;
    checkState();
  }

  function checkState() {
    if (board.over) return;
    var objs = board.cfg.objectives;
    var allDone = true;
    for (var i = 0; i < objs.length; i++) if (objs[i].got < objs[i].need) allDone = false;
    if (allDone) {
      board.over = true;
      cb.onWin && cb.onWin(board.score);
      return;
    }
    if (board.cfg.moves <= 0) {
      board.over = true;
      cb.onLose && cb.onLose(board.score);
    }
  }

  /* ---------- Boosters en-juego ---------- */
  function armBooster(name) {
    if (!board) return false;
    board.armed = (board.armed === name) ? null : name;
    board.selected = null;
    return board.armed === name;
  }

  async function useBooster(name, pos) {
    board.armed = null;
    board.lock = true;
    var r = pos.r, c = pos.c;
    if (name === "hammer") {
      RCAudio.sfx("hammer");
      board.hammerAnim = { x: px(c) + board.cell / 2, y: -80, ty: py(r) + board.cell / 2, t: 0 };
      board.shake = 8;
      await sleep(280);
      smashCell(r, c);
      burst(px(c) + board.cell / 2, py(r) + board.cell / 2, "#a06a3a", 14);
      await applyGravity();
      await resolveBoard(null);
    } else if (name === "arrow") {
      RCAudio.sfx("arrow");
      board.arrowAnim = { r: r, t: 0 };
      board.shake = 6;
      await sleep(200);
      for (var i = 0; i < COLS; i++) smashCell(r, i);
      await applyGravity();
      await resolveBoard(null);
    } else if (name === "cannon") {
      RCAudio.sfx("cannon");
      board.shake = 8;
      board.flash = 1;
      for (var j = 0; j < ROWS; j++) smashCell(j, c);
      await applyGravity();
      await resolveBoard(null);
    } else if (name === "hat") {
      RCAudio.sfx("hat");
      board.spin = 1;
      await sleep(500);
      var types = [];
      for (var rr = 0; rr < ROWS; rr++) for (var cc = 0; cc < COLS; cc++) {
        var t = board.grid[rr][cc];
        if (t && t.type >= 0 && !t.pu) types.push(t.type);
      }
      var guard = 0;
      do {
        shuffle(types);
        var k = 0;
        for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) {
          var t2 = board.grid[r2][c2];
          if (t2 && t2.type >= 0 && !t2.pu) t2.type = types[k++];
        }
        guard++;
      } while (guard < 60 && (findMatches(board.grid).length > 0 || !hasValidMove()));
      board.spin = 0;
    }
    board.lock = false;
    board.idle = 0;
    checkState();
  }

  function consumeBooster(name) {
    cb.onBoosterUsed && cb.onBoosterUsed(name);
  }

  /* ---------- Partículas ---------- */
  function burst(x, y, color, n) {
    for (var i = 0; i < (n || 8); i++) {
      var a = Math.random() * Math.PI * 2;
      var v = 2 + Math.random() * 4;
      board.particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, color: color, r: 2 + Math.random() * 3 });
    }
  }

  /* ---------- Update & Draw ---------- */
  function update(dt) {
    if (!board) return;
    board.shake *= 0.88;
    board.flash *= 0.92;
    for (var i = board.particles.length - 1; i >= 0; i--) {
      var p = board.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.18;
      p.life -= 0.03;
      if (p.life <= 0) board.particles.splice(i, 1);
    }
    if (board.propFly) {
      board.propFly.t += 0.08;
      if (board.propFly.t >= 1) board.propFly = null;
    }
    if (board.hammerAnim) {
      board.hammerAnim.t += 0.15;
      if (board.hammerAnim.t >= 1) board.hammerAnim = null;
    }
    if (board.arrowAnim) {
      board.arrowAnim.t += 0.1;
      if (board.arrowAnim.t >= 1.4) board.arrowAnim = null;
    }
    /* pista por inactividad */
    if (!board.lock && !board.over && state === "game") {
      board.idle += dt;
      if (board.idle > 6000 && !board.hint) {
        board.hint = getHint();
        board.hintTimer = 0;
      }
      if (board.hint) {
        board.hintTimer += dt;
        if (board.hintTimer > 4000) { board.hint = null; board.idle = 0; }
      }
    }
  }

  var state = "game";
  function setState(s) { state = s; }

  function draw(ctx) {
    if (!board) return;
    var W = window.innerWidth, H = window.innerHeight;
    ctx.save();
    if (board.shake > 0.5) ctx.translate((Math.random() - 0.5) * board.shake, (Math.random() - 0.5) * board.shake);

    if (board.flash > 0.05) {
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.5, board.flash * 0.3) + ")";
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }

    /* marco del tablero */
    var pad = 8;
    var bx = board.boardX - pad, by = board.boardY - pad;
    var bw = board.cell * COLS + pad * 2, bh = board.cell * ROWS + pad * 2;
    ctx.fillStyle = "rgba(244,229,198,0.94)";
    roundRectPath(ctx, bx, by, bw, bh, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,215,94,0.65)";
    ctx.lineWidth = 3;
    roundRectPath(ctx, bx, by, bw, bh, 16);
    ctx.stroke();

    /* celdas */
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = "rgba(120,80,30,0.10)";
        ctx.fillRect(px(c), py(r), board.cell, board.cell);
      }
    }

    /* pista */
    if (board.hint) {
      var pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.5;
      for (var h = 0; h < board.hint.length; h++) {
        var hp = board.hint[h];
        ctx.strokeStyle = "rgba(255,215,94," + (0.4 + pulse * 0.6) + ")";
        ctx.lineWidth = 4;
        roundRectPath(ctx, px(hp.c) + 3, py(hp.r) + 3, board.cell - 6, board.cell - 6, 12);
        ctx.stroke();
      }
    }

    /* selección */
    if (board.selected) {
      ctx.strokeStyle = "#ffd75e";
      ctx.lineWidth = 4;
      roundRectPath(ctx, px(board.selected.c) + 2, py(board.selected.r) + 2, board.cell - 4, board.cell - 4, 12);
      ctx.stroke();
    }

    /* fichas */
    var t = Date.now();
    for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) {
      var tile = board.grid[r2][c2];
      if (tile) drawTile(ctx, tile, c2, r2, t);
    }

    /* partículas */
    for (var p = 0; p < board.particles.length; p++) {
      var pt = board.particles[p];
      ctx.globalAlpha = Math.max(pt.life, 0);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* animaciones de boosters */
    if (board.hammerAnim) {
      var ha = board.hammerAnim;
      var hy = -80 + (ha.ty + 80) * Math.min(ha.t * 1.4, 1);
      ctx.font = (board.cell * 0.9) + "px serif";
      ctx.textAlign = "center";
      ctx.fillText("🔨", ha.x, hy + board.cell * 0.6);
      if (ha.t > 0.7) {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 3;
        for (var s2 = 0; s2 < 5; s2++) {
          var ang = s2 * 1.3 + ha.t * 6;
          ctx.beginPath();
          ctx.moveTo(ha.x, hy + board.cell * 0.3);
          ctx.lineTo(ha.x + Math.cos(ang) * board.cell * 0.5, hy + board.cell * 0.3 + Math.sin(ang) * board.cell * 0.5);
          ctx.stroke();
        }
      }
    }
    if (board.arrowAnim) {
      var aa = board.arrowAnim;
      var ax = board.boardX - board.cell + (board.cell * (COLS + 2)) * Math.min(aa.t, 1);
      ctx.font = (board.cell * 0.8) + "px serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = aa.t < 1 ? 1 : 1.4 - aa.t;
      ctx.fillText("🏹", ax, py(aa.r) + board.cell * 0.75);
      ctx.globalAlpha = 1;
    }
    if (board.propFly) {
      var pf = board.propFly;
      var fx = pf.x + (pf.tx - pf.x) * pf.t;
      var fy = pf.y + (pf.ty - pf.y) * pf.t - Math.sin(pf.t * Math.PI) * 60;
      ctx.font = (board.cell * 0.8) + "px serif";
      ctx.textAlign = "center";
      ctx.fillText("🛩️", fx, fy);
    }
    if (board.spin) {
      ctx.fillStyle = "rgba(79,210,255,0.15)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.font = (board.cell * 1.2) + "px serif";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(board.boardX + board.cell * COLS / 2, board.boardY + board.cell * ROWS / 2);
      ctx.rotate(Date.now() * 0.01);
      ctx.fillText("🎩", 0, board.cell * 0.4);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawTile(ctx, tile, c, r, now) {
    var x = px(c), y = py(r), s = board.cell;
    var inset = s * 0.07;
    var size = s - inset * 2;

    if (tile.type === -1) {
      var g = ctx.createLinearGradient(x, y, x + s, y + s);
      g.addColorStop(0, "#b07a42");
      g.addColorStop(1, "#7a4e26");
      ctx.fillStyle = g;
      roundRectPath(ctx, x + inset, y + inset, size, size, 8);
      ctx.fill();
      ctx.strokeStyle = "#5c3a1c";
      ctx.lineWidth = 2;
      roundRectPath(ctx, x + inset, y + inset, size, size, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + inset, y + s / 2); ctx.lineTo(x + s - inset, y + s / 2);
      ctx.moveTo(x + s / 2, y + inset); ctx.lineTo(x + s / 2, y + s - inset);
      ctx.stroke();
      if (tile.box > 1) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = (s * 0.4) + "px serif";
        ctx.textAlign = "center";
        ctx.fillText("🪵", x + s / 2, y + s * 0.7);
      }
      return;
    }

    var col = RCLevels.TILE_COLORS[tile.type];
    var isPU = !!tile.pu;
    var grad = ctx.createLinearGradient(x, y + inset, x, y + s - inset);
    if (isPU) {
      grad.addColorStop(0, "#ffe9a8");
      grad.addColorStop(1, "#e8a020");
    } else {
      grad.addColorStop(0, lighten(col, 22));
      grad.addColorStop(1, shade2(col, -18));
    }
    ctx.fillStyle = grad;
    roundRectPath(ctx, x + inset, y + inset, size, size, s * 0.22);
    ctx.fill();
    ctx.strokeStyle = "rgba(70,40,12,0.6)";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, x + inset, y + inset, size, size, s * 0.22);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, x + inset + 2, y + inset + 2, size - 4, size - 4, s * 0.2);
    ctx.stroke();
    /* brillo suave */
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    roundRectPath(ctx, x + inset + size * 0.12, y + inset + size * 0.08, size * 0.76, size * 0.26, s * 0.15);
    ctx.fill();

    var icon = isPU ? PU_ICON[tile.pu] : RCLevels.TILE_ICONS[tile.type];
    ctx.font = (s * 0.52) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.strokeText(icon, x + s / 2, y + s * 0.56);
    ctx.fillText(icon, x + s / 2, y + s * 0.56);

    if (tile.pu === PU.BALL) {
      var rg = ctx.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, s * 0.4);
      rg.addColorStop(0, "rgba(255,255,255,0.8)");
      rg.addColorStop(0.5, "rgba(131,111,255,0.4)");
      rg.addColorStop(1, "rgba(131,111,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(x, y, s, s);
    }

    if (tile.frozen > 0) {
      ctx.fillStyle = "rgba(168,232,255,0.45)";
      roundRectPath(ctx, x + inset, y + inset, size, size, s * 0.22);
      ctx.fill();
      ctx.font = (s * 0.45) + "px serif";
      ctx.fillText("❄️", x + s / 2, y + s * 0.55);
    }
  }

  var PU_ICON = { rocketH: "➡️", rocketV: "⬆️", tnt: "🧨", ball: "🔮", prop: "🛩️" };

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function lighten(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, (n >> 16) + amt);
    var g = Math.min(255, ((n >> 8) & 255) + amt);
    var b = Math.min(255, (n & 255) + amt);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function shade2(hex, amt) {
    return lighten(hex, amt);
  }

  function neighborPoint(x, y, dx, dy) {
    var pos = cellAt(x, y);
    if (!pos) return null;
    var nr = pos.r + dy, nc = pos.c + dx;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return null;
    return { x: px(nc) + board.cell / 2, y: py(nr) + board.cell / 2 };
  }

  function getScore() { return board ? board.score : 0; }
  function isLocked() { return board ? board.lock : false; }
  function addMoves(n) { if (board) { board.cfg.moves += n; board.over = false; cb.onMoves && cb.onMoves(board.cfg.moves); } }
  function isOver() { return board ? board.over : false; }
  function objectives() { return board ? board.cfg.objectives : []; }

  window.RCBoard = {
    start: start,
    draw: draw,
    update: update,
    layout: layout,
    handleTap: handleTap,
    neighborPoint: neighborPoint,
    armBooster: armBooster,
    setState: setState,
    getScore: getScore,
    isLocked: isLocked,
    isOver: isOver,
    addMoves: addMoves,
    objectives: objectives,
    PU: PU
  };
})();
