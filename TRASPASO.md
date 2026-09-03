# Traspaso — Mi Presupuesto / El Trimestre de Juan (Taller 2 BCU)

> Documento para retomar el proyecto. Todo lo que hay que saber para seguir sin arrancar de cero.

## Qué es

Juego web para el **Taller 2 "Presupuesto y Opciones"** del programa Pin! (BCU, Central para Vos). Dos cosas en un solo archivo:

1. **El Trimestre de Juan** (el juego por equipos, lo principal): para el taller con ~20 gurises en **2-3 máquinas + proyector**.
   Los equipos asesoran a Juan (19, La Teja, gana $10.000, quiere una tableta de $8.000) durante **3 meses simulados**.
   Dura ~25 min. Termina con podio y análisis en el proyector.
2. **Mi Presupuesto** (herramienta personal): un armador de 3 pasos (ingresos → gastos → plan) con la data del taller.

## Links

- **En vivo:** https://chelabsweb.github.io/mi-presupuesto/
- **Repo:** https://github.com/ChelabsWeb/mi-presupuesto
- **Deploy:** GitHub Pages, automático con cada `git push` a `main`. No hay build.

## Cómo está hecho (stack)

- **Un solo `index.html`** (~2.900 líneas): HTML + CSS + JS vanilla, sin frameworks, sin build.
  **Fuentes embebidas en base64** (Fredoka, Nunito, Chivo Mono). Nada de Google Fonts: anda sin internet salvo el modo sala.
- **`sw.js`**: service worker (cachea para offline; red-primero). Al cambiar el HTML subí el número de `C` (hoy `cpvpresu-v4`), la suite lo chequea.
- **`tests/suite.js`**: suite E2E con Playwright (ver abajo).
- **Multijugador sin servidor propio:** **Supabase Realtime** (solo canales broadcast/presence, sin base de datos). Proyecto "Sistema EDO by Chelabs". La API key del código es **publishable** (pública por diseño).

## Edición BCU Educa (septiembre 2026): qué cambió

Pedido: polish visual anti-slop como el de 12 Meses, **más fácil y entendible, más divertido y un poco más largo**.

1. **Piel "tablero de mesa"** (elegida por el usuario entre seis direcciones: cartón kraft con puntitos, cartas troqueladas con doble marco `.carta`, fichas de madera `.ficha`, botones con sombra dura desplazada, marco de madera en el proyector). Fuentes **Fredoka** (display, `--font-display`) + **Nunito** (UI) + Chivo Mono (relojes/números tabulares), las tres embebidas en base64 (sin Google Fonts). Tokens en `:root`: `--kraft`, `--crema`, `--cremita`, `--tinta` (marrón-negro), `--rojo` ladrillo, `--lima` y `--amarillo` oficiales, `--madera`.
   - Los nombres de variables viejas (`--papel`, `--azul`, `--violeta`, `--ink-2`, `--surface-violeta`, `--magenta-txt`, `--verdeTxt`…) siguen existiendo como **alias** en `:root`, porque el JS y el HTML emiten estilos inline con esos nombres. No los borres.
   - **Íconos = Twemoji** (`<symbol id="e-<codepoint>">` en el sprite, CC BY 4.0), un dibujo por changa/etiqueta (`ic:'e-…'` en `OPORTUNIDADES`, `TRAMPAS`, `mercadoMes2/3`, `JGASTOS`, `JOLV`, `INGRESOS`, `GASTOS`, `OLVIDADAS`). Se pintan con `icoSvg(id)`: clase `tw` (relleno) para `e-…`, `ic` (trazo) para los `i-…` de la UI. Para sumar uno: bajar el SVG de `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/<codepoint>.svg`, envolverlo en `<symbol id="e-<codepoint>" viewBox="0 0 36 36">` y meterlo en el sprite.
   - **Menos texto**: la carta del mercado tiene `corta` (una línea) y el "?" abre la `nota` completa (`verNota`); los eventos son cortos en la máquina y la historia larga (`EV_LARGO`) la muestra el proyector mientras algún equipo está `DECIDIENDO` (etapa `evento`/`trampa` en el latido, `evActual`); el boletín agrupa los renglones por `g` (plata/guardado/golpe/bonus/resta) y pliega el detalle; el cierre del mes es sello + dos números + chips (`#shockSello`, `#shockNums`, `#shockVer`); el lobby explica con tres fichas.
   - El proyector tiene **pista** (`#espPista`): cada sticker avanza según la plata conseguida (el puntaje sigue oculto).
