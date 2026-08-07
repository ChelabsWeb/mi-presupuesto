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

- **T1** herramienta personal, **T2** el trimestre completo, **T3** revancha, **T4** timeout real de 60s,
  **T5** estáticos, **T6** cierre automático por reloj + teclado + botón TODO, **T7** control del facilitador.
- **OJO:** T2 tiene **puntajes exactos calculados a mano** como test de regresión: `LOS CAPOS = 31.275`, `TIBURONES = −12.950`.
  Esos números dependen de **todas** las constantes de la economía (puntos por destino, trampas −1.500, eventos, shocks, bonus).
  **Si tocás cualquier constante, los tests van a fallar** — no es un bug: recalculá a mano el esperado y actualizá la suite.
- Los tests desactivan el tutorial (coach) vía `sessionStorage` para poder correr directo.

## Cómo funciona la economía (resumen)

- Juan gana $10.000 fijo + lo que consigan en changas/ventas (con horas limitadas: 12 la 1ª semana, 11 la 2ª).
- **Trampas "PLATA RÁPIDA"** (5 en total: entradas truchas, mula financiera, apuestas, el kit que hay
  que pagar, el sobrepago). **Salen 3 sorteadas por ronda**, en posiciones distintas: la revancha ya no es
  un test de memoria. El sorteo usa un `seed` que viaja en el broadcast `start`, así que **todas las
  máquinas ven exactamente la misma grilla** (si no, se rompe la equidad).
  Al confirmar se anulan y restan −1.500 c/u.
- **Repartir el mes:** las etiquetas de amarillo (imprevistos, fondo, tableta, meta 2) dan puntos; dejarlas en $0 resta; plata sin nombre "se evapora" (−mitad).
- **Shocks:** la bici rota (−$2.000, umbral $2.000, ±2.000 pts, mes 1) y el recorte de horas
  (−$2.500, umbral $2.500, ±2.500 pts, mes 2). **El segundo pega más fuerte que el primero** a propósito:
  en el mes 2 el equipo está más rico. Aguantar los dos = "Colchón de acero" +1.000.
- **El colchón del mes 1 pasa al mes 2 como plata disponible, pero sin etiqueta.** Antes venía precargado
  en `fondo` y le regalaba el shock 2 al que ya iba ganando; ahora hay que volver a repartirlo.
- Detalle completo en el código, funciones `scoreAhora`, `cerrarFase`, `shock1`/`shock2`, `mostrarInterludio`, `finDelEquipo`.

## La pantalla de repartir (agosto 2026)

Era una planilla: párrafo de instrucciones de 3 líneas + 10 filas iguales con `−`/`+`. Ahora:

- **Tarjetas en grilla**, agrupadas en **"Estas dan puntos"** (dorado, primero — ahí está la decisión)
  y **"Lo de todos los meses"**. Sin descripciones: ícono, nombre corto, monto.
- **Toda la tarjeta suma $500**; mantener apretado corre solo. El `−` y el `TODO` son chicos, en las
  esquinas, con `stopPropagation`. La tarjeta es `role="button"` (no `<button>`, porque no se pueden
  anidar botones) y maneja Enter/Espacio a mano.
- **Cabezal `#platon`**: lo que falta repartir en grande + barra que **se llena** con lo que ya tiene
  nombre + **el puntaje vivo** (`scoreAhora()`). El puntaje se muestra **solo en la máquina del equipo**;
  el proyector sigue con `···` y el podio no se quema.
- **`+N` flotante** al asignar a una etiqueta que da puntos (`flotarPts`, acumula para que el hold no
  escupa uno cada 110 ms).
- La barra de abajo oculta `gbD1`/`gbD3` en la fase 2 para no repetir lo que ya está arriba.
  **`gbD2` se mantiene**: la suite depende de sus textos.
- **La economía no se tocó.** Si `T2.16`/`T2.17` dejan de dar `31.275` / `−12.950`, algo se rompió.

## El reloj y el control del facilitador (agosto 2026)

- Los cronómetros de fase **cierran de verdad**: al llegar a 0 hay 20s de gracia (`GRACIA`) y después
  `autoCerrarFase()` acomoda lo mínimo (suelta horas de más, recorta si el plan está en rojo) y confirma.
  Antes el reloj solo escribía "¡CIERREN!" y un equipo lento congelaba al taller entero.
- El reloj **se congela mientras hay un modal arriba** (los eventos ya traen su propio timer de 60s).
- El proyector tiene **"Cerrar la fase en todas"** (broadcast `forzar`, doble confirmación) para destrabar la sala.
- **`¡Arrancar!` avisa antes de reiniciar una ronda en curso**, y un equipo que está jugando **ignora**
  un `start` de otra máquina. Antes, cualquiera que volviera al lobby y tocara el botón le tiraba el
  trimestre abajo a todos.

## Lo último que se hizo (agosto 2026)

- Auditoría visual + de intuitividad con capturas de pantalla de todo el flujo.
- **Tutoriales agregados** para que los gurises de 15-18 entiendan sin explicación: panel "así se juega" en el lobby del equipo,
  y un **coach emergente** al empezar cada paso (aparece una vez por sesión).
- Nombres de fases en lenguaje de tarea ("CONSEGUIR PLATA", "REPARTIR LA PLATA") en vez de jerga.
- Íconos por tipo de fuente en el mercado, montos con "/mes", barra de repartir más clara, etc.

## Pendientes / ideas para seguir

- Probarlo en el proyector real del taller (si el violeta noche se ve lavado, subir la variable `--glass` a `.12`).
- **Validar con el equipo pedagógico del BCU las 2 trampas nuevas** (`kit` y `sobrepago`), escritas para
  darle variedad a la revancha pero sin revisión pedagógica todavía.
- **El badge naranja `PLATA RÁPIDA` sigue siendo 1:1 con "es trampa":** alcanza con mirar el color para
  resolverlo, sin evaluar la oferta. Una opción es meter una changa legítima con el mismo badge, pero eso
  cambia lo que el badge *significa* — decisión del equipo pedagógico, no técnica.
- **Rotar también eventos y shocks** entre rondas (hoy solo rotan las trampas).
- Integrar el desafío viral "$30.000 alcanzan" como un modo reto aparte.
- Guía del facilitador (un one-pager con el guion del Trimestre para quien conduce el taller).
