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
async function entrar(p, code, nom) {
  await p.locator('#home button', { hasText: 'equipos' }).click();
  for (const c of code) await tecla(p, c);
  await tecla(p, 'LISTO'); for (const c of nom) await tecla(p, c); await tecla(p, 'LISTO');
  await p.waitForSelector('#btnArrancar', { state: 'visible', timeout: 15000 });
}
async function confirmar(p) { await esp(600); await p.locator('#gbSig').click(); }

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  /* PW_CHANNEL=chrome usa el Chrome instalado en el sistema (si no se puede bajar el chromium de playwright) */
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const mk = async () => { const pg = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); pg._errs = []; pg.on('pageerror', e => pg._errs.push(e.message)); await pg.addInitScript(() => { try { sessionStorage.setItem('cpvCoach1', '1'); sessionStorage.setItem('cpvCoach2', '1'); } catch (e) {} }); return pg; };

  /* ══════════ T1 · HERRAMIENTA PERSONAL: matemática exacta + persistencia ══════════ */
  console.log('\n[T1] Herramienta personal');
  {
    const p = await mk();
    await p.goto(U); await esp(500);
    await p.getByRole('button', { name: /Armarlo/ }).click(); await esp(300);
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
  console.log('\n[T2] Trimestre completo (scores exactos: A=31.275, B=−12.950)');
  const P = await mk(), A = await mk(), B = await mk();
  {
    await P.goto(U); await A.goto(U); await B.goto(U);
    await P.locator('#home button', { hasText: 'equipos' }).click();
    for (const c of 'CIEN') await tecla(P, c);
    await P.getByRole('button', { name: /Proyector/ }).click();
    await entrar(A, 'CIEN', 'LOS CAPOS'); await entrar(B, 'CIEN', 'TIBURONES');
    await P.waitForFunction(() => document.querySelectorAll('#espCols .eqCol').length === 2, null, { timeout: 30000 });
    await P.locator('#espArrancar').click();
    await A.waitForSelector('#f1.on', { timeout: 20000 }); await B.waitForSelector('#f1.on', { timeout: 20000 });
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
    ok('T2.4 interludio con desglose', inter.includes('PUNTOS DEL MES 1') && inter.includes('Fuentes de ingreso'), '');
    const ptsM1 = await A.evaluate(() => G.pts);
    ok('T2.5 pts mes 1 exactos (15.375)', ptsM1 === 15375, '' + ptsM1);
    await A.getByRole('button', { name: /Vamos al mes 2/ }).click();
    await A.waitForSelector('#f1.on', { timeout: 8000 });
    // proyector tardío entra ahora
    const P2 = await mk();
    await P2.goto(U);
    await P2.locator('#home button', { hasText: 'equipos' }).click();
    for (const c of 'CIEN') await tecla(P2, c);
    await P2.getByRole('button', { name: /Proyector/ }).click();
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
    // B: retomar tras recarga (está en f2 mes 1)
    await B.evaluate(() => ajustar('snacks', -500)); await esp(400); // gProg persiste (marcador legal)
    await B.reload(); await esp(800);
    await entrar(B, 'CIEN', 'TIBURONES');
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
    await B.waitForSelector('#f1.on', { timeout: 8000 });
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
    await confirmar(B);
    await B.waitForSelector('#evOv.on', { timeout: 8000 }); // resto 100
    await B.locator('#evOps2 .op2').nth(1).click();
    await B.waitForSelector('#shock.on', { timeout: 25000 });
    await esp(700); await B.locator('#shockBtn').click();
    // podio + reveal + scores exactos
    await P.waitForFunction(() => document.getElementById('espEstado').textContent.includes('ASESORÓ') || document.getElementById('espEstado').textContent.includes('CERRADO'), null, { timeout: 30000 });
    ok('T2.15 reveal arranca', true);
    await P.waitForFunction(() => document.getElementById('espEstado').textContent.includes('TRIMESTRE CERRADO'), null, { timeout: 20000 });
    await esp(1200);
    const scores = await P.evaluate(() => Object.values(SALA.prog).map(p => ({ ini: p.ini, score: p.score })));
    const sA = scores.find(s => s.ini === 'LOS CAPOS').score, sB = scores.find(s => s.ini === 'TIBURONES').score;
    ok('T2.16 score A exacto', sA === 31275, '' + sA + ' (esperado 31275)');
    ok('T2.17 score B exacto', sB === -12950, '' + sB + ' (esperado −12950)');
    const podio = await P.locator('#espCols').textContent();
    ok('T2.18 podio ordena A primero', podio.indexOf('LOS CAPOS') < podio.indexOf('TIBURONES'));
    const analisis = await P.locator('#espMalas').textContent();
    ok('T2.19 análisis: acero + trampa + diferencia mula', analisis.includes('DOS tormentas') && analisis.includes('plata rápida') && analisis.includes('parte del delito'));
    await P.screenshot({ path: path.join(OUT, 'sui_podio.png'), fullPage: true });
    /* ══════════ T3 · REVANCHA ══════════ */
    console.log('\n[T3] Revancha');
    const seed1 = await A.evaluate(() => G.seed);
    await P.locator('#espArrancar').click();
    await A.waitForSelector('#f1.on', { timeout: 20000 });
    await B.waitForSelector('#f1.on', { timeout: 20000 });
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
    const p = await mk();
    await p.goto(U);
    await entrar(p, 'SOLO', 'UNITARIO');
    await p.locator('#btnArrancar').click(); await esp(700); // aviso única máquina
    ok('T4.1 aviso única máquina', (await p.locator('#lobbyEstado').textContent()).includes('ÚNICA'));
    await p.locator('#btnArrancar').click();
    await p.waitForSelector('#f1.on', { timeout: 20000 });
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
    const p = await mk();
    await p.goto(U);
    await entrar(p, 'RELO', 'CRONOS');
    await p.locator('#btnArrancar').click(); await esp(700);
    await p.locator('#btnArrancar').click();
    await p.waitForSelector('#f1.on', { timeout: 20000 });
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

  /* ══════════ T7 · CONTROL DEL FACILITADOR + GUARD DE REINICIO ══════════ */
  console.log('\n[T7] Facilitador y guard de reinicio');
  {
    const PF = await mk(), EF = await mk();
    await PF.goto(U); await EF.goto(U);
    await PF.locator('#home button', { hasText: 'equipos' }).click();
    for (const c of 'FACI') await tecla(PF, c);
    await PF.getByRole('button', { name: /Proyector/ }).click();
    await entrar(EF, 'FACI', 'MESA UNO');
    await PF.waitForFunction(() => document.querySelectorAll('#espCols .eqCol').length === 1, null, { timeout: 30000 });
    await PF.locator('#espArrancar').click();
    await EF.waitForSelector('#f1.on', { timeout: 20000 });
    await PF.waitForSelector('#espForzar', { state: 'visible', timeout: 10000 });
    ok('T7.1 botón del facilitador visible con la ronda en juego', true);
    await PF.locator('#espForzar').click(); await esp(400); // primer toque = arma
    ok('T7.2 forzar pide confirmación', (await PF.locator('#espForzar').textContent()).includes('Tocá de nuevo'), await PF.locator('#espForzar').textContent());
    await PF.locator('#espForzar').click();
    await EF.waitForSelector('#evOv.on', { timeout: 10000 });
    ok('T7.3 el proyector cierra la fase de los equipos', true);
    // una máquina que entra tarde no debe poder reiniciarle la ronda a todos de un toque
    const XF = await mk(); await XF.goto(U);
    await entrar(XF, 'FACI', 'TARDE');
    await XF.waitForFunction(() => Object.keys(SALA.prog || {}).length > 0, null, { timeout: 30000 });
    await XF.locator('#btnArrancar').click(); await esp(700);
    ok('T7.4 avisa antes de reiniciar una ronda en curso', (await XF.locator('#lobbyEstado').textContent()).includes('EN CURSO'), await XF.locator('#lobbyEstado').textContent());
    // aunque el aviso se ignore, el equipo que está jugando no se reinicia
    await XF.locator('#btnArrancar').click(); await esp(1500);
    ok('T7.5 el equipo en juego ignora el start ajeno', await EF.locator('#goOv.on').count() === 0 && await EF.locator('#evOv.on').count() === 1);
    ok('T7.6 sin errores JS', PF._errs.length + EF._errs.length + XF._errs.length === 0, [...PF._errs, ...EF._errs, ...XF._errs].join(';'));
    await PF.context().close(); await EF.context().close(); await XF.context().close();
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
    ok('T5.2 sw v3', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('cpvpresu-v3'));
    ok('T5.3 sin restos piel vieja', !h.includes('Archivo Black') && !h.includes('#F3EEE2') && !h.includes('text-shadow:3px'));
  }

  console.log('\n════════ RESUMEN ════════');
  const fails = R.filter(r => r[0] === 'FAIL');
  R.forEach(r => console.log(r[0], r[1], r[2] ? '· ' + r[2] : ''));
  console.log(`\n${R.length - fails.length}/${R.length} PASS ${fails.length ? '· ' + fails.length + ' FAIL' : '· TODO VERDE'}`);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('ABORTO:', e.message); process.exit(2); });
