/**
 * Teste end-to-end do motor de scoring.
 * Roda via: node bertani_app/calculadora/_test_score.cjs
 */

global.window = {};

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const scoreCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'score.js'), 'utf8');

const context = vm.createContext({ window: global.window, console });
vm.runInContext(scoreCode, context);
const SCORE = global.window.BertaniApp.score;

const cenarios = [
  {
    nome: 'WIN setup A · Spring 0% (Joao 28/04)',
    expected: { dir: 'long', minScore: 8, verdict: 'GO' },
    payload: {
      ts: new Date().toISOString(), tier: 'telapro', ativo: 'WIN',
      ajuste: 134510, pdh: 134985, pdl: 134120,
      hod: 134730, lod: 134380, last: 134560,
      fase: 'acc_d', sweep: 'ssl', mss: 'bull', dealing: 'discount',
      fvg_dir: 'bull', fvg_high: 134700, fvg_low: 134580,
      ob_dir: 'bull', ob_high: 134650, ob_low: 134500,
      eqh_eql: 'EQL 134120\nPDH 134985\nEQH semanal 135420',
      hora_brt: '09:45', volume: 'alto', antinarr: 'diverge_long',
      banca: 30000, risco_pct: 1, trades_hoje: 0, dd_pct: 0,
    }
  },
  {
    nome: 'WIN aguardar (briefing #1 27/04)',
    expected: { dir: 'none', maxScore: 5, verdict: 'AGUARDAR' },
    payload: {
      ts: new Date().toISOString(), tier: 'telapro', ativo: 'WIN',
      ajuste: 134200, pdh: 134680, pdl: 133940, last: 134250,
      fase: 'acc_b', sweep: 'none', mss: 'none', dealing: 'eq',
      fvg_dir: 'none', fvg_high: null, fvg_low: null,
      ob_dir: 'none', ob_high: null, ob_low: null,
      eqh_eql: '', hora_brt: '11:45', volume: 'normal', antinarr: 'neutra',
      banca: 30000, risco_pct: 1, trades_hoje: 0, dd_pct: 0,
    }
  },
  {
    nome: 'WDO short retest (briefing #2 28/04)',
    expected: { dir: 'short', minScore: 6, maxScore: 8.5 },
    payload: {
      ts: new Date().toISOString(), tier: 'telapro', ativo: 'WDO',
      ajuste: 5012.5, pdh: 5025.5, pdl: 4985.0, last: 5008.0,
      fase: 'dist_d', sweep: 'bsl', mss: 'bear', dealing: 'premium',
      fvg_dir: 'bear', fvg_high: 5012.0, fvg_low: 5005.0,
      ob_dir: 'none', ob_high: null, ob_low: null,
      eqh_eql: 'PDH 5025.5\nEQL 4985.0',
      hora_brt: '09:30', volume: 'alto', antinarr: 'confirma',
      banca: 30000, risco_pct: 1, trades_hoje: 0, dd_pct: 0,
    }
  },
  {
    nome: 'NO-GO duro · DD em -3%',
    expected: { verdict: 'NO_GO_HARD' },
    payload: {
      ts: new Date().toISOString(), tier: 'telapro', ativo: 'WIN',
      ajuste: 134200, pdh: 134680, pdl: 133940, last: 134250,
      fase: 'acc_d', sweep: 'ssl', mss: 'bull', dealing: 'discount_deep',
      fvg_dir: 'bull', fvg_high: 134300, fvg_low: 134200,
      ob_dir: 'bull', ob_high: 134250, ob_low: 134150,
      eqh_eql: 'EQL 134000', hora_brt: '14:00', volume: 'alto', antinarr: 'diverge_long',
      banca: 30000, risco_pct: 1, trades_hoje: 2, dd_pct: -3.2,
    }
  },
  {
    nome: 'NO-GO duro · Janela proibida (Copom)',
    expected: { verdict: 'NO_GO_HARD' },
    payload: {
      ts: new Date().toISOString(), tier: 'telapro', ativo: 'WIN',
      ajuste: 134200, pdh: 134680, pdl: 133940, last: 134250,
      fase: 'acc_d', sweep: 'ssl', mss: 'bull', dealing: 'discount',
      fvg_dir: 'bull', fvg_high: 134300, fvg_low: 134200,
      ob_dir: 'none', ob_high: null, ob_low: null,
      eqh_eql: 'EQL 134000', hora_brt: '15:00', volume: 'alto', antinarr: 'evento_critico',
      banca: 30000, risco_pct: 1, trades_hoje: 0, dd_pct: 0,
    }
  },
];

let pass = 0, fail = 0;
const sep70 = '-'.repeat(70);

cenarios.forEach((c, i) => {
  const r = SCORE.analyze(c.payload);
  console.log('\n' + sep70);
  console.log('Cenario #' + (i + 1) + ': ' + c.nome);
  console.log(sep70);
  console.log('  Score:    ' + r.score.toFixed(1) + ' / 10');
  console.log('  Bias:     ' + r.bias.dir.toUpperCase() + ' (confianca ' + r.bias.confianca.toFixed(2) + ')');
  console.log('  Verdict:  ' + r.verdict);
  console.log('  Janela:   ' + r.janela.label + ' (' + (r.janela.ativa ? 'ATIVA' : 'fora') + ')');
  if (r.noGo.length > 0) {
    console.log('  NoGo:     ' + r.noGo.join(' | '));
  }
  if (r.plan.direcao !== 'none' && r.score >= 6) {
    console.log('  Plano:    Entry ' + r.plan.entry + ' | SL ' + r.plan.stop + ' (' + r.plan.stopPts + 'pt)');
    console.log('            TP1 ' + r.plan.tp1 + ' (' + r.plan.rr1 + 'R) | TP2 ' + r.plan.tp2 + ' (' + r.plan.rr2 + 'R) | TP3 ' + r.plan.tp3 + ' (' + r.plan.rr3 + 'R)');
    console.log('            Contratos: ' + r.plan.contratos + ' | Risco: R$ ' + r.plan.riscoBRL.toFixed(0));
  }
  console.log('  Top 3 criterios:');
  const sorted = r.items.slice().sort((a, b) => b.ponto - a.ponto);
  sorted.slice(0, 3).forEach(it => {
    console.log('    - ' + it.nome.padEnd(35) + ' ' + it.ponto.toFixed(1) + '/' + it.peso.toFixed(1) + ' ' + (it.ok ? '[OK]' : '[--]'));
  });

  const e = c.expected;
  let ok = true;
  if (e.verdict && r.verdict !== e.verdict) { ok = false; console.log('  FAIL: esperado verdict ' + e.verdict + ', veio ' + r.verdict); }
  if (e.dir && r.bias.dir !== e.dir) { ok = false; console.log('  FAIL: esperado bias ' + e.dir + ', veio ' + r.bias.dir); }
  if (e.minScore && r.score < e.minScore) { ok = false; console.log('  FAIL: score ' + r.score + ' < esperado ' + e.minScore); }
  if (e.maxScore && r.score > e.maxScore) { ok = false; console.log('  FAIL: score ' + r.score + ' > maximo esperado ' + e.maxScore); }
  if (ok) { console.log('  PASS'); pass++; } else { fail++; }
});

console.log('\n' + sep70);
console.log('Resultado: ' + pass + '/' + cenarios.length + ' passaram. ' + (fail > 0 ? fail + ' falharam' : 'Todos OK'));
console.log(sep70);
process.exit(fail > 0 ? 1 : 0);
