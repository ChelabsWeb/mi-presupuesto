/* SUITE INTEGRAL — Mi Presupuesto (herramienta + Trimestre) */
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const U = 'http://localhost:' + (process.env.PORT || 8124) + '/index.html';
const esp = ms => new Promise(r => setTimeout(r, ms));
const R = []; // resultados
function ok(nombre, cond, detalle) { R.push([cond ? 'PASS' : 'FAIL', nombre, detalle || '']); if (!cond) console.log('  ✗', nombre, '→', detalle || ''); else console.log('  ✓', nombre); }

async function tecla(p, ch) { const l = ch === ' ' ? '␣' : ch; await p.locator('#salaTeclas button').filter({ hasText: new RegExp('^' + l + '$') }).first().click(); }
/* el equipo se ELIGE con un sticker (idx = posición en AVATARES: 0 CHANCHOS, 1 FLAMENCOS, 2 PULPOS, 3 TIBURONES, 4 ZORROS, 5 PERROS…).
   Si la máquina está retomando (snapshot con sticker), no hay grilla: aparece Retomar. */
async function entrar(p, code, idx) {
  await p.locator('#home button', { hasText: 'Entrar con código' }).click();
  for (const c of code) await tecla(p, c);
  await tecla(p, 'LISTO');
  await p.waitForFunction(() => document.querySelector('#avGrid .avBtn') || document.getElementById('btnRetomar').style.display !== 'none', null, { timeout: 30000 });
  if (await p.locator('#btnRetomar').isVisible()) return;
  await p.locator('#avGrid .avBtn').nth(idx || 0).click();
  await p.waitForFunction(() => /ADENTRO|CONECTADOS/.test(document.getElementById('lobbyEstado').textContent), null, { timeout: 30000 });
}
/* "Crear sala" sortea el código solo; para un código fijo los tests entran por "Proyector con código" */
async function crearSala(p, code) {
  await p.locator('#home button', { hasText: 'Proyector con código' }).click();
  for (let i = 0; i < 4; i++) await p.keyboard.press('Backspace');
  await p.keyboard.type(code);
  await p.keyboard.press('Enter');
}
/* el mes 2 arranca con la subasta a ciegas: ofertar 0 la deja desierta y no toca los scores */
async function pasarSubasta(p) {
  await p.waitForSelector('#subasta.on', { timeout: 15000 });
  await p.locator('#subOk').click();
  await p.waitForFunction(() => document.getElementById('subOk').textContent.includes('mes 2'), null, { timeout: 40000 });
  await p.locator('#subOk').click();
  await p.waitForSelector('#f1.on', { timeout: 10000 });
}
/* solo el proyector arranca: todo test que juegue necesita un host */
async function salaLista(mk, code, idx) {
  const H = await mk(), E = await mk();
  await H.goto(U); await E.goto(U);
  await crearSala(H, code);
  await entrar(E, code, idx || 0);
  await H.waitForFunction(() => document.querySelectorAll('#espCols .eqCol').length === 1, null, { timeout: 30000 });
  await H.locator('#espArrancar').click();
  return { H, E };
}
/* el mes 1 arranca en el mercado de a una; los tests van derecho a la grilla */
async function aGrilla(p) {
  await p.waitForSelector('#swipe.on', { timeout: 25000 });
  await p.locator('#swVerTodas').click();
  await p.waitForSelector('#f1.on', { timeout: 10000 });
}
async function confirmar(p) { await esp(600); await p.locator('#gbSig').click(); }

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  /* PW_CHANNEL=chrome usa el Chrome instalado en el sistema (si no se puede bajar el chromium de playwright) */
  /* PW_EXE=ruta/a/chrome.exe usa ese Chromium (p. ej. el de ms-playwright que ya está bajado) */
  const browser = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE } : process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const mk = async () => { const pg = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); pg._errs = []; pg.on('pageerror', e => pg._errs.push(e.message)); await pg.addInitScript(() => { try { sessionStorage.setItem('cpvCoach1', '1'); sessionStorage.setItem('cpvCoach2', '1'); } catch (e) {} }); return pg; };

  /* ══════════ T1 · HERRAMIENTA PERSONAL: matemática exacta + persistencia ══════════ */
  console.log('\n[T1] Herramienta personal');
  {
    const p = await mk();
    await p.goto(U); await esp(500);
    await p.getByRole('button', { name: /Armá tu presupuesto/ }).click(); await esp(300);
    await p.locator('#card_salario').click(); await p.locator('#in_salario').fill('12000');
    await p.locator('#card_flia').click(); await p.locator('#in_flia').fill('3000');
    await p.locator('#card_flia input[type=checkbox]').nth(0).check(); // techo 10000
    await esp(200);
    ok('T1.1 flia = manual+techo', (await p.locator('#in_flia').inputValue()) === '13000', await p.locator('#in_flia').inputValue());
    ok('T1.2 barra ingresos', (await p.locator('#bIng').textContent()) === '$25.000', await p.locator('#bIng').textContent());
    await p.locator('#bSig').click(); await esp(300);
    for (const [id, v] of [['vivienda', '8000'], ['alim', '5000'], ['transporte', '2000']]) { await p.locator('#card_' + id).click(); await p.locator('#in_' + id).fill(v); }
    await p.locator('#card_imprev').click(); await p.locator('#card_imprev .chip.sug').click(); await esp(200);
    const imprev = await p.locator('#in_imprev').inputValue(); // 5% de 25000 = 1250 → round(12.5)*100=1300
    ok('T1.3 chip 5%', imprev === '1300', imprev);
    await p.locator('#bSig').click(); await esp(700);
    ok('T1.4 balance', (await p.locator('#balanceN').textContent()) === '$8.700', await p.locator('#balanceN').textContent());
    ok('T1.5 detector olvidos visible', await p.locator('#olvBox').isVisible());
    ok('T1.6 olvida 3 (deuda/fondo/objetivo)', (await p.locator('.olvRow').count()) === 3, '' + await p.locator('.olvRow').count());
    await p.getByRole('button', { name: /Guardar mi plan/ }).click(); await esp(400);
    // persistencia + fliaMan tras recarga
    await p.reload(); await esp(600);
    ok('T1.7 Seguir el mío visible', await p.locator('#btnSeguir').isVisible());
    await p.locator('#btnSeguir').click(); await esp(300);
    await p.locator('#card_flia').click(); await esp(150);
    await p.locator('#card_flia input[type=checkbox]').nth(0).uncheck(); await esp(200);
    ok('T1.8 fliaMan sobrevive recarga', (await p.locator('#in_flia').inputValue()) === '3000', await p.locator('#in_flia').inputValue());
    await p.locator('#bSig').click(); await esp(200); await p.locator('#bSig').click(); await esp(600);
    ok('T1.9 vs mes pasado', (await p.locator('#vsPasado').textContent()).includes('8.700'), await p.locator('#vsPasado').textContent());
    ok('T1.10 sin errores JS', p._errs.length === 0, p._errs.join(';'));
    await p.context().close();
  }

  /* ══════════ T2 · TRIMESTRE COMPLETO: score EXACTO calculado a mano ══════════ */
  /* Recálculo tras el rebalanceo del mes 2 (shock 2 a ±2.500/umbral 2.500 y colchón sin precargar):
     A  31.775 − 500 (menos destino: el colchón ya no viene puesto en fondo)
               + 1.000 (shock 2 cubierto ahora vale 2.500)
               − 1.000 (el colchón sin repartir engorda la plata sin nombre: resto 2.400 → 4.400)
             = 31.275
     B  −11.950 − 1.000 (sin colchón, el shock 2 ahora resta 2.500) = −12.950
        (a B el colchón no lo toca: cerró el mes 1 en cero)                                     */
  console.log('\n[T2] Trimestre completo, 3 meses (scores exactos: A=47.700, B=−20.025)');
  const P = await mk(), A = await mk(), B = await mk();
  {
    await P.goto(U); await A.goto(U); await B.goto(U);
    await crearSala(P, 'CIEN');
    await entrar(A, 'CIEN', 3); await entrar(B, 'CIEN', 2); // A = TIBURONES, B = PULPOS
    await P.waitForFunction(() => document.querySelectorAll('#espCols .eqCol').length === 2, null, { timeout: 30000 });
    await P.locator('#espArrancar').click();
    await aGrilla(A); await aGrilla(B);
    // la grilla es sorteada: misma para toda la sala, distinta entre rondas
    const gridA = await A.evaluate(() => OPS.map(o => o.id).join(','));
    const gridB = await B.evaluate(() => OPS.map(o => o.id).join(','));
    ok('T2.0a misma grilla en las dos máquinas', gridA === gridB, gridA + ' | ' + gridB);
    ok('T2.0b salen 3 trampas de las 5', await A.evaluate(() => OPS.filter(o => o.trampa).length) === 3, gridA);
    // A: 5 buenas + la primera trampa que le tocó (cualquiera resta lo mismo y ninguna pasa de 1 h)
    for (const id of ['cari', 'perros', 'cafe', 'iva', 'juegos']) { await A.locator('#op_' + id).click(); await esp(70); }
    await A.locator('.opCard.trampa').first().click(); await esp(70);
    ok('T2.0c la trampa quedó elegida', await A.evaluate(() => OPS.some(o => o.trampa && G.ops[o.id])));
    await B.locator('#op_beca').click();
    await esp(700);
    // T2.1: proyector en vivo oculta scores
    const scEnVivo = await P.locator('#espCols .sc').first().textContent();
    ok('T2.1 score oculto en vivo (···)', scEnVivo.trim() === '···', scEnVivo);
    await confirmar(A);
    await A.waitForSelector('#evOv.on', { timeout: 8000 });
    ok('T2.2 modal trampa', (await A.locator('#evTit').textContent()).includes('plata rápida'));
    await A.locator('#evOps2 .op2').first().click();
    await A.waitForSelector('#evOv.on', { timeout: 8000 });
    await A.locator('#evOps2 .op2').nth(1).click(); // ev1 B
    await A.waitForSelector('#f2.on', { timeout: 8000 });
    await confirmar(B);
    await B.waitForSelector('#evOv.on', { timeout: 8000 });
    await B.locator('#evOps2 .op2').nth(2).click(); // ev1 C
    await B.waitForSelector('#f2.on', { timeout: 8000 });
    // B se queda quieto varios minutos mientras A juega: acá el reloj no debe cerrarle la fase
    // (el cierre automático por tiempo se prueba aparte, en T6)
    await B.evaluate(() => gTimer(2, 9999));
    // A ordena m1: destino 11500, resto 0
    await A.evaluate(() => { for (let i = 0; i < 3; i++) ajustar('snacks', -500); ajustar('subs', -500); for (let i = 0; i < 4; i++) ajustar('personal', -500);
      for (let i = 0; i < 4; i++) ajustar('imprev', 500); for (let i = 0; i < 4; i++) ajustar('fondo', 500); for (let i = 0; i < 15; i++) ajustar('objetivo', 500); });
    await confirmar(A); await A.waitForSelector('#shock.on', { timeout: 25000 });
    ok('T2.3 shockVer avisa austeridad', (await A.locator('#shockVer').textContent()).includes('agua y laburo'));
    await esp(700); await A.locator('#shockBtn').click();
    await A.waitForSelector('#inter.on', { timeout: 8000 });
    const inter = await A.locator('#interCard').textContent();
    ok('T2.4 boletín del mes con desglose', inter.includes('PUNTOS DEL MES 1') && inter.includes('fuentes') && inter.includes('aguantó'), '');
    const ptsM1 = await A.evaluate(() => G.pts);
    ok('T2.5 pts mes 1 exactos (15.375)', ptsM1 === 15375, '' + ptsM1);
    await A.getByRole('button', { name: /Vamos al mes 2/ }).click();
    await pasarSubasta(A);
    // proyector tardío entra ahora
    const P2 = await mk();
    await P2.goto(U);
    await crearSala(P2, 'CIEN');
    await P2.waitForFunction(() => document.getElementById('espEstado').textContent.includes('ASESORANDO'), null, { timeout: 30000 }).catch(() => {});
    ok('T2.6 proyector tardío ve el juego', (await P2.locator('#espEstado').textContent()).includes('ASESORANDO'), await P2.locator('#espEstado').textContent());
    await P2.context().close();
    // A mes 2: suelta perros, suma taller
    await A.locator('#op_perros2').click(); await esp(100);
    await A.locator('#op_taller2').click(); await esp(100);
    await confirmar(A);
    await A.waitForSelector('#evOv.on', { timeout: 8000 });
    await A.locator('#evOps2 .op2').nth(1).click(); // ev2 B
    await A.waitForSelector('#f2.on', { timeout: 8000 });
    await A.evaluate(() => { for (let i = 0; i < 4; i++) ajustar('imprev', 500); for (let i = 0; i < 3; i++) ajustar('fondo', 500); for (let i = 0; i < 8; i++) ajustar('objetivo', 500); ajustar('meta2', 500); });
    await confirmar(A);
    await A.waitForSelector('#evOv.on', { timeout: 8000 }); // modal sin nombre (resto 2400)
    ok('T2.7 modal sin nombre', (await A.locator('#evTit').textContent()).includes('sin nombre'));
    await A.locator('#evOps2 .op2').nth(1).click();
    await A.waitForSelector('#shock.on', { timeout: 25000 });
    await esp(700); await A.locator('#shockBtn').click();
    // A: mes 3 (el trimestre tiene tres meses)
    await A.waitForSelector('#inter.on', { timeout: 8000 });
    ok('T2.7b boletín del mes 2 con acumulado', (await A.locator('#interCard').textContent()).includes('ACUMULADO'));
    await A.locator('#interBtn').click();
    await A.waitForSelector('#f1.on', { timeout: 10000 });
    ok('T2.7c el mes 3 arranca con lo que sostuvo', await A.evaluate(() => G.mes === 3 && !!G.ops.cari3 && !!G.ops.taller3 && !!G.ops.iva3 && G.horas === 12));
    await A.locator('#op_bici3').click(); await esp(100);
    await confirmar(A);
    await A.waitForSelector('#evOv.on', { timeout: 8000 });
    ok('T2.7d evento de la tableta en vidriera', (await A.locator('#evTit').textContent()).toLowerCase().includes('tableta'));
    await A.locator('#evOps2 .op2').nth(1).click(); // ev3 B: al contado, ya juntó la plata (+600)
    await A.waitForSelector('#f2.on', { timeout: 8000 });
    await A.evaluate(() => { for (let i = 0; i < 2; i++) ajustar('snacks', 500); for (let i = 0; i < 2; i++) ajustar('personal', 500);
      for (let i = 0; i < 4; i++) ajustar('imprev', 500); for (let i = 0; i < 3; i++) ajustar('fondo', 500); for (let i = 0; i < 4; i++) ajustar('objetivo', 500); for (let i = 0; i < 4; i++) ajustar('meta2', 500); });
    await confirmar(A);
    await A.waitForSelector('#evOv.on', { timeout: 8000 }); // modal sin nombre (resto 2800)
    await A.locator('#evOps2 .op2').nth(1).click();
    await A.waitForSelector('#shock.on', { timeout: 25000 });
    ok('T2.7e colchón de acero al cerrar el trimestre', (await A.locator('#shockVer').textContent()).includes('ACERO'));
    await esp(700); await A.locator('#shockBtn').click();
    // B: retomar tras recarga (está en f2 mes 1)
    await B.evaluate(() => ajustar('snacks', -500)); await esp(400); // gProg persiste (marcador legal)
    await B.reload(); await esp(800);
    await entrar(B, 'CIEN', 2);
    ok('T2.8 botón Retomar visible', await B.locator('#btnRetomar').isVisible());
    await B.locator('#btnRetomar').click(); await esp(600);
    await B.evaluate(() => gTimer(2, 9999)); // idem: B sigue esperando a A
    ok('T2.9 retoma en fase 2 con plan intacto', await B.locator('#f2.on').count() === 1 && (await B.locator('#pl_snacks').textContent()) === '$1.000', await B.locator('#pl_snacks').textContent());
    const colsB = await P.evaluate(() => document.querySelectorAll('#espCols .eqCol').length);
    ok('T2.10 sin columna duplicada tras retomar', colsB === 2, '' + colsB);
    // B deshace el marcador para mantener la mate (resto 0 → confirma directo)
    await B.evaluate(() => ajustar('snacks', 500)); await esp(300);
    await confirmar(B); await B.waitForSelector('#shock.on', { timeout: 25000 });
    await esp(700); await B.locator('#shockBtn').click();
    await B.waitForSelector('#inter.on', { timeout: 8000 });
    await B.getByRole('button', { name: /Vamos al mes 2/ }).click();
    await pasarSubasta(B);
    ok('T2.11 fiado en caso mes 2', (await B.locator('#f1Caso').textContent()).includes('fiado'));
    await confirmar(B);
    await B.waitForSelector('#evOv.on', { timeout: 8000 });
    await B.locator('#evOps2 .op2').first().click(); // ev2 A: compra
    await B.waitForSelector('#f2.on', { timeout: 8000 });
    ok('T2.12 fila fiado bloqueada al mínimo', (await B.locator('#pl_fiado').textContent()) === '$2.000');
    await B.evaluate(() => ajustar('fiado', -500)); await esp(200);
    ok('T2.13 fiado no baja', (await B.locator('#pl_fiado').textContent()) === '$2.000');
    await confirmar(B); // plan en rojo
    ok('T2.14 guard plan en rojo', (await B.locator('#gbD2').textContent()).includes('ROJO'));
    await B.evaluate(() => { for (let i = 0; i < 6; i++) ajustar('personal', -500); for (let i = 0; i < 2; i++) ajustar('snacks', -500); });
    await confirmar(B); await esp(500);
    ok('T2.14d un vuelto de $100 no pide destino ni resta', await B.locator('#evOv.on').count() === 0);
    await B.waitForSelector('#shock.on', { timeout: 25000 });
    await esp(700); await B.locator('#shockBtn').click();
    // B: mes 3, con el fiado del mes 2 a cuestas y la tableta en cuotas
    await B.waitForSelector('#inter.on', { timeout: 8000 });
    await B.locator('#interBtn').click();
    await B.waitForSelector('#f1.on', { timeout: 10000 });
    ok('T2.14b el fiado del mes 2 viaja al mes 3', await B.evaluate(() => G.mes === 3 && G.fiado === 2500 && G.plan.fiado === 2500 && !!G.ops.beca3));
    await confirmar(B);
    await B.waitForSelector('#evOv.on', { timeout: 8000 });
    await B.locator('#evOps2 .op2').first().click(); // ev3 A: en 12 cuotas (−800 y $850 fijos)
    await B.waitForSelector('#f2.on', { timeout: 8000 });
    ok('T2.14c la cuota de la tableta aparece como gasto fijo', (await B.locator('#pl_cuota').textContent()) === '$850');
    await confirmar(B);
    await B.waitForSelector('#evOv.on', { timeout: 8000 }); // resto 650
    await B.locator('#evOps2 .op2').nth(1).click();
    await B.waitForSelector('#shock.on', { timeout: 25000 });
    await esp(700); await B.locator('#shockBtn').click();
    // podio + reveal + scores exactos
    await P.waitForFunction(() => document.getElementById('espEstado').textContent.includes('ASESORÓ') || document.getElementById('espEstado').textContent.includes('CERRADO'), null, { timeout: 30000 });
    ok('T2.15 reveal arranca', true);
    await P.waitForFunction(() => document.getElementById('espEstado').textContent.includes('TRIMESTRE CERRADO'), null, { timeout: 20000 });
    await esp(1200);
    const scores = await P.evaluate(() => Object.values(SALA.prog).map(p => ({ ini: p.ini, score: p.score })));
    const sA = scores.find(s => s.ini === 'TIBURONES').score, sB = scores.find(s => s.ini === 'PULPOS').score;
    ok('T2.16 score A exacto', sA === 47700, '' + sA + ' (esperado 47700)');
    ok('T2.17 score B exacto', sB === -20025, '' + sB + ' (esperado −20025)');
    const podio = await P.locator('#espCols').textContent();
    ok('T2.18 podio ordena A primero', podio.indexOf('TIBURONES') < podio.indexOf('PULPOS'));
    const analisis = await P.locator('#espMalas').textContent();
    ok('T2.19 análisis: acero + trampa + diferencia mula + cuotas', analisis.includes('TRES tormentas') && analisis.includes('plata rápida') && analisis.includes('parte del delito') && analisis.includes('cuotas'));
    await P.screenshot({ path: path.join(OUT, 'sui_podio.png'), fullPage: true });
    /* ══════════ T3 · REVANCHA ══════════ */
    console.log('\n[T3] Revancha');
    const seed1 = await A.evaluate(() => G.seed);
    await P.locator('#espArrancar').click();
    await aGrilla(A);
    await aGrilla(B);
    const chipR = await A.locator('#f1 .paso').textContent();
    const extraR = await A.locator('#horasExtra').textContent(); // el extra vive en el cabezal de la fase 1
    ok('T3.1 revancha reinicia mes 1', chipR.includes('MES 1'), chipR);
    ok('T3.2 extra en cero', extraR.includes('$0'), extraR);
    ok('T3.3 proyector resetea', !(await P.locator('#espMalas').isVisible()));
    const seed2 = await A.evaluate(() => G.seed);
    ok('T3.5 la revancha sortea otra grilla', seed2 !== seed1 && !!seed2, seed1 + ' → ' + seed2);
    ok('T3.6 y sigue igual en las dos máquinas', (await A.evaluate(() => OPS.map(o => o.id).join(','))) === (await B.evaluate(() => OPS.map(o => o.id).join(','))));
    ok('T3.4 sin errores JS (P/A/B)', P._errs.length + A._errs.length + B._errs.length === 0, [...P._errs, ...A._errs, ...B._errs].join(';'));
  }
  await P.context().close(); await A.context().close(); await B.context().close();

  /* ══════════ T4 · TIMEOUT DEL EVENTO (60s reales) ══════════ */
  console.log('\n[T4] Timeout del evento (esperando 62s…)');
  {
    const { H, E: p } = await salaLista(mk, 'SOLO', 0);
    ok('T4.1 el equipo no puede arrancar la partida', await p.locator('#btnArrancar').count() === 0);
    await aGrilla(p);
    await p.locator('#op_iva').click(); await confirmar(p);
    await p.waitForSelector('#evOv.on', { timeout: 8000 });
    const pts0 = await p.evaluate(() => G.pts);
    await esp(62000); // dejar vencer
    const tit = await p.locator('#evTit').textContent();
    ok('T4.2 Juan decidió solo', tit.includes('Juan decidió solo'), tit);
    const pts1 = await p.evaluate(() => ({ pts: G.pts, ev: G.ev1 }));
    ok('T4.3 sin puntos por timeout (ev=C, pts sin cambio)', pts1.pts === pts0 && pts1.ev === 'C', JSON.stringify(pts1));
    await p.locator('#evOps2 .op2').first().click();
    await p.waitForSelector('#f2.on', { timeout: 8000 });
    ok('T4.4 sigue a ordenar', true);
    ok('T4.5 sin errores JS', p._errs.length === 0, p._errs.join(';'));
    await p.context().close();
  }

  /* ══════════ T6 · RELOJ QUE CIERRA, TECLADO Y BOTÓN "TODO" ══════════ */
  console.log('\n[T6] Cierre automático, teclado y reparto rápido');
  {
    const { E: p } = await salaLista(mk, 'RELO', 1);
    await aGrilla(p);
    // hace falta ingreso extra real: con el plan inicial ($11.000) y solo $10.000 de sueldo, se arranca en rojo
    for (const id of ['iva', 'beca', 'juegos', 'cari']) { await p.locator('#op_' + id).click(); await esp(80); }
    // el reloj llega a cero → gracia → la fase se cierra sola (sin tocar Confirmar)
    await p.evaluate(() => { gT.gracia = true; gT.t = 1; pintarGT(); });
    await p.waitForSelector('#evOv.on', { timeout: 8000 });
    ok('T6.1 fase 1 se cierra sola al vencer el reloj', true);
    await p.locator('#evOps2 .op2').nth(2).click(); // ev1 C
    await p.waitForSelector('#f2.on', { timeout: 8000 });
    // el reloj se congela con un modal arriba
    const congelado = await p.evaluate(async () => { gTimer(2, 100); pausarGT(true); const a = gT.t; await new Promise(r => setTimeout(r, 2200)); return { a, b: gT.t }; });
    ok('T6.2 el reloj se congela con modal arriba', congelado.a === congelado.b, JSON.stringify(congelado));
    await p.evaluate(() => { pausarGT(false); gTimer(2, 9999); });
    // la tarjeta entera suma, y responde a teclado (antes solo a pointer)
    const antes = await p.locator('#pl_snacks').textContent();
    await p.locator('#row_snacks').press('Enter'); await esp(200);
    const despues = await p.locator('#pl_snacks').textContent();
    ok('T6.3 la tarjeta responde a teclado', antes === '$1.500' && despues === '$2.000', antes + ' → ' + despues);
    // arrastrar un billete: pointer events, tiene que andar igual con mouse y con dedo
    const bb = await p.locator('.bill.b1000').boundingBox();
    const dd = await p.locator('#row_fondo').boundingBox();
    const f0 = await p.evaluate(() => G.plan.fondo || 0);
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await p.mouse.down();
    await p.mouse.move(dd.x + dd.width / 2, dd.y + dd.height / 2, { steps: 10 });
    await esp(120);
    const resalta = await p.locator('#row_fondo.dropOk').count() === 1;
    await p.mouse.up(); await esp(300);
    const f1 = await p.evaluate(() => G.plan.fondo || 0);
    ok('T6.8 arrastrar un billete asigna su monto', f1 - f0 === 1000, f0 + ' → ' + f1);
    ok('T6.9 el destino se resalta al pasar por encima', resalta);
    ok('T6.10 no queda el clon volando', await p.locator('#billVuela').count() === 0);
    // soltar fuera de una tarjeta no debe asignar nada
    const a0 = await p.evaluate(() => asignado());
    const bb2 = await p.locator('.bill.b500').boundingBox();
    await p.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2);
    await p.mouse.down(); await p.mouse.move(12, 12, { steps: 6 }); await p.mouse.up(); await esp(250);
    ok('T6.11 soltar afuera no asigna', await p.evaluate(() => asignado()) === a0);
    // botón TODO: manda el sobrante entero a una etiqueta
    await p.locator('#row_objetivo .td').click(); await esp(250);
    const barra = await p.locator('#gbD2').textContent();
    ok('T6.4 TODO deja el reparto en cero', barra.includes('TODO REPARTIDO'), barra);
    const resto = await p.evaluate(() => disponible() - asignado());
    ok('T6.5 resto exacto = 0', resto === 0, '' + resto);
    await confirmar(p);
    await p.waitForSelector('#shock.on', { timeout: 25000 });
    ok('T6.6 confirma sin modal de plata sin nombre', true);
    ok('T6.7 sin errores JS', p._errs.length === 0, p._errs.join(';'));
    await p.context().close();
  }

  /* ══════════ T8 · EL MERCADO DE A UNA (swipe) ══════════ */
  console.log('\n[T8] Mercado de a una');
  {
    const { E: p } = await salaLista(mk, 'SWIP', 4);
    await p.waitForSelector('#swipe.on', { timeout: 25000 });
    ok('T8.1 el mes 1 arranca en el mercado de a una', true);
    const id0 = await p.evaluate(() => OPS[swIdx].id);
    // botón: la agarro
    await p.locator('#swSi').click(); await esp(250);
    ok('T8.2 el botón la agarra', await p.evaluate(i => !!G.ops[i], id0), id0);
    ok('T8.3 avanza a la siguiente', await p.evaluate(() => swIdx) === 1);
    // botón: paso
    const id1 = await p.evaluate(() => OPS[swIdx].id);
    await p.locator('#swNo').click(); await esp(250);
    ok('T8.4 el botón la descarta', await p.evaluate(i => !G.ops[i], id1) && await p.evaluate(() => swIdx) === 2);
    // flechas del teclado: → la agarra, ← pasa (en las notebooks del taller el trackpad es lento)
    const idK = await p.evaluate(() => OPS[swIdx].id);
    await p.keyboard.press('ArrowRight'); await esp(450);
    ok('T8.4b la flecha derecha la agarra', await p.evaluate(i => !!G.ops[i], idK) && await p.evaluate(() => swIdx) === 3, '' + await p.evaluate(() => swIdx));
    await p.keyboard.press('ArrowLeft'); await esp(450);
    ok('T8.4c la flecha izquierda pasa', await p.evaluate(() => swIdx) === 4);
    // arrastrar a la derecha = la agarra
    const id2 = await p.evaluate(() => OPS[swIdx].id);
    const c = await p.locator('#swCard').boundingBox();
    await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await p.mouse.down();
    await p.mouse.move(c.x + c.width / 2 + 200, c.y + c.height / 2, { steps: 12 });
    await esp(120);
    const selloVisible = await p.evaluate(() => +getComputedStyle(document.querySelector('#swCard .sello.si')).opacity > .5);
    await p.mouse.up(); await esp(500);
    ok('T8.5 el sello aparece al arrastrar', selloVisible);
    ok('T8.6 arrastrar a la derecha la agarra', await p.evaluate(i => !!G.ops[i], id2), id2);
    // sin horas, el botón se apaga solo
    await p.evaluate(() => { G.horas = 0; pintarSwipe(); });
    ok('T8.7 sin horas no se puede agarrar', await p.locator('#swSi').isDisabled());
    await p.evaluate(() => { G.horas = 12; pintarSwipe(); });
    // recorrer toda la pila cae en la grilla
    await p.evaluate(() => { swIdx = OPS.length - 1; pintarSwipe(); });
    await p.locator('#swNo').click();
    await p.waitForSelector('#f1.on', { timeout: 8000 });
    ok('T8.8 al terminar la pila cae en la grilla', true);
    ok('T8.8b sin pila no hay botón de volver', !(await p.locator('#f1Swipe').isVisible()));
    // de la grilla se puede volver a la pila mientras queden changas sin ver
    await p.evaluate(() => { swIdx = 3; pintarF1(); });
    ok('T8.8c con pila pendiente aparece el botón', await p.locator('#f1Swipe').isVisible());
    await p.locator('#f1Swipe').click();
    await p.waitForSelector('#swipe.on', { timeout: 8000 });
    ok('T8.8d vuelve a la pila donde la dejó', await p.evaluate(() => swIdx >= 3 && !G.ops[OPS[swIdx].id]));
    await p.locator('#swVerTodas').click(); await p.waitForSelector('#f1.on', { timeout: 8000 });
    ok('T8.9 sin errores JS', p._errs.length === 0, p._errs.join(';'));
    await p.context().close();
  }

  /* ══════════ T10 · TUTORIAL PARA PROYECTAR ══════════ */
  console.log('\n[T10] Tutorial');
  {
    const p = await mk();
    await p.goto(U);
    await p.locator('#home button', { hasText: 'Cómo se juega' }).click();
    await p.waitForSelector('#tuto.on', { timeout: 8000 });
    const total = await p.evaluate(() => TUTO.length);
    ok('T10.1 abre desde el home', (await p.locator('#tutoNum').textContent()).includes('1 DE ' + total));
    ok('T10.2 no se puede retroceder en la primera', await p.locator('#tutoAnt').isDisabled());
    // el docente pasa con las flechas, sin buscar el mouse en el proyector
    await p.keyboard.press('ArrowRight'); await esp(200);
    ok('T10.3 avanza con la flecha', (await p.locator('#tutoNum').textContent()).includes('2 DE'));
    await p.keyboard.press('ArrowLeft'); await esp(200);
    ok('T10.4 vuelve con la flecha', (await p.locator('#tutoNum').textContent()).includes('1 DE'));
    // todas las pantallas tienen título, texto y se pintan sin romper
    for (let i = 0; i < total - 1; i++) { await p.keyboard.press('ArrowRight'); await esp(90); }
    const ultima = await p.evaluate(() => ({ tit: tutoTit.textContent, txt: tutoTxt.textContent.length, vis: tutoVisual.children.length }));
    ok('T10.5 llega a la última entera', ultima.tit.length > 0 && ultima.txt > 40 && ultima.vis > 0, JSON.stringify(ultima));
    ok('T10.6 la última invita a jugar', (await p.locator('#tutoSig').textContent()).includes('jugar'));
    await p.locator('#tutoSig').click(); await esp(300);
    ok('T10.7 al terminar vuelve al home', await p.locator('#home.on').count() === 1);
    // y desde el proyector queda accesible antes de arrancar
    const H = await mk(); await H.goto(U);
    await crearSala(H, 'TUTO');
    await H.waitForSelector('#espTuto', { state: 'visible', timeout: 20000 });
    await H.locator('#espTuto').click();
    await H.waitForSelector('#tuto.on', { timeout: 8000 });
    await H.keyboard.press('Escape'); await esp(300);
    ok('T10.8 desde el proyector vuelve al proyector', await H.locator('#espectador.on').count() === 1);
    ok('T10.9 sin errores JS', p._errs.length + H._errs.length === 0, [...p._errs, ...H._errs].join(';'));
    await p.context().close(); await H.context().close();
  }

  /* ══════════ T9 · SUBASTA A CIEGAS ══════════ */
  console.log('\n[T9] Subasta a ciegas');
  {
    const H = await mk(), E1 = await mk(), E2 = await mk();
    await H.goto(U); await E1.goto(U); await E2.goto(U);
    await crearSala(H, 'PUJA');
    await entrar(E1, 'PUJA', 0); await entrar(E2, 'PUJA', 1); // CHANCHOS ofertan alto, FLAMENCOS bajo
    await H.waitForFunction(() => document.querySelectorAll('#espCols .eqCol').length === 2, null, { timeout: 30000 });
    await H.locator('#espArrancar').click();
    for (const p of [E1, E2]) await aGrilla(p);
    // saltar al estado de subasta: acá se prueba el remate, no el camino hasta él
    for (const p of [E1, E2]) await p.evaluate(() => { G.mes = 2; G.horas = 11; G.ops = {}; OPS = []; abrirSubasta(); });
    await esp(600);
    ok('T9.1 nadie ve la oferta del otro', (await E1.locator('#subEstado').textContent()).trim() === '');
    for (let i = 0; i < 5; i++) await E1.locator('.subB').last().click();
    for (let i = 0; i < 2; i++) await E2.locator('.subB').last().click();
    ok('T9.2 la puja sube con los botones', (await E1.locator('#subH').textContent()) === '5');
    await E1.locator('#subOk').click(); await esp(300);
    ok('T9.3 tras ofertar queda esperando', (await E1.locator('#subEstado').textContent()).includes('Esperando'));
    await E2.locator('#subOk').click();
    await E1.waitForFunction(() => document.getElementById('subOk').textContent.includes('mes 2'), null, { timeout: 30000 });
    await E2.waitForFunction(() => document.getElementById('subOk').textContent.includes('mes 2'), null, { timeout: 30000 });
    ok('T9.4 gana el que más ofrece', (await E1.locator('#subTit').textContent()).includes('ustedes'), await E1.locator('#subTit').textContent());
    ok('T9.5 el que pierde lo ve', (await E2.locator('#subTit').textContent()).includes('CHANCHOS'), await E2.locator('#subTit').textContent());
    ok('T9.6 se muestran todas las pujas al cerrar', (await E2.locator('#subEstado').textContent()).includes('FLAMENCOS: 2 h'));
    // el ganador PAGA lo que ofertó: esas horas ya no las tiene
    await E1.locator('#subOk').click();
    await E1.waitForSelector('#f1.on', { timeout: 10000 });
    ok('T9.7 el ganador paga las horas que ofertó', await E1.evaluate(() => horasTot()) === 5, '' + await E1.evaluate(() => horasTot()));
    ok('T9.8 y no puede soltar la changa que ganó', await E1.evaluate(() => OPS.find(o => o.id === 'lote').fija) === 1);
    await E2.locator('#subOk').click();
    await E2.waitForSelector('#f1.on', { timeout: 10000 });
    ok('T9.9 el perdedor conserva todas sus horas', await E2.evaluate(() => horasTot()) === 0);
    ok('T9.10 sin errores JS', H._errs.length + E1._errs.length + E2._errs.length === 0, [...H._errs, ...E1._errs, ...E2._errs].join(';'));
    await H.context().close(); await E1.context().close(); await E2.context().close();
  }

  /* ══════════ T7 · CONTROL DEL FACILITADOR + GUARD DE REINICIO ══════════ */
  console.log('\n[T7] Facilitador y guard de reinicio');
  {
    const PF = await mk(), EF = await mk();
    await PF.goto(U); await EF.goto(U);
    await crearSala(PF, 'FACI');
    await entrar(EF, 'FACI', 5);
    await PF.waitForFunction(() => document.querySelectorAll('#espCols .eqCol').length === 1, null, { timeout: 30000 });
    await PF.locator('#espArrancar').click();
    await aGrilla(EF);
    await PF.waitForSelector('#espForzar', { state: 'visible', timeout: 10000 });
    ok('T7.1 botón del facilitador visible con la ronda en juego', true);
    await PF.locator('#espForzar').click(); await esp(400); // primer toque = arma
    ok('T7.2 forzar pide confirmación', (await PF.locator('#espForzar').textContent()).includes('Tocá de nuevo'), await PF.locator('#espForzar').textContent());
    await PF.locator('#espForzar').click();
    await EF.waitForSelector('#evOv.on', { timeout: 10000 });
    ok('T7.3 el proyector cierra la fase de los equipos', true);
    // una máquina que entra tarde no puede reiniciarle la ronda a nadie: no tiene con qué
    const XF = await mk(); await XF.goto(U);
    await entrar(XF, 'FACI', 6);
    await XF.waitForFunction(() => Object.keys(SALA.prog || {}).length > 0, null, { timeout: 30000 });
    ok('T7.4 el que entra tarde no tiene botón de arrancar', await XF.locator('#btnArrancar').count() === 0);
    // y aunque mandara un start a mano, el equipo que juega lo ignora
    await XF.evaluate(() => SALA.ch.send({ type: 'broadcast', event: 'start', payload: { ronda: 99, seed: 7 } }));
    await esp(1500);
    ok('T7.5 el equipo en juego ignora el start ajeno', await EF.locator('#goOv.on').count() === 0 && await EF.locator('#evOv.on').count() === 1);
    ok('T7.6 sin errores JS', PF._errs.length + EF._errs.length + XF._errs.length === 0, [...PF._errs, ...EF._errs, ...XF._errs].join(';'));
    await PF.context().close(); await EF.context().close(); await XF.context().close();
  }

  /* ══════════ T11 · UN CÓDIGO SIN PROYECTOR NO ES UNA SALA ══════════ */
  console.log('\n[T11] Código sin sala');
  {
    const p = await mk(); await p.goto(U);
    await p.locator('#home button', { hasText: 'Entrar con código' }).click();
    for (const c of 'ZZQX') await tecla(p, c); await tecla(p, 'LISTO');
    await esp(2500);
    ok('T11.1 sin proyector no aparecen los stickers', !(await p.locator('#lobbyPick').isVisible()) && (await p.locator('#lobbyEstado').textContent()).includes('BUSCANDO'));
    await p.waitForFunction(() => document.getElementById('lobbyEstado').textContent.includes('NO HAY NINGUNA SALA'), null, { timeout: 15000 });
    ok('T11.2 a los segundos avisa que la sala no existe', true);
    await p.locator('#btnCodigo').click(); await esp(300);
    ok('T11.3 vuelve a la pantalla de código con el código precargado', await p.locator('#sala.on').count() === 1 && (await p.evaluate(() => sCode.join(''))) === 'ZZQX');
    ok('T11.4 sin errores JS', p._errs.length === 0, p._errs.join(';'));
    await p.context().close();
  }

  /* ══════════ T5 · ESTÁTICOS ══════════ */
  console.log('\n[T5] Chequeos estáticos');
  {
    const fs = require('fs');
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const usados = [...new Set([...h.matchAll(/\$\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1]))].filter(x => !x.startsWith('card_') && !x.startsWith('in_') && !x.startsWith('val_') && !x.startsWith('op_') && !x.startsWith('pl_') && !x.startsWith('row_') && !x.startsWith('timer'));
    const defs = new Set([...h.matchAll(/id="([A-Za-z0-9_]+)"/g)].map(m => m[1]));
    const faltan = usados.filter(u => !defs.has(u));
    ok('T5.1 IDs referenciados existen', faltan.length === 0, faltan.join(','));
    ok('T5.2 sw v4', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('cpvpresu-v4'));
    ok('T5.3 piel tablero de mesa, fuentes embebidas (sin Google Fonts)', h.includes("font-family:'Fredoka'") && h.includes("font-family:'Nunito'") && h.includes("'Chivo Mono'") && h.includes('--kraft:') && !h.includes('fonts.googleapis'));
    ok('T5.4 los 12 stickers están en el sprite', new Set([...h.matchAll(/<symbol id="av-([a-z]+)"/g)].map(m => m[1])).size === 12);
    ok('T5.5 sin restos de pieles viejas', !h.includes('#2B0A50') && !h.includes('--cinta') && !h.includes('backdrop-filter') && !h.includes("'Archivo Black'"));
    ok('T5.6 ninguna changa ni etiqueta quedó con ícono de línea', !/ic:'i-[a-z]+'/.test(h));
  }

  console.log('\n════════ RESUMEN ════════');
  const fails = R.filter(r => r[0] === 'FAIL');
  R.forEach(r => console.log(r[0], r[1], r[2] ? '· ' + r[2] : ''));
  console.log(`\n${R.length - fails.length}/${R.length} PASS ${fails.length ? '· ' + fails.length + ' FAIL' : '· TODO VERDE'}`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('ABORTO:', e.message); process.exit(2); });