2. **Equipos con sticker, sin tipear.** El lobby muestra los 12 animales de 12 Meses (`AVATARES`, `<symbol id="av-K">` en el sprite, Twemoji CC BY 4.0: mantener el crédito en `#credito`, README y acá). `SALA.av` viaja por presence, `prog`, `fin` y `puja`; los tomados se apagan (`avTomados`); al recibir `start` un equipo sin sticker recibe uno libre (`avLibre`). El nombre del equipo es el del animal. `retomar` guarda `av` en el snapshot.
3. **Tres meses de verdad.** El motor se generalizó: `MESES[n]` (horas, relojes `t1`/`t2`, `umbral`, `pts`, `golpe`, `imprevistos`), `cerrarMes()` reemplaza a `shock1/shock2`, `irMes(n)` a `irMes2`, `mercadoDe(n)` incluye `mercadoMes3()`. Fase en el latido = `(mes-1)*2+fase` (1..6). El mes 3: mercado que consolida lo sostenido (cliente fijo, cantina, taller, otro mural si ganaron la subasta), **evento de la tableta en vidriera** (`evento3`: contado / 12 cuotas / amigo; las cuotas meten `G.cuota=850` como gasto fijo y `G.tabletaCuotas`), tres imprevistos ($3.000). Umbrales: 2.000 / 2.500 / 3.000. Colchón de acero = los tres (+1.500). La tableta en cuotas **no** cobra el bonus de +1.500.
4. **Boletín del mes** (`mostrarInterludio`): cada renglón que suma o resta queda anotado en `G.bol` durante `cerrarMes()` y se muestra con signo y puntos; veredicto grande arriba; total del mes y acumulado. Es la misma cuenta de siempre, legible.
5. **El proyector guía y festeja**: `guiaDe(mes,etapa,fase)` pinta la instrucción de la fase del equipo más avanzado (`#espGuia`); `pintarEspSub` + `revelarSubasta` cantan la subasta (quién ofertó, remate de menor a mayor); `revelarMesSiToca` muestra "PASÓ EL MES n" con quién aguantó cuando todos los vivos pasaron el mes (`SALA.revelados`); el podio final es literal (bloques 2º-1º-3º, `#espCols.podio`) con el detalle por equipo en `#espDetalle` y el análisis en `#espMalas`.
6. Chiquitas: mute (`toggleMute`, `localStorage cpv_mute`), letras A/B/C en los eventos, el caso de Juan en chips (`chipsJuan`), `body[data-screen]` para mover el mute donde no pise relojes, el `subEstado` va antes del botón.

## Cómo se juega en el taller

1. **Proyector:** "Crear sala" y listo: sortea un código (`codigoNuevo`, ~40 palabras de 4 letras) y entra directo como host con el código gigante. Para volver a entrar a una sala que ya anda (proyector tardío, recarga) o para los tests: "Proyector con código" (`verSala('hostcode')`).
2. **Equipos:** "Entrar con código" → el código → tocan un sticker. Aparecen en el proyector.
3. Desde el proyector se toca **¡Arrancar!** (solo el host puede).
4. Tres meses; puntaje oculto (`···`) hasta el **reveal final** con podio y análisis.

## Los tests (importantísimo si tocás la economía)

```bash
cd tests
npm install                  # playwright
node server.js &             # servidor estático en :8124
PW_EXE=C:/Users/.../ms-playwright/chromium-1228/chrome-win64/chrome.exe node suite.js   # o npx playwright install chromium y sin PW_EXE
```

- **T1** herramienta personal, **T2** el trimestre completo de 3 meses con dos equipos, **T3** revancha, **T4** timeout real de 60s, **T5** estáticos, **T6** reloj que cierra + teclado + billetes + TODO, **T7** control del facilitador, **T8** swipe, **T9** subasta, **T10** tutorial.
- **T2 tiene puntajes exactos calculados a mano**: `TIBURONES (A) = 47.700`, `PULPOS (B) = −20.025`. Dependen de **todas** las constantes de la economía. Si tocás una, recalculá a mano y actualizá. El camino y la cuenta de cada equipo, mes por mes:
  - **A** mes 1: cari+perros+cafe+iva+juegos+trampa (−1.500), evento B (+500), plan snacks 0 / subs 0 / personal 1.500 / imprev 2.000 / fondo 2.000 / objetivo 7.500 → extra 7.000 + destino 5.875 + fuentes 1.000 − austero 1.000 + tableta 1.500 + golpe 2.000 = **15.375**.
    Mes 2: suelta perros2, suma taller2 (extra 7.400, 3 fuentes), evento B (+400), imprev 2.000 / fondo 1.500 / objetivo 4.000 / meta2 500, resto 4.400 (−2.200), soltó perros (+500), austero (−1.000), golpe +2.500 → **28.275**.
    Mes 3: + bici3 (extra 8.300, 4 fuentes), evento B contado (+600), snacks 1.000 / personal 2.500 / imprev 2.000 / fondo 1.500 / objetivo 2.000 / meta2 2.000, resto 2.800 (−1.400), golpe +3.000, acero +1.500, tableta +1.500, meta2 +500 → **47.700**.
  - **B** mes 1: solo beca, evento C (+200), plan por defecto → 3 olvidadas (−4.500), golpe −2.000 → **−5.300**. Mes 2: fiado 2.000, evento A (−600, −$1.900), recorta personal/snacks, resto 100 (vuelto: 0), 3 olvidadas, austero, golpe −2.500 → **−12.900**. Mes 3: fiado 2.500, evento A cuotas (−800, cuota $850), resto 650 (−325), 2 olvidadas (la tableta ya no cuenta), austero, golpe −3.000 → **−20.025**.
