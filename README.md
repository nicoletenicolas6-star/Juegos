# Esquiva 🎮

Juego arcade simple para Android: arrastra tu nave para esquivar los bloques que caen. La velocidad aumenta con el tiempo. ¿Cuánto puedes aguantar?

Construido con HTML5/Canvas dentro de un WebView de Android (Kotlin).

## Cómo descargar el APK

1. Ve a la pestaña **Actions** del repositorio.
2. Abre el workflow **Build APK** más reciente (o haz un push para dispararlo).
3. En la sección **Artifacts** descarga:
   - `esquiva-debug-apk` → APK firmado para pruebas (instalable directamente).
   - `esquiva-release-apk` → APK release sin firmar (requiere firma para instalar).

## Cómo jugar

- **Arrastra** el dedo (o el mouse) para mover la nave a izquierda y derecha.
- Esquiva los bloques de colores que caen.
- Cada bloque que pasa suma **1 punto**; la velocidad aumenta progresivamente.
- Toca **REINTENTAR** cuando pierdas. Tu récord se guarda en el dispositivo.

## Estructura del proyecto

```
app/src/main/
├── assets/www/          # El juego (HTML5/CSS/JS, editable sin tocar Android)
├── java/com/vibe/arcadegame/MainActivity.kt
├── res/                 # Tema, strings e ícono
└── AndroidManifest.xml
```

## Compilar localmente

Requiere JDK 17 y Android SDK (o Android Studio):

```bash
gradle assembleDebug
# APK en app/build/outputs/apk/debug/app-debug.apk
```

## Personalizar el juego

Todo el gameplay vive en `app/src/main/assets/www/game.js` — puedes cambiar velocidad, colores, tamaño de bloques y reglas sin recompilar la lógica de Android (solo vuelve a generar el APK).
