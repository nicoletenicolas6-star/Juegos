/* Reino Cubano — Generación de niveles, economía y catálogos */
(function () {
  "use strict";

  var TILE_NAMES = ["☕ Café", "🥃 Ron", "🥭 Mango", "🥁 Tambor", "🦋 Mariposa", "🍃 Tabaco"];
  var TILE_ICONS = ["☕", "🥃", "🥭", "🥁", "🦋", "🍃"];
  var TILE_COLORS = ["#7a4a21", "#8e44ad", "#ff8c00", "#e63946", "#3a9bdc", "#3f9e4f"];

  function seeded(n) {
    var s = n * 9301 + 49297;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /* Formas del tablero: celdas válidas (el tablero no siempre es cuadrado) */
  var ROWS = 8, COLS = 7;
  var SHAPES = ["full", "diamond", "cruz", "reloj", "marco"];

  function shapeMask(shape) {
    var m = [];
    for (var r = 0; r < ROWS; r++) {
      m.push([]);
      for (var c = 0; c < COLS; c++) {
        var ok = true;
        if (shape === "diamond") ok = Math.abs(r - 3.5) / 4.4 + Math.abs(c - 3) / 3.6 <= 1.18;
        else if (shape === "cruz") ok = (r >= 2 && r <= 5) || (c >= 2 && c <= 4);
        else if (shape === "reloj") ok = Math.abs(c - 3) <= 3 - Math.abs(r - 3.5) * 0.52;
        else if (shape === "marco") ok = (r === 0 || r === 7 || c === 0 || c === 6) || (r >= 3 && r <= 4 && c >= 2 && c <= 4);
        m[r].push(ok);
      }
    }
    return m;
  }

  function shapeFor(num) {
    if (num < 8) return "full";
    return SHAPES[num % SHAPES.length];
  }

  /* Genera la configuración de un nivel de forma determinista */
  function genLevel(num) {
    var rnd = seeded(num * 7919);
    var country = num <= 100 ? "cuba" : "mexico";
    var local = num <= 100 ? num : num - 100;

    /* Niveles bonus en los cierres: 25, 50, 75, 125, 150, 175... (100 es el viaje) */
    if (num % 25 === 0 && num !== 100 && num !== 200) {
      return {
        num: num, country: country, diff: "bonus", bonus: true,
        shape: shapeFor(num), moves: 22, types: 6, boxes: 0, ice: 0,
        objectives: [{ kind: "score", need: 1200 + num * 25, got: 0 }],
        starThresholds: [0, 0, 0],
        coinsReward: 250 + num * 2
      };
    }

    var diff = "normal";
    if (num % 50 === 0) diff = "super";
    else if (num % 10 === 0) diff = "hard";

    var moves = 26 - Math.floor(local / 12);
    if (diff === "hard") moves -= 4;
    if (diff === "super") moves -= 7;
    moves = Math.max(14, moves);

    var types = num < 6 ? 4 : num < 15 ? 5 : 6;

    var objectives = [];
    var nObj = local < 5 ? 1 : (rnd() < 0.55 ? 1 : 2);

    var cap = Math.round(moves * 5.5);
    var t1 = Math.floor(rnd() * types);
    var q1 = 12 + Math.floor(local * 0.7) + Math.floor(rnd() * 10);
    if (diff !== "normal") q1 += 8;
    q1 = Math.min(q1, cap);
    objectives.push({ kind: "collect", type: t1, need: q1, got: 0 });

    if (nObj === 2) {
      var t2 = (t1 + 1 + Math.floor(rnd() * (types - 1))) % types;
      var q2 = Math.min(10 + Math.floor(local * 0.5) + Math.floor(rnd() * 8), Math.round(moves * 2));
      objectives.push({ kind: "collect", type: t2, need: q2, got: 0 });
    }

    /* Obstáculos progresivos */
    var boxes = 0, ice = 0;
    if (local >= 5) boxes = Math.min(10, Math.floor(local / 6) + (rnd() < 0.5 ? 1 : 0));
    if (local >= 12) ice = Math.min(12, Math.floor(local / 8) + (rnd() < 0.5 ? 2 : 0));
    if (boxes > 0) objectives.push({ kind: "box", need: boxes, got: 0 });
    if (ice > 0) objectives.push({ kind: "ice", need: ice, got: 0 });

    var starBase = q1 * 3 + 60;
    return {
      num: num,
      country: country,
      diff: diff,
      shape: shapeFor(num),
      moves: moves,
      types: types,
      boxes: boxes,
      ice: ice,
      objectives: objectives,
      starThresholds: [
        Math.round(starBase * 0.9),
        Math.round(starBase * 1.35),
        Math.round(starBase * 1.9)
      ],
      coinsReward: 40 + Math.floor(local * 1.5) + (diff === "hard" ? 30 : 0) + (diff === "super" ? 70 : 0)
    };
  }

  function missionText(obj) {
    if (obj.kind === "collect") return { icon: TILE_ICONS[obj.type], text: "Junta " + obj.need + " de " + TILE_NAMES[obj.type] };
    if (obj.kind === "box") return { icon: "📦", text: "Rompe " + obj.need + " cajas de madera" };
    if (obj.kind === "ice") return { icon: "🧊", text: "Derrite " + obj.need + " capas de hielo" };
    if (obj.kind === "score") return { icon: "🪙", text: "Junta " + obj.need + " puntos para ganar monedas" };
    return { icon: "⭐", text: "Objetivo" };
  }

  /* Zonas renovables con estrellas */
  var RENOVATIONS = {
    cuba: [
      { id: "malecon", icon: "🌊", name: "Arreglar el Malecón", cost: 12, reward: 150 },
      { id: "finca", icon: "🚜", name: "Renovar la finca de tabaco", cost: 25, reward: 250 },
      { id: "cafetal", icon: "☕", name: "Restaurar el cafetal", cost: 40, reward: 400 },
      { id: "capitolio", icon: "🏛️", name: "Brillar El Capitolio", cost: 60, reward: 600 }
    ],
    mexico: [
      { id: "chichen", icon: "🏛️", name: "Descubrir Chichén Itzá", cost: 12, reward: 150 },
      { id: "cancun", icon: "🌴", name: "Embellir Cancún", cost: 25, reward: 250 },
      { id: "cdmx", icon: "🌆", name: "Iluminar la CDMX", cost: 40, reward: 400 },
      { id: "zocalo", icon: "🎉", name: "Fiestear el Zócalo", cost: 60, reward: 600 }
    ]
  };

  /* Tienda por país */
  var SHOP = {
    cuba: [
      { id: "hammer", icon: "🔨", name: "Martillo Real", desc: "Rompe 1 ficha sin gastar movimiento", price: 180, give: { booster: "hammer", n: 1 } },
      { id: "arrow", icon: "🏹", name: "Flecha Certera", desc: "Limpia una fila completa", price: 220, give: { booster: "arrow", n: 1 } },
      { id: "cannon", icon: "💥", name: "Cañón Criollo", desc: "Arrasa una columna completa", price: 260, give: { booster: "cannon", n: 1 } },
      { id: "hat", icon: "🎩", name: "Sombrero Mágico", desc: "Mezcla todo el tablero", price: 200, give: { booster: "hat", n: 1 } },
      { id: "lives", icon: "❤️", name: "Ronda de Bebidas", desc: "Rellena todas tus vidas", price: 300, give: { lives: "full" } },
      { id: "mango", icon: "🥭", name: "Dulce de Mango", desc: "+500 monedas", price: 0, give: { coins: 500 }, starPrice: 3 }
    ],
    mexico: [
      { id: "hammer", icon: "🔨", name: "Martillo Azteca", desc: "Rompe 1 ficha sin gastar movimiento", price: 180, give: { booster: "hammer", n: 1 } },
      { id: "arrow", icon: "🏹", name: "Flecha de Jade", desc: "Limpia una fila completa", price: 220, give: { booster: "arrow", n: 1 } },
      { id: "cannon", icon: "💥", name: "Cañón de Tenochtitlan", desc: "Arrasa una columna completa", price: 260, give: { booster: "cannon", n: 1 } },
      { id: "hat", icon: "🎩", name: "Sombrero Charro", desc: "Mezcla todo el tablero", price: 200, give: { booster: "hat", n: 1 } },
      { id: "lives", icon: "❤️", name: "Agua de Jamaica", desc: "Rellena todas tus vidas", price: 300, give: { lives: "full" } },
      { id: "taco", icon: "🌮", name: "Taco de Canasta", desc: "+500 monedas", price: 0, give: { coins: 500 }, starPrice: 3 }
    ]
  };

  /* Tienda de estilo: peinados, barba, cuerpo, ropa y vehiculos del rey/reina */
  var STYLE = [
    { id: "hair-hair", icon: "💇", name: "Pelo Clásico", desc: "Peinado tradicional", price: 150, set: { hair: "hair" } },
    { id: "hair-bald", icon: "🧑‍🦲", name: "Calvo", desc: "Ni un pelo", price: 100, set: { hair: "bald" } },
    { id: "hair-afro", icon: "🕺", name: "Afro", desc: "¡Estilo disco!", price: 250, set: { hair: "afro" } },
    { id: "beard-none", icon: "🪒", name: "Afeitado", desc: "Cara limpia", price: 80, set: { beard: "none" } },
    { id: "beard-beard", icon: "🧔", name: "Barba", desc: "Barba de abuelo", price: 120, set: { beard: "beard" } },
    { id: "beard-mustache", icon: "👨", name: "Bigote", desc: "Bigote de sonero", price: 120, set: { beard: "mustache" } },
    { id: "body-thin", icon: "🤸", name: "Flaco", desc: "Cuerpo atlético", price: 200, set: { body: "thin" } },
    { id: "body-fat", icon: "🍔", name: "Gordo", desc: "Panza de rey", price: 200, set: { body: "fat" } },
    { id: "cloth-red", icon: "👕", name: "Traje Rojo", desc: "El de siempre", price: 150, set: { cloth: "#e63946" } },
    { id: "cloth-blue", icon: "👕", name: "Traje Azul", desc: "Color del mar", price: 150, set: { cloth: "#2a6fdb" } },
    { id: "cloth-green", icon: "👕", name: "Traje Verde", desc: "Color del tabaco", price: 150, set: { cloth: "#1a9e4b" } },
    { id: "cloth-purple", icon: "👕", name: "Traje Morado", desc: "Muy real", price: 150, set: { cloth: "#8e44ad" } },
    { id: "cloth-gold", icon: "🤴", name: "Traje Dorado", desc: "Solo para reyes", price: 400, set: { cloth: "#d4a017" } },
    { id: "veh-none", icon: "🚶", name: "A Pie", desc: "Sin vehículo", price: 0, set: { vehicle: "" } },
    { id: "veh-bici", icon: "🚲", name: "Bicicleta", desc: "Ecológica, se ve en tu pueblo", price: 200, set: { vehicle: "bici" } },
    { id: "veh-moto", icon: "🏍️", name: "Moto Cubana", desc: "Rugidora, se ve en tu pueblo", price: 400, set: { vehicle: "moto" } },
    { id: "veh-car", icon: "🚗", name: "Almendrón Clásico", desc: "El auto de La Habana, en tu pueblo", price: 500, set: { vehicle: "car" } }
  ];

  /* Recompensas diarias: día 7 = COMBO */
  var DAILY = [
    { icon: "🪙", label: "100", give: { coins: 100 } },
    { icon: "🔨", label: "x1", give: { booster: "hammer", n: 1 } },
    { icon: "🪙", label: "150", give: { coins: 150 } },
    { icon: "🏹", label: "x1", give: { booster: "arrow", n: 1 } },
    { icon: "🪙", label: "200", give: { coins: 200 } },
    { icon: "🧨", label: "x1", give: { boosterDynamite: 1 } },
    { icon: "🎁", label: "COMBO", combo: true, give: { coins: 300, boosters: { hammer: 1, arrow: 1, cannon: 1 } } }
  ];

  /* Desbloqueo de boosters en-juego */
  var BOOSTER_UNLOCK = { hammer: 1, arrow: 3, cannon: 6, hat: 10 };
  var BOOSTER_INFO = {
    hammer: { icon: "🔨", name: "Martillo Real", desc: "Toca una ficha y el martillo la romperá con astillas volando. ¡Sin gastar movimientos!" },
    arrow: { icon: "🏹", name: "Flecha Certera", desc: "Toca una ficha y una flecha atravesará toda su fila con estela luminosa." },
    cannon: { icon: "💥", name: "Cañón Criollo", desc: "Toca una ficha y el cañón disparará arrasando toda su columna." },
    hat: { icon: "🎩", name: "Sombrero Mágico", desc: "Un remolino mágico barajeará todo el tablero buscando jugadas nuevas." }
  };

  window.RCLevels = {
    TILE_NAMES: TILE_NAMES,
    TILE_ICONS: TILE_ICONS,
    TILE_COLORS: TILE_COLORS,
    genLevel: genLevel,
    shapeMask: shapeMask,
    shapeFor: shapeFor,
    ROWS: ROWS,
    COLS: COLS,
    missionText: missionText,
    RENOVATIONS: RENOVATIONS,
    SHOP: SHOP,
    STYLE: STYLE,
    DAILY: DAILY,
    BOOSTER_UNLOCK: BOOSTER_UNLOCK,
    BOOSTER_INFO: BOOSTER_INFO
  };
})();
