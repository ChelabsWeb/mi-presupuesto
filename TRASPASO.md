# Traspaso — Mi Presupuesto / El Trimestre de Juan (Taller 2 BCU)

> Documento para retomar el proyecto. Todo lo que hay que saber para seguir sin arrancar de cero.

## Qué es

Juego web para el **Taller 2 "Presupuesto y Opciones"** del programa Pin! (BCU, Central para Vos).
Reemplaza la herramienta de presupuesto de bcueduca (que era fea) por algo mucho mejor, con la
**paleta oficial** del BCU. Dos cosas en un solo archivo:

1. **Mi Presupuesto** (herramienta personal): un armador de presupuesto de 3 pasos (ingresos → gastos → plan),
   con la data del taller (9 fuentes de ingreso, 13 etiquetas de gasto, la "ayuda invisible", el hogar promedio uruguayo).
2. **El Trimestre de Juan** (el juego por equipos): para el taller con ~20 gurises en **3 máquinas + proyector**.
   Los equipos asesoran a Juan (19, La Teja, gana $10.000, quiere una tableta de $8.000) durante 2 meses simulados.
   Dura ~15-20 min. Termina con podio y análisis en el proyector.

## Links

- **En vivo:** https://chelabsweb.github.io/mi-presupuesto/
- **Repo:** https://github.com/ChelabsWeb/mi-presupuesto
- **Deploy:** GitHub Pages, automático con cada `git push` a `main`. No hay build.

## Cómo está hecho (stack)

- **Un solo `index.html`** (~1500 líneas): HTML + CSS + JS vanilla, sin frameworks, sin build.
  Fuentes por Google Fonts (Lato + IBM Plex). Todo el juego vive acá adentro.
- **`sw.js`**: service worker (cachea para que ande offline; estrategia red-primero para no servir versiones viejas).
- **`tests/suite.js`**: suite de 41 tests E2E con Playwright (ver abajo).
- **Multijugador sin servidor propio:** usa **Supabase Realtime** (solo canales broadcast/presence, sin base de datos).
  Proyecto Supabase "Sistema EDO by Chelabs". La API key que está en el código es **pública por diseño**
  (publishable key) — no es un secreto, no pasa nada que esté a la vista.

## Cómo se juega en el taller

1. **Una máquina es el proyector:** entra a "El Trimestre de Juan · jugar en equipos" → elige un **código de 4 letras** → "Proyector: solo mirar". Se pone en modo violeta noche y muestra el código gigante.
2. **Las otras 2-3 máquinas son los equipos:** mismo botón → escriben **el mismo código** → nombre del equipo.
3. Desde el proyector se toca **¡Arrancar!** (arranca en todas a la vez).
4. Cada equipo juega los 2 meses; los puntajes van ocultos (`···`) hasta el **reveal final** con podio y análisis.

## Estética ("BCU EDUCA NEXT")

Distinta a propósito del otro juego (12 Meses / endeudarse-bien) para que no sea repetitivo.
- Lavanda `#F6F3FC` de día, violeta noche `#2B0A50` en el proyector.
- Firma "Cinta de la Ruta": franja de 5 colores oficiales (violeta/magenta/naranja/amarillo/lima).
- Paleta oficial: violeta `#811DE6`, amarillo `#FBC504`, naranja `#F76025`, azul `#003B8B`, magenta `#DA1556`, lima `#74D526`.

**Truco importante del CSS:** los nombres de variables viejas (`--tinta`, `--rojo`, `--azul`, etc.) quedaron
como *alias* de la paleta nueva. Así el JS que mete estilos inline no hubo que tocarlo. Si cambiás un color,
cambialo en `:root` y en el scope de `#espectador` (modo noche del proyector).

## Los tests (importantísimo si tocás la economía)

```bash
cd tests
npm install                  # playwright
npx playwright install chromium
node server.js &             # servidor estático en :8124 (sin dependencias)
node suite.js                # corre la suite
```

- **T1** herramienta personal, **T2** el trimestre completo, **T3** revancha, **T4** timeout real de 60s, **T5** estáticos.
- **OJO:** T2 tiene **puntajes exactos calculados a mano** como test de regresión: `LOS CAPOS = 31.775`, `TIBURONES = −11.950`.
  Esos números dependen de **todas** las constantes de la economía (puntos por destino, trampas −1.500, eventos, shocks, bonus).
  **Si tocás cualquier constante, los tests van a fallar** — no es un bug: recalculá a mano el esperado y actualizá la suite.
- Los tests desactivan el tutorial (coach) vía `sessionStorage` para poder correr directo.

## Cómo funciona la economía (resumen)

- Juan gana $10.000 fijo + lo que consigan en changas/ventas (con horas limitadas: 12 la 1ª semana, 11 la 2ª).
- **Trampas "PLATA RÁPIDA"** (entradas truchas, mula financiera, apuestas): parecen el mejor ingreso, al confirmar se anulan y restan −1.500 c/u.
- **Repartir el mes:** las etiquetas de amarillo (imprevistos, fondo, tableta, meta 2) dan puntos; dejarlas en $0 resta; plata sin nombre "se evapora" (−mitad).
- **Shocks:** la bici rota (−$2.000, mes 1) y el recorte de horas (−$1.500, mes 2). Si tenían colchón, lo absorben. Aguantar los dos = "Colchón de acero" +1.000.
- Detalle completo en el código, funciones `scoreAhora`, `cerrarFase`, `shock1`/`shock2`, `mostrarInterludio`, `finDelEquipo`.

## Lo último que se hizo (agosto 2026)

- Auditoría visual + de intuitividad con capturas de pantalla de todo el flujo.
- **Tutoriales agregados** para que los gurises de 15-18 entiendan sin explicación: panel "así se juega" en el lobby del equipo,
  y un **coach emergente** al empezar cada paso (aparece una vez por sesión).
- Nombres de fases en lenguaje de tarea ("CONSEGUIR PLATA", "REPARTIR LA PLATA") en vez de jerga.
- Íconos por tipo de fuente en el mercado, montos con "/mes", barra de repartir más clara, etc.

## Pendientes / ideas para seguir

- Probarlo en el proyector real del taller (si el violeta noche se ve lavado, subir la variable `--glass` a `.12`).
- Validar el contenido de las trampas "plata rápida" con el equipo pedagógico del BCU.
- **Variante B de la revancha:** rotar las trampas/eventos/shocks para que la 2ª ronda no sea idéntica.
- Integrar el desafío viral "$30.000 alcanzan" como un modo reto aparte.
- Guía del facilitador (un one-pager con el guion del Trimestre para quien conduce el taller).
