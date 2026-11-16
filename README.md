# 🇨🇺👑 Reino Cubano

Match-3 estilo Royal Match pero cubano: ayuda al Rey (o Reina) a restaurar los lugares más bellos de Cuba combinando fichas, y al llegar al nivel 100 ¡viaja a México y desbloquea un reino nuevo!

## 🎮 Características

- **Match-3 completo**: cascadas, combos en cadena, power-ups (🚀 Cohete, 🧨 Dinamita, 🔮 Bola Mágica, 🛩️ Hélice) y todos sus combos épicos
- **Potenciadores**: 🔨 Martillo Real, 🏹 Flecha, 💥 Cañón y 🎩 Sombrero — con animaciones (el martillo rompe con astillas volando)
- **200 niveles**: 100 en Cuba 🇨🇺 (Malecón, Viñales, Trinidad, Varadero) y 100 en México 🇲🇽 (Chichén Itzá, Cancún, CDMX, Oaxaca)
- **Paisajes realistas en capas** con parallax y **ciclo día/tarde/noche real** según la hora de tu teléfono
- **Rey personalizable**: gordo/flaco, pelo/calvo/afro, barba/bigote, color de ropa — y baila son cubano cuando ganas
- **Recompensas diarias** (día 7 = COMBO) y "Regalo del Abuelo" por racha de victorias
- **Tienda por país** con artículos cubanos y mexicanos
- **Estrellas con valor real**: renueva zonas del reino y gana monedas
- **Pista automática** si te demoras en jugar
- **Música procedural**: son cubano en Cuba, mariachi en México (generada en tiempo real, sin copyright)
- **Splash screen** con el rey bailando + onboarding con nombre y edad (Príncipe/Princesa/Rey/Reina Vieja)
- Panel de configuración completo (música, efectos, vibración, vidas infinitas)

## 📱 Cómo descargar el APK

1. Ve a la pestaña **Actions** del repositorio
2. Abre el workflow **Build APK** más reciente
3. Descarga el artefacto **`esquiva-debug-apk`** (o el release), descomprime e instala el APK

## 🕹️ Cómo jugar

- **Arrastra** una ficha hacia su vecina para intercambiarlas
- Junta 3+ iguales para romperlas; 4 en línea → Cohete; forma T/L → Dinamita; 5 en línea → Bola Mágica; cuadrado 2×2 → Hélice
- **Toca un power-up** para activarlo, o **intercambia dos power-ups** para un combo épico
- Usa los potenciadores del lado inferior (no gastan movimientos)
- Completa la misión de cada nivel antes de quedarte sin movimientos

## Estructura

```
app/src/main/assets/www/
├── index.html          # Pantallas (splash, onboarding, home, juego, tienda…)
├── css/style.css       # Estilo premium
└── js/
    ├── audio.js        # Música procedural cubana/mexicana + efectos
    ├── scenes.js       # Fondos paisajísticos con parallax y día/noche
    ├── character.js    # Rey/Reina dibujado y animado
    ├── levels.js       # Generación de 200 niveles, tienda, diarias
    ├── board.js        # Motor match-3 (cascadas, power-ups, boosters)
    └── main.js         # Flujo, economía y guardado
```

## Compilar localmente

Requiere JDK 17 y Android SDK:

```bash
gradle assembleDebug
```
