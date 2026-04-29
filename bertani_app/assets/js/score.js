/* BERTANI APP - Motor de Scoring v1.0 */
(function () {
  'use strict';
  var APP = window.BertaniApp || (window.BertaniApp = {});

  var INSTRUMENT_SPECS = {
    WIN: { label: 'WIN1!', tickPts: 5, pointBRL: 0.20, stopMin: 80, stopMax: 300, buffer: 30, atr15mLow: 60, atr15mHigh: 120 },
    WDO: { label: 'WDO1!', tickPts: 0.5, pointBRL: 10.00, stopMin: 6, stopMax: 25, buffer: 1.5, atr15mLow: 2, atr15mHigh: 6 }
  };

  function roundToTick(v, tick) { return Math.round(v / tick) * tick; }

  function parseEqhEql(text) {
    var out = [];
    if (!text) return out;
    text.split(/\n|;/).forEach(function (linha) {
      var trim = linha.trim();
      if (!trim) return;
      var m = trim.match(/^([A-Za-z\/\s]*)\s*([\d.,]+)/);
      if (!m) return;
      var tipoRaw = (m[1] || '').toUpperCase().trim();
      var numStr = m[2].replace(/\./g, '').replace(',', '.');
      var num = parseFloat(numStr);
      if (!isFinite(num) || num <= 0) return;
      var tipo = 'EQ';
      if (tipoRaw.indexOf('PDH') >= 0 || tipoRaw.indexOf('EQH') >= 0 || tipoRaw.indexOf('PWH') >= 0 || tipoRaw.indexOf('TOPO') >= 0) tipo = 'EQH';
      if (tipoRaw.indexOf('PDL') >= 0 || tipoRaw.indexOf('EQL') >= 0 || tipoRaw.indexOf('PWL') >= 0 || tipoRaw.indexOf('FUNDO') >= 0) tipo = 'EQL';
      out.push({ tipo: tipo, valor: num, label: trim });
    });
    return out;
  }

  function getJanela(horaBRT) {
    var parts = (horaBRT || '00:00').split(':').map(Number);
    var min = parts[0] * 60 + parts[1];
    if (min < 540) return { nome: 'pre_abertura', ativa: false, label: 'Pre-abertura' };
    if (min < 570) return { nome: 'abertura_volatil', ativa: false, label: 'Abertura volatil' };
    if (min < 630) return { nome: 'kz_abertura', ativa: true, label: 'KZ Abertura (Londres)' };
    if (min < 720) return { nome: 'meio_manha', ativa: false, label: 'Meio da manha' };
    if (min < 810) return { nome: 'almoco', ativa: false, label: 'Almoco (volume baixo)' };
    if (min < 870) return { nome: 'kz_ny_open', ativa: true, label: 'KZ NY Open' };
    if (min < 930) return { nome: 'tarde', ativa: false, label: 'Tarde' };
    if (min < 990) return { nome: 'kz_ny_pm', ativa: true, label: 'KZ NY PM' };
    if (min < 1065) return { nome: 'pre_fechamento', ativa: false, label: 'Pre-fechamento' };
    return { nome: 'leilao', ativa: false, label: 'Leilao de fechamento' };
  }

  function determineBias(p) {
    var lng = { score: 0, motivos: [] };
    var sht = { score: 0, motivos: [] };
    if (['acc_b', 'acc_c', 'acc_d', 'acc_e'].indexOf(p.fase) >= 0) {
      lng.score += 2;
      lng.motivos.push('Fase ' + p.fase.toUpperCase() + ' de acumulacao favorece long');
    }
    if (['dist_b', 'dist_c', 'dist_d', 'dist_e'].indexOf(p.fase) >= 0) {
      sht.score += 2;
      sht.motivos.push('Fase ' + p.fase.toUpperCase() + ' de distribuicao favorece short');
    }
    if (p.sweep === 'ssl') { lng.score += 1.5; lng.motivos.push('Sweep de SSL recente (Spring)'); }
    if (p.sweep === 'bsl') { sht.score += 1.5; sht.motivos.push('Sweep de BSL recente (UTAD/Upthrust)'); }
    if (p.mss === 'bull') { lng.score += 1.5; lng.motivos.push('MSS bullish confirmado no 15m'); }
    if (p.mss === 'bear') { sht.score += 1.5; sht.motivos.push('MSS bearish confirmado no 15m'); }
    if (p.dealing === 'discount_deep') { lng.score += 1.0; lng.motivos.push('Preco em discount profundo'); }
    if (p.dealing === 'discount') { lng.score += 0.7; lng.motivos.push('Preco em discount'); }
    if (p.dealing === 'premium_deep') { sht.score += 1.0; sht.motivos.push('Preco em premium profundo'); }
    if (p.dealing === 'premium') { sht.score += 0.7; sht.motivos.push('Preco em premium'); }
    if (p.fvg_dir === 'bull') { lng.score += 0.7; lng.motivos.push('Bullish FVG H1 abaixo'); }
    if (p.fvg_dir === 'bear') { sht.score += 0.7; sht.motivos.push('Bearish FVG H1 acima'); }
    if (p.ob_dir === 'bull') { lng.score += 0.7; lng.motivos.push('Bullish OB H1 abaixo'); }
    if (p.ob_dir === 'bear') { sht.score += 0.7; sht.motivos.push('Bearish OB H1 acima'); }
    if (lng.score > sht.score + 0.5 && lng.score >= 3.0) return { dir: 'long', confianca: lng.score, motivos: lng.motivos };
    if (sht.score > lng.score + 0.5 && sht.score >= 3.0) return { dir: 'short', confianca: sht.score, motivos: sht.motivos };
    return { dir: 'none', confianca: Math.max(lng.score, sht.score), motivos: ['Sinais tecnicos divergentes ou insuficientes (minimo 3 pts de evidencia alinhada).'] };
  }

  function computeScore(p, bias) {
    var dir = bias.dir;
    var items = [];
    var pt, ok, obs;

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && ['acc_c', 'acc_d', 'acc_e'].indexOf(p.fase) >= 0) { pt = 1.5; ok = true; obs = 'Fase ideal de markup'; }
    else if (dir === 'long' && p.fase === 'acc_b') { pt = 0.5; obs = 'Fase B construindo causa'; }
    else if (dir === 'short' && ['dist_c', 'dist_d', 'dist_e'].indexOf(p.fase) >= 0) { pt = 1.5; ok = true; obs = 'Fase ideal de markdown'; }
    else if (dir === 'short' && p.fase === 'dist_b') { pt = 0.5; obs = 'Fase B construindo causa'; }
    else obs = 'Fase Wyckoff nao favorece a direcao';
    items.push({ nome: 'Fase Wyckoff alinhada', peso: 1.5, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && p.sweep === 'ssl') { pt = 1.0; ok = true; obs = 'SSL varrida'; }
    else if (dir === 'short' && p.sweep === 'bsl') { pt = 1.0; ok = true; obs = 'BSL varrida'; }
    else if (p.sweep === 'none') obs = 'Sem sweep recente';
    else obs = 'Sweep contrario ao bias';
    items.push({ nome: 'Sweep alinhado', peso: 1.0, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && p.mss === 'bull') { pt = 1.5; ok = true; obs = 'MSS bull confirma quebra de estrutura'; }
    else if (dir === 'short' && p.mss === 'bear') { pt = 1.5; ok = true; obs = 'MSS bear confirma quebra de estrutura'; }
    else if (p.mss === 'none') obs = 'Sem MSS - gatilho nao armado';
    else obs = 'MSS contrario ao bias';
    items.push({ nome: 'MSS confirmado no 15m', peso: 1.5, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && p.dealing === 'discount_deep') { pt = 1.0; ok = true; obs = 'Discount profundo - maxima vantagem'; }
    else if (dir === 'long' && p.dealing === 'discount') { pt = 0.7; ok = true; obs = 'Discount'; }
    else if (dir === 'short' && p.dealing === 'premium_deep') { pt = 1.0; ok = true; obs = 'Premium profundo - maxima vantagem'; }
    else if (dir === 'short' && p.dealing === 'premium') { pt = 0.7; ok = true; obs = 'Premium'; }
    else if (p.dealing === 'eq') obs = 'Meio de range (EQ) - evitar';
    else obs = 'Dealing range contrario ao bias';
    items.push({ nome: 'Dealing range alinhado', peso: 1.0, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && p.fvg_dir === 'bull') { pt = 0.8; ok = true; obs = 'Bullish FVG H1 nao mitigado'; }
    else if (dir === 'short' && p.fvg_dir === 'bear') { pt = 0.8; ok = true; obs = 'Bearish FVG H1 nao mitigado'; }
    else obs = 'FVG H1 nao favorece o bias';
    items.push({ nome: 'FVG H1 alinhado', peso: 0.8, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && p.ob_dir === 'bull') { pt = 0.8; ok = true; obs = 'Bullish OB H1 nao mitigado'; }
    else if (dir === 'short' && p.ob_dir === 'bear') { pt = 0.8; ok = true; obs = 'Bearish OB H1 nao mitigado'; }
    else obs = 'OB H1 nao favorece o bias';
    items.push({ nome: 'OB H1 alinhado', peso: 0.8, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    var pools = parseEqhEql(p.eqh_eql);
    var tol = p.ativo === 'WDO' ? 3 : 60;
    var hasConf = false;
    var poiH = -Infinity, poiL = Infinity;
    if (dir !== 'none') {
      if (p.fvg_high) poiH = Math.max(poiH, p.fvg_high);
      if (p.fvg_low) poiL = Math.min(poiL, p.fvg_low);
      if (p.ob_high) poiH = Math.max(poiH, p.ob_high);
      if (p.ob_low) poiL = Math.min(poiL, p.ob_low);
      if (poiH !== -Infinity && poiL !== Infinity) {
        hasConf = pools.some(function (pl) { return Math.abs(pl.valor - poiL) <= tol || Math.abs(pl.valor - poiH) <= tol; });
      }
    }
    if (hasConf) { pt = 0.5; ok = true; obs = 'POI coincide com pool de liquidez HTF'; }
    else if (pools.length === 0) obs = 'Sem pools informados';
    else obs = 'POI nao coincide com pool HTF';
    items.push({ nome: 'Confluencia POI x Pool HTF', peso: 0.5, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (p.volume === 'alto') { pt = 0.5; ok = true; obs = 'Volume >= 1,5x MA20 confirma Composite Man'; }
    else if (p.volume === 'normal') { pt = 0.25; obs = 'Volume normal'; }
    else obs = 'Volume baixo - Composite Man ausente';
    items.push({ nome: 'Volume confirmando', peso: 0.5, ponto: pt, ok: ok, obs: obs });

    var j = getJanela(p.hora_brt);
    pt = 0; ok = false; obs = '';
    if (j.ativa) { pt = 0.5; ok = true; obs = j.label + ' - janela primaria'; }
    else obs = j.label + ' - fora de kill zone';
    items.push({ nome: 'Kill zone ativa', peso: 0.5, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    if (dir === 'long' && p.antinarr === 'diverge_long') { pt = 1.0; ok = true; obs = 'Noticia bearish + preco aceita = Composite Man comprando'; }
    else if (dir === 'short' && p.antinarr === 'diverge_short') { pt = 1.0; ok = true; obs = 'Noticia bullish + preco rejeita = Composite Man vendendo'; }
    else if (p.antinarr === 'confirma') { pt = 0.4; ok = true; obs = 'Narrativa alinhada ao bias'; }
    else if (p.antinarr === 'neutra') { pt = 0.2; obs = 'Sem manchete relevante'; }
    else if (p.antinarr === 'evento_critico') { pt = 0; obs = 'Janela proibida'; }
    else obs = 'Anti-narrativa contraria ao bias';
    items.push({ nome: 'Filtro Anti-Narrativa', peso: 1.0, ponto: pt, ok: ok, obs: obs });

    pt = 0; ok = false; obs = '';
    var spec = INSTRUMENT_SPECS[p.ativo];
    if (p.last && p.ajuste && spec) {
      var dist = Math.abs(p.last - p.ajuste);
      var distEsp = spec.atr15mHigh * 1.5;
      if (dist > 0 && dist < distEsp * 2) { pt = 0.4; ok = true; obs = 'Preco a ' + dist.toFixed(0) + ' pts do ajuste'; }
      else if (dist >= distEsp * 2) { pt = 0.2; obs = 'Preco esticado'; }
    } else obs = 'Ajuste ou preco nao preenchidos';
    items.push({ nome: 'Distancia do ajuste B3', peso: 0.4, ponto: pt, ok: ok, obs: obs });

    var sc = items.reduce(function (a, it) { return a + it.ponto; }, 0);
    return { score: Math.max(0, Math.min(10, Math.round(sc * 10) / 10)), items: items };
  }

  function applyHardFilters(p) {
    var noGo = [];
    if (p.dd_pct <= -3) noGo.push('Drawdown diario em -3% - fechar o dia');
    if (p.trades_hoje >= 4) noGo.push('Ja 4 trades no dia - limite atingido');
    if (p.antinarr === 'evento_critico') noGo.push('Janela proibida (Copom/FOMC/NFP +-60min)');
    var j = getJanela(p.hora_brt);
    if (['leilao', 'pre_abertura', 'abertura_volatil'].indexOf(j.nome) >= 0) noGo.push('Horario inadequado: ' + j.label);
    return noGo;
  }

  function buildPlan(p, bias, score) {
    var spec = INSTRUMENT_SPECS[p.ativo];
    var plan = {
      direcao: bias.dir, entry: null, stop: null, stopPts: null,
      tp1: null, tp2: null, tp3: null,
      tp1Pts: null, tp2Pts: null, tp3Pts: null,
      rr1: null, rr2: null, rr3: null,
      contratos: 0, riscoBRL: 0,
      ganhoTP1BRL: 0, ganhoTP2BRL: 0, ganhoTP3BRL: 0,
      racional: '', observacoes: []
    };

    if (bias.dir === 'none' || score < 6) {
      plan.observacoes.push('Score abaixo de 6/10 ou bias indefinido - nao armar gatilho.');
      return plan;
    }

    var poiH = null, poiL = null;
    if (bias.dir === 'long') {
      if (p.fvg_dir === 'bull' && p.fvg_high && p.fvg_low) { poiH = p.fvg_high; poiL = p.fvg_low; }
      else if (p.ob_dir === 'bull' && p.ob_high && p.ob_low) { poiH = p.ob_high; poiL = p.ob_low; }
    } else {
      if (p.fvg_dir === 'bear' && p.fvg_high && p.fvg_low) { poiH = p.fvg_high; poiL = p.fvg_low; }
      else if (p.ob_dir === 'bear' && p.ob_high && p.ob_low) { poiH = p.ob_high; poiL = p.ob_low; }
    }
    if (poiH === null || poiL === null) {
      plan.observacoes.push('POI sem coordenadas - entry indicativa no preco corrente.');
      poiH = p.last; poiL = p.last;
    }

    var entry = roundToTick((poiH + poiL) / 2, spec.tickPts);
    plan.entry = entry;

    var stop = bias.dir === 'long' ? roundToTick(poiL - spec.buffer, spec.tickPts) : roundToTick(poiH + spec.buffer, spec.tickPts);
    plan.stop = stop;
    var stopPts = Math.abs(entry - stop);
    plan.stopPts = stopPts;

    if (stopPts < spec.stopMin) plan.observacoes.push('SL apertado (' + stopPts + 'pt < min ' + spec.stopMin + ')');
    if (stopPts > spec.stopMax) plan.observacoes.push('SL largo (' + stopPts + 'pt > max ' + spec.stopMax + ')');

    var pools = parseEqhEql(p.eqh_eql);
    var dm = bias.dir === 'long' ? 1 : -1;
    var poolsDir = pools.filter(function (pl) { return dm * (pl.valor - entry) > 0; });
    if (bias.dir === 'long' && p.pdh && p.pdh > entry) poolsDir.push({ valor: p.pdh, label: 'PDH' });
    if (bias.dir === 'short' && p.pdl && p.pdl < entry) poolsDir.push({ valor: p.pdl, label: 'PDL' });
    poolsDir.sort(function (a, b) { return dm * (a.valor - b.valor); });

    function farther(a, b) { return dm > 0 ? Math.max(a, b) : Math.min(a, b); }

    // TP1: pool mais proximo OU 1R, o que for mais distante
    var tp1Min = entry + dm * stopPts;
    var tp1 = poolsDir.length > 0 ? farther(poolsDir[0].valor, tp1Min) : tp1Min;
    tp1 = roundToTick(tp1, spec.tickPts);
    plan.tp1 = tp1;
    plan.tp1Pts = Math.abs(tp1 - entry);
    plan.rr1 = +(plan.tp1Pts / stopPts).toFixed(2);

    // TP2: proximo pool DEPOIS de TP1, OU max(2R, TP1+1R)
    var tp2Floor = farther(entry + dm * stopPts * 2, tp1 + dm * stopPts);
    var poolsApos1 = poolsDir.filter(function (pl) { return dm * (pl.valor - tp1) > spec.tickPts; });
    var tp2 = poolsApos1.length > 0 ? farther(poolsApos1[0].valor, tp2Floor) : tp2Floor;
    tp2 = roundToTick(tp2, spec.tickPts);
    plan.tp2 = tp2;
    plan.tp2Pts = Math.abs(tp2 - entry);
    plan.rr2 = +(plan.tp2Pts / stopPts).toFixed(2);

    // TP3: pool mais distante DEPOIS de TP2, OU max(3R, TP2+1R)
    var tp3Floor = farther(entry + dm * stopPts * 3, tp2 + dm * stopPts);
    var poolsApos2 = poolsDir.filter(function (pl) { return dm * (pl.valor - tp2) > spec.tickPts; });
    var tp3 = poolsApos2.length > 0 ? farther(poolsApos2[poolsApos2.length - 1].valor, tp3Floor) : tp3Floor;
    tp3 = roundToTick(tp3, spec.tickPts);
    plan.tp3 = tp3;
    plan.tp3Pts = Math.abs(tp3 - entry);
    plan.rr3 = +(plan.tp3Pts / stopPts).toFixed(2);

    var riscoBRL = p.banca * (p.risco_pct / 100);
    plan.riscoBRL = riscoBRL;
    plan.contratos = Math.max(1, Math.floor(riscoBRL / (stopPts * spec.pointBRL)));
    plan.ganhoTP1BRL = plan.tp1Pts * spec.pointBRL * plan.contratos;
    plan.ganhoTP2BRL = plan.tp2Pts * spec.pointBRL * plan.contratos;
    plan.ganhoTP3BRL = plan.tp3Pts * spec.pointBRL * plan.contratos;

    var motivos = bias.motivos.slice(0, 4).join('. ');
    var dt = bias.dir === 'long' ? 'LONG' : 'SHORT';
    plan.racional = dt + ' ' + spec.label + ' - ' + motivos +
      '. Entrada na media do POI (' + entry + '), stop alem do extremo + buffer ' + spec.buffer + 'pt. ' +
      'Parcial 50% em TP1 (' + plan.rr1 + 'R), mover SL pra BE, deixar correr ate TP2/TP3.';
    return plan;
  }

  APP.score = {
    INSTRUMENT_SPECS: INSTRUMENT_SPECS,
    parseEqhEql: parseEqhEql,
    getJanela: getJanela,
    analyze: function (p) {
      var bias = determineBias(p);
      var sc = computeScore(p, bias);
      var plan = buildPlan(p, bias, sc.score);
      var noGo = applyHardFilters(p);
      var janela = getJanela(p.hora_brt);
      var verdict;
      if (noGo.length > 0) verdict = 'NO_GO_HARD';
      else if (sc.score < 6) verdict = 'AGUARDAR';
      else if (sc.score < 7.5) verdict = 'GO_CONDICIONAL';
      else verdict = 'GO';
      return {
        timestamp: new Date().toISOString(),
        ativo: p.ativo, bias: bias, score: sc.score, items: sc.items,
        plan: plan, noGo: noGo, janela: janela, verdict: verdict
      };
    }
  };
})();
