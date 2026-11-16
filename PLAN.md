# 🇨🇺👑 Plan Maestro: "Reino Cubano" — Match-3 estilo Royal Match

Juego match-3 cubano basado en las mecánicas reales de Royal Match (Dream Games), con identidad propia: Cuba como primer país, viajes a México al nivel 100, y gráficos premium.

---

## 0. Investigación: mecánicas reales de Royal Match que replicamos

| Mecánica del original | Cómo la implementamos |
|---|---|
| Match-3 con objetivos y movimientos limitados | Tablero 7×8, misiones variadas por nivel |
| Power-ups por combinación: **Rocket** (4 en línea), **TNT** (forma T/L), **Light Ball** (5 en línea), **Propeller** (cuadrado 2×2) | Los 4 power-ups, con nombres cubanos: **Cohete**, **Dinamita**, **Bola Mágica**, **Hélice** |
| Combos de power-ups (Rocket+TNT, Light Ball+Light Ball…) | Todos los combos con animaciones intensificadas |
| Boosters pre-nivel: Rocket, TNT, Light Ball | Se colocan en el tablero antes de empezar (cuestan monedas) |
| Boosters en-juego: **Royal Hammer**, **Arrow**, **Cannon**, **Jester Hat** | **Martillo Real** (rompe 1 ficha), **Flecha** (fila), **Cañón** (columna), **Sombrero** (mezcla tablero) — sin gastar movimientos |
| **Regalo del Mayordomo** (racha de victorias → boosters gratis) | "Regalo del Abuelo": racha cubana con las mismas 4 etapas |
| Estrellas por nivel → renovar áreas del castillo | Estrellas → renovar lugares de Cuba (Malecón, finca, cafetal…) |
| Niveles Normal / Difícil / Súper Difícil / Bonus | Los 4 tipos con los perfiles de dificultad del original |
| 5 vidas que se regeneran con el tiempo | Igual, con modo opcional "vidas infinitas" en configuración |
| Área Chest (cofres de área) | Cofre al completar cada zona renovada |

---

## Fase 1 — Motor match-3 completo (núcleo jugable)
- Tablero 7×8 con **6 fichas cubanas muy diferenciadas** (forma + color + contorno + brillo): ☕ Café, 🥃 Ron, 🥭 Mango, 🥁 Tambor, 🦋 Mariposa, 🍃 Tabaco
- Intercambio táctil fluido, validación de jugadas, **cascadas en cadena** con caída física
- Generación de power-ups: 4 en línea → Cohete; T/L → Dinamita; 5 en línea → Bola Mágica; cuadrado → Hélice
- **Todos los combos** (Cohete+Dinamita, Bola+Bola, Hélice+anything…) con efecto ampliado
- **Feedback visual por jugada**: explosión de partículas del color de la ficha, destello, puntos flotantes, sacudida del tablero en cascadas grandes
- Objetivos de nivel: recolectar fichas específicas, romper obstáculos (cajas, jaulas, hielo), puntos
- Obstáculos con capas (como el original): cajas de madera, cadenas, hielo

## Fase 2 — Potenciadores y boosters con efectos animados
- **Power-ups activables tocándolos**: Cohete cruza con estela, Dinamita explota en onda expansiva, Bola Mágica barre el color con rayos, Hélice vuela a un objetivo
- **Boosters en-juego con animación real**:
  - Martillo Real: un martillo gigante cae y **rompe la ficha con astillas volando** (+ el rey da un martillazo si está cerca)
  - Flecha: atraviesa la fila con estela luminosa
  - Cañón: dispara desde el borde con humo y retroceso
  - Sombrero: remolino que baraja el tablero
- **Boosters pre-nivel**: pantalla para colocar Cohete/Dinamita/Bola antes de empezar (costo en monedas)
- Desbloqueo progresivo: Martillo (nivel 3), Flecha (nivel 8), Cañón (nivel 15), Sombrero (nivel 25)
- **Tutorial animado en tablero real**: mano fantasma demuestra el primer uso de cada potenciador nuevo (no esquemático)

## Fase 3 — Gráficos premium
- **Fondos paisaje realista en capas con parallax**, dibujados vectorialmente con detalle: Malecón de La Habana con el Capitolio, Valle de Viñales con mogotes, Trinidad colonial, Playa Varadero con aguas turquesas
- **Ciclo día/tarde/noche real**: el fondo usa la hora del teléfono (amanecer, mediodía, atardecer, noche con estrellas y luna)
- **El rey vive**: camina por la pantalla, saluda, **baila son cubano al ganar**, se entristece al perder, celebra tus combos
- Animaciones de victoria/derrota con tu personaje (rey, reina, príncipe, princesa)
- Pulido general: sombras suaves, degradados, brillos, transiciones entre pantallas

## Fase 4 — Progresión y países 🌎
- **100 niveles en Cuba** → cinemática de viaje en barco/avión → **México 🇲🇽** con 100 niveles más
- Fondos mexicanos: Chichén Itzá, playas de Cancún, CDMX, mariachi
- **Tienda por país**: artículos cubanos en Cuba, mexicanos en México (se desbloquean al llegar)
- Arquitectura de datos preparada para añadir países futuros fácilmente
- **Estrellas con valor real**: moneda para renovar zonas y desbloquear decoraciones (como las áreas del castillo del original)

## Fase 5 — Economía, tienda y recompensas
- **Recompensas diarias**: calendario de 7 días; **el día 7 da un COMBO** de potenciadores
- **"Regalo del Abuelo"**: racha de victorias → boosters gratis en 4 etapas (como el Butler's Gift)
- **Tienda premium** rediseñada: potenciadores, vidas, monedas, decoraciones
- Cofres de área al completar zonas renovadas
- Monedas + estrellas + vidas con regeneración temporal

## Fase 6 — Sonido y música 🎵
- **Música procedural por país**: son cubano (clave, bongó, montuno) en Cuba; estilo mariachi en México — generada con WebAudio (sin copyright)
- Efectos: pop de fichas, martillazo, explosión, fanfarria de victoria, sonido de cascada
- Victoria/derrota con animación + jingle

## Fase 7 — Personalización, configuración y entrada al juego ⚙️
- **Splash screen**: logo del juego + el rey bailando
- **Onboarding**: ingresar nombre + edad → Príncipe/Princesa (si es menor) o Rey/Reina Vieja (si es mayor)
- **Panel de configuración**: música, efectos, vibración, calidad gráfica, vidas infinitas (opcional)
- **Personalización del rey/reina**: gordo/flaco, pelo/calvo, barba, color de ropa — se refleja en todo el juego
- **Pista automática**: tras ~6 segundos sin jugar, tu personaje señala una jugada válida
- **Ícono premium de la app**

## 💡 Sugerencias adicionales incluidas
- Guardado automático de todo el progreso (niveles, monedas, racha, personalización)
- Niveles Difícil y Súper Difícil con aviso visual (como el original) y más recompensa
- Niveles Bonus para ganar monedas extra
- Racha de victorias visible con fuego 🔥

---

## Orden de construcción
1. Fase 1 (motor jugable) → 2. Fase 3 (gráficos premium, para que se vea bien desde ya) → 3. Fase 2 (potenciadores) → 4. Fase 7 (entrada/personalización) → 5. Fase 4 (países) → 6. Fase 5 (economía) → 7. Fase 6 (música)

## Entrega
Mismo método validado: push al repo → GitHub Actions compila el APK → descarga en la pestaña **Actions**.