- Los tests desactivan el tutorial (coach) vía `sessionStorage` para poder correr directo.
- Ojo con la subasta en los tests: ofertar 0 la deja desierta y no toca los scores.

## Cómo funciona la economía (resumen)

- Juan gana $10.000 fijo + lo que consigan en changas/ventas (12 h en el mes 1, 11 en el 2, 12 en el 3).
- **Trampas "PLATA RÁPIDA"** (5; salen 3 sorteadas por ronda con el `seed` del `start`, iguales en toda la sala). Al confirmar se anulan y restan −1.500 c/u.
- **Repartir:** las etiquetas amarillas dan puntos (`ptsDest` con rendimiento decreciente a partir de $4.000); en $0 restan; la plata sin nombre resta la mitad **a partir de $500** (menos es vuelto: con billetes de $500 no se puede dejar en cero, así que no pide destino ni resta).
- **Golpes:** los imprevistos de cada mes suman exactamente el umbral (`MESES[n].umbral`); aguantarlos ±`MESES[n].pts`. El colchón sobrante pasa al mes siguiente **sin etiqueta** (`G.arr`); si no alcanzó, el faltante viaja como **fiado** (fila fija al mínimo).
- Detalle: `scoreAhora`, `cerrarMes`, `irMes`, `mercadoMes2/3`, `evento1/2/3`, `finDelEquipo`.

## El host (proyector)

Código fijo arriba a la izquierda, reloj (el del equipo al que más le falta) arriba a la derecha, guía de fase, leaderboard por plata conseguida (el puntaje oculto), pie con el desglose "MES n DE 3 · 2 CONSIGUIENDO · 1 REPARTIENDO". `estadoDe(r)` da rótulos cortos. `pintarEsp` no repinta durante un reveal (`SALA.revelando`, `SALA.subRevelando`).

## La subasta a ciegas

Entre el interludio del mes 1 y el mercado del mes 2 (`abrirSubasta` → `mes2Mercado`). Subasta a primer precio: el que gana paga las horas (el lote entra a `OPS` con `fija:1`). Resuelve el proyector (`pujaRecibida` → `resolverSubasta` → broadcast `remate`); espera 25 s desde la primera puja; cada equipo auto-oferta a los 30 s. Empate o todos en cero: desierta.

## Trampas técnicas conocidas

- **Pointer events, no drag&drop de HTML5** para billetes y swipe (touch).
- La tarjeta de reparto es `role="button"` (no `<button>`, no se pueden anidar botones).
- El reloj se pinta en `.screen.on .gtimer` (`pintarGT`), porque la fase 1 pasa por dos pantallas.
- `.opCard` necesita `overflow:visible` para que el badge PLATA RÁPIDA no se recorte (el recorte de 2 líneas vive en `.tt`).
- La carta del mercado (`.swCard`) es una grilla de filas de altura fija: no cambia de tamaño entre changas. Si agregás una fila, sumala a `grid-template-rows`. Se decide con el dedo, los botones o las flechas ← → (`swVolar`); desde la grilla se vuelve a la pila con `volverSwipe` (saltea lo ya agarrado).
- Al arrancar pasados de horas (mes 2 y 3), `pintarHoras` marca con `.peor` la changa elegida que menos rinde por hora.
- El reveal "PASÓ EL MES n" del proyector queda hasta que algún equipo arranca el mes siguiente (o 60 s).
- Twemoji se pinta con relleno: nunca le pongas la clase `ic` (que fuerza `fill:none`) a un `e-…`.
- `.wizHead` es una grilla `paso/h2 | timer`: el reloj no se cae a una segunda fila con títulos largos.
- El coach y los eventos pausan el reloj (`pausarGT`).
- `evento3` se decide **después** de `irMes(3)`: la cuota se agrega al plan en el propio evento (`G.plan.cuota=850`), no en `irMes`.

## Pendientes / ideas para seguir

- Probarlo en el proyector real del taller.
- **Validar con el equipo pedagógico del BCU** las 2 trampas más nuevas (`kit`, `sobrepago`) y el evento de la tableta en cuotas (montos y mensaje).
- El badge naranja PLATA RÁPIDA sigue siendo 1:1 con "es trampa" (decisión pedagógica pendiente).
- Rotar también eventos y shocks entre rondas (hoy solo rotan las trampas).
- Integrar el desafío viral "$30.000 alcanzan" como modo reto aparte.
