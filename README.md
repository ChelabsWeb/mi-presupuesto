# Mi Presupuesto · El Trimestre de Juan — Central para Vos (BCU Educa)

**[▶ Abrir](https://chelabsweb.github.io/mi-presupuesto/)** — el juego por equipos del **Taller 2 "Presupuesto y Opciones"** del programa Pin! (INJU/MIDES + BCU): *expandir ingresos, ordenar gastos*. Y adentro, el armador de presupuesto personal.

## El Trimestre de Juan (modo sala: 2-3 máquinas + proyector, ~25 min)

Los equipos son **asesores de Juan Ignacio** (19, La Teja, gana $10.000 en un café, quiere una tableta de $8.000, 12 horas libres por semana) durante **tres meses**. Gana el mejor plan, no el que más junta.

- **Equipos con sticker.** Cada máquina entra con el código del proyector y **elige un animal** (Tiburones, Pulpos, Zorros…): no se tipea nada. Los mismos 12 stickers que el juego 12 Meses.
- **Conseguir plata.** En el mes 1 las changas pasan **de a una** (a la derecha la agarran, a la izquierda pasan); en los meses 2 y 3 se compara en grilla lo que creció, lo que se pinchó y lo que cerró. Cada tarjeta dice cuánto rinde **por hora**. Entre medio hay tarjetas **PLATA RÁPIDA** sorteadas: parecen el mejor negocio y no lo son.
- **Ponerle nombre a cada peso.** Billetes que se arrastran a cada etiqueta. Las amarillas (imprevistos, fondo, tableta, meta 2) dan puntos; en $0 restan; la plata sin nombre se evapora.
- **El mes, día por día.** Se destapan los 30 días y caen los imprevistos ($2.000, $2.500 y $3.000: cada mes pega más fuerte). El colchón los absorbe… o Juan va al fiado, que se paga el mes siguiente.
- **Un evento por mes** con opciones A/B/C y reloj: el cliente urgente, la oferta "imperdible" en cuotas y, en el mes 3, **la tableta en vidriera** (contado, 12 cuotas "sin interés" o pedirle a un amigo).
- **Subasta a ciegas** entre el mes 1 y el 2: un solo mural para toda la sala, se ofrece en horas y el que gana **las paga**.
- **Boletín del mes** en cada máquina: veredicto grande (el colchón aguantó / no alcanzó) y cada renglón con su signo y sus puntos.
- **Proyector tipo host:** código siempre visible, reloj, guía de la fase en grande, leaderboard por plata conseguida (el puntaje va oculto), subasta cantada en vivo, reveal de quién aguantó cada mes y podio literal con análisis para la charla de cierre.

Requiere internet (Supabase Realtime, solo canales; sin base de datos). **[Guía del facilitador](GUIA-FACILITADOR.md)** con el guion minuto a minuto.

## Mi Presupuesto (herramienta personal)

Armá tu presupuesto en 3 pasos y 5 minutos, con la cartilla del taller: las **9 fuentes de ingreso** (con calculadora de la *ayuda invisible*), las **13 etiquetas de gasto** (las 9 clásicas + las 4 que todos olvidan), balance, **detector de olvidos**, comparación con el hogar uruguayo promedio, jugadas personalizadas y constancia imprimible. Guarda el plan en el dispositivo y lo compara con el mes anterior.

## Cómo está hecho

Un solo `index.html` (HTML + CSS + JS vanilla, sin build), fuentes embebidas (Archivo, Archivo Black y Chivo Mono: anda sin internet salvo el modo sala), `sw.js` para offline. **Mismo sistema visual que [12 Meses](https://github.com/ChelabsWeb/endeudarse-bien-stand)**: papel cálido, tinta azul, paleta oficial BCU · Central para Vos, botones con canto, cero degradados.

Tests: `cd tests && npm install && node server.js &` y `node suite.js` (Playwright; ver `tests/README.md`). Deploy: push a `main` → GitHub Pages.

Stickers de equipo: [Twemoji](https://github.com/jdecked/twemoji) · CC BY 4.0. Ver [TRASPASO.md](TRASPASO.md) para retomar el proyecto.
