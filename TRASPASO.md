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

## El host y "el mes día por día" (agosto 2026)

**El proyector es un host tipo Kahoot.** Código fijo arriba a la izquierda todo el juego, reloj arriba a
la derecha, leaderboard en filas mientras se juega y podio en columnas al final.

- El host no tenía forma de saber el reloj de nadie: ahora cada equipo **late una vez por segundo**
  (`latir()` → `gProg(false)`, que no reescribe localStorage) mandando `t`, `gracia`, `etapa` y `mes`.
  El host muestra el **mayor** de los tiempos: "cuándo cierra el último".
- El leaderboard se ordena por **plata conseguida**, que es dato público. **El puntaje sigue oculto**
  (`···`, T2.1 lo verifica): el que lidera la carrera puede perder el podio por cómo repartió.
- `estadoDe(r)` da rótulos cortos para que se lea de lejos, y el pie desglosa
  "2 CONSIGUIENDO · 1 REPARTIENDO" — un rótulo único miente si están en fases distintas.

**El shock dejó de ser una pantalla y pasó a jugarse** (`correrMes`, screen `#mes30`): se destapan los 30
días y caen dos imprevistos que el colchón absorbe o no, en vivo.

- **La economía NO cambió.** Los imprevistos suman exactamente lo que antes restaba el shock de golpe:
  $800 + $1.200 = **$2.000** en el mes 1, $1.500 + $1.000 = **$2.500** en el mes 2. Mismos umbrales,
  mismos puntos, mismos scores exactos en la suite.
- **No es un juego de apuesta a propósito.** No hay "retirarse a tiempo": el mes pasa igual y lo único que
  decidía el resultado ya se decidió antes. Mete la tensión de un Mines enseñando lo contrario — que es
  clave en un juego cuyo propio contenido enseña a no apostar.
- Dura ~7s. Por eso los `waitForSelector('#shock.on')` de la suite subieron a 25s.

## Crear sala vs. entrar (agosto 2026)

Antes había un solo botón y el proyector tenía que escribir el código **y además** acordarse de tocar
"Proyector: solo mirar". Ahora son dos caminos desde el home:

- **Crear sala · soy el proyector**: le viene un **código sorteado** de `CODIGOS` ya cargado. Toca Enter
  y es host. No configura nada más — no elige modo ni pone nombre.
- **Entrar a una sala**: escribe el código que ve en el proyector y el nombre del equipo.

El botón `#btnProyector` y `entrarProyector()` se eliminaron.

## La subasta a ciegas (agosto 2026)

**Lo único del juego donde los equipos compiten de verdad.** Hasta acá eran tres partidas paralelas con
un marcador compartido. Va al **arranque del mes 2**, entre el interludio y el mercado (`abrirSubasta()`
→ `mes2Mercado()`, screen `#subasta`).

- Una sola changa buena (`LOTE`, el mural, +$3.200). Cada equipo ofrece **horas en secreto**.
- **Subasta a primer precio: el que gana PAGA lo que ofertó.** Esas horas se le descuentan del mes
  (el lote entra a `OPS` con `h` = lo pujado y `fija:1`, así no lo puede soltar). Por eso ofertar alto
  tiene costo real: te quedás sin horas para el resto del mercado.
- **Resuelve el proyector**, que es el único que ve todas las pujas (`pujaRecibida` → `resolverSubasta`
  → broadcast `remate`). Esto es lo que hace que "solo el host arranca" sea necesario, no un capricho.
- **Empate o todos en cero: queda desierta.** Por eso los tests ofertan 0 y los scores exactos no cambian.
- **Desfasaje entre equipos:** el proyector espera **25s desde la primera puja** y resuelve con lo que haya;
  cada equipo auto-oferta a los 30s si no tocó nada. Al que llega tarde se le re-emite el remate ya cantado
  (`SALA.remate`) para que no quede colgado — pero no participa. Si los equipos van muy desfasados,
  alinealos antes con "Cerrar la fase en todas".

## Solo el proyector arranca la partida (agosto 2026)

Se eliminó `#btnArrancar` del lobby de los equipos: ahora ven "ESPERANDO QUE EL PROYECTOR ARRANQUE".
`arrancar()` corta de entrada si no es `SALA.spec`. Además de evitar arranques accidentales, es lo que
permite que el host sea el árbitro de la subasta.

**Ojo con los tests:** todo test que juegue necesita un host. Está el helper `salaLista(mk, code, nombre)`
que arma proyector + equipo y arranca.

## El mercado de a una (swipe) — agosto 2026

El mes 1 arranca en **`#swipe`**: una oferta por vez, a pantalla completa. Se arrastra a la derecha para
agarrarla (con sello **LA AGARRO**) o a la izquierda para pasar; también hay botones ✕ / ✓.

- **Solo en el mes 1.** En el mes 2 va la grilla directo, porque ahí hay que **comparar** lo que tenías
  con lo que quedó (ofertas que crecieron, que se pincharon, puertas cerradas), y de a una no se puede.
- **Al terminar la pila cae en la grilla** (`swSalir()`), para repasar antes de confirmar. El botón
  **"Ver todas juntas"** hace el mismo salto en cualquier momento: el swipe es para decidir rápido,
  la grilla para comparar. Los tests usan ese botón (`aGrilla()`).
- Si no le quedan horas, el ✓ se apaga solo y la tarjeta lo dice.
- **El reloj ya no vive en un id fijo**: `pintarGT()` pinta en `.screen.on .gtimer`, porque la fase 1
  ahora pasa por dos pantallas. `gT.el` pasó a ser `gT.act`.

## La pantalla de conseguir plata (agosto 2026)

- **Cabezal `#horason`** (mismo CSS que `#platon`): horas libres que le quedan en grande + barra +
  **extra conseguido** y **puntaje vivo**, los dos con `bumpSi()` cuando cambian.
- **Lo que ya no entra en las horas que quedan se apaga solo** (`.opCard.nohay`, recalculado en
  `pintarHoras`): antes tocabas y te rebotaba, ahora lo ves antes de tocar.
- El caso de Juan pasó de 4 líneas a 1. La tarjeta muestra **monto grande + chip de horas** (que es lo
  que se compara al decidir) y la descripción recortada a 2 líneas con `-webkit-line-clamp`.
- El caso tiene id propio (`#f1Caso`): antes se buscaba con `#f1 .caja`, que ahora agarraría el cabezal.
- La barra de abajo dejó de repetir el extra; muestra fuentes distintas e ingreso del mes.

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
- **Billetes que se arrastran** ($500 / $1.000 / $5.000, colores de la paleta oficial). Va con
  **pointer events, no con drag&drop de HTML5**: el de HTML5 no existe en touch y esto corre en
  notebooks y celulares. El clon que viaja es `#billVuela` con `pointer-events:none` para que
  `elementFromPoint` vea la tarjeta de abajo. El billete que ya no entra en lo que queda se apaga solo.
- **El tap en la tarjeta sigue sumando $500** y el teclado sigue andando: arrastrar es una forma más
  de repartir, no la única. Si se rompe el drag, el juego sigue jugable.
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
