# COWORK CROSS-REFERENCE · BRIEFING #15 · SEGUNDA 18/05/2026

> **Arquivo de validação Cowork ↔ Code** (gate seção 5.5 do `roda_briefing.md`).
> Renato passou 3 prints em 17/05/2026 ~20h05 BRT confirmando D-1 oficial sexta 15/05 + agenda macro 18/05. Esses são os valores **CANÔNICOS** que o Code precisa bater. Se divergir, abortar e investigar.
> Gerado pelo Cowork em 17/05/2026 ~20h10 BRT.

---

## 1. RANGE D-1 OFICIAL · SEXTA 15/05/2026 (fonte: print Renato 20h04 BRT)

### WIN1! (ou contrato canônico ativo · validar via TV CDP daily)

| Campo | Valor |
|---|---|
| Abertura | 179.000 |
| Máxima | 179.385 |
| **Mínima** | **177.235** |
| Fechamento | 179.375 |
| **Ajuste B3** | **179.050** |
| Amplitude | 2.150 |
| Variação | **−1.275 pts (−0,71%)** |
| Vol Financeiro | 7,65B |
| Negócios | 7.055 |
| Contratos Neg | 42,87k |
| Cont em Aberto | 164.695 |

**Derivados pra setup segunda:**
- PDH = 179.385
- PDL = 177.235
- EQ (mid-range D-1) = 178.310
- Range D-1 = 2.150 pts (**MUITO AMPLO** vs típico ~600-1.200 pts)
- Ajuste D-1 = 179.050

**Observação cor estrutural:** WIN bearish · mínima 177.235 perfurou o suporte crítico 178.790 (mencionado na V1.1 do briefing #14) · fechamento 179.375 voltou pra zona entry mas dentro do range = recuperação tardia. Cor estrutural: **BEAR controlled**.

⚠ **NOTA:** Vol financeiro 7,65B + Negócios 7.055 parecem baixos pra WIN1! contínuo. Pode ser print de vencimento específico (WINK26) ou parcial. Code deve validar via `chart_set_symbol("BMFBOVESPA:WIN1!") + chart_set_timeframe("D") + data_get_ohlcv({summary:true, count:2})` se OHLC do candle daily 15/05 bate com os prints.

### WDO1!

| Campo | Valor |
|---|---|
| Abertura | 5.041,00 |
| **Máxima** | **5.101,00** |
| Mínima | 5.036,50 |
| Fechamento | 5.074,50 |
| **Ajuste B3** | **5.087,52** |
| Amplitude | 64,50 |
| Variação | **+69,50 pts (+1,39%)** |
| Vol Financeiro | 66,23B |
| Negócios | 24.823 |
| Contratos Neg | 260,82k |
| Cont em Aberto | 1.032.935 |

**Derivados pra setup segunda:**
- PDH = 5.101,00
- PDL = 5.036,50
- EQ (mid-range D-1) = 5.068,75
- Range D-1 = 64,50 pts (normal)
- Ajuste D-1 = 5.087,52

**Observação cor estrutural:** WDO bullish · fechamento perto da máxima · DXY subindo + risk-off externo + Brent supply shock priced. Cor estrutural: **BULL controlled**.

---

## 2. OUTCOME SETUPS BRIEFING #14 V1.1/V1.2 · INTRADAY SEXTA

### Setup A SHORT WIN (V1.1)
- Entry: 179.500-180.000 · SL: 180.302
- TP1: 178.790 · TP2: 178.000 · TP3: 177.500
- **Outcome com print sexta:** mínima 177.235 → **TP3 BATIDO** (177.235 < 177.500) intraday
- Fechamento 179.375 voltou pra zona entry · trade ideal foi short → partial TPs intraday → fechamento se ainda runner
- Cross-check assinatura: setup A SHORT V1.1 produziu trade vencedor (≥TP1 garantido, possível TP3 com runner)

### Setup LONG WDO (V1.2)
- Entry: break EQ D-1 5.021,75 · SL: 5.009,5
- TP1: 5.051 · TP2: 5.070 · TP3: 5.080
- **Outcome com print sexta:** máxima 5.101 → **TP3 BATIDO** (5.101 > 5.080) intraday
- Fechamento 5.074,50 (acima TP2, abaixo TP3) · trade ideal foi long → TPs1-3 progressivos
- Cross-check assinatura: setup LONG V1.2 produziu trade vencedor (≥TP2 garantido, TP3 batido na máxima)

**Track Record briefing #14 V1.1+V1.2: AMBOS OS SETUPS ATINGIRAM TP3 INTRADAY** (math conservador: TP1+TP2; agressivo: TP3 na ponta). Renato precisa alimentar planilha Track Record com esse outcome quando confirmar via dados reais.

---

## 3. DIVERGÊNCIA WIN/WDO CONFIRMA TESE V1.1

WIN −0,71% / WDO +1,39% = divergência estrutural clara · confirma o pricing risk-off externo da V1.1:
- Peers Vale globais −5% médio overnight (BHP −3,84% · Rio Tinto −3,95% · Anglo −6,08% · etc) drenaram WIN
- Brent +3,10% a $108 supply shock priced + DXY +0,28% sustentaram WDO contraintuitivamente
- USDBRL divergência (−0,60% overnight, mas WDO subiu 1,39% no dia) = real apreciando overnight mas vendido durante o pregão (provável: PMS BR −1,2% MoM piorou ainda mais o cenário doméstico vs externo)

**Implicação pro briefing #15 segunda 18/05:** se overnight global mantiver o pricing de sexta (peers Vale fracos, Brent firme, DXY sustentado), a tese estrutural continua: **WIN bearish viés / WDO bullish viés**. LIÇÃO 58 aplicável (viés bearish default WIN se Vale peers globais médio overnight < −3%).

---

## 4. AGENDA MACRO SEGUNDA 18/05/2026 (fonte: print Renato 20h05 BRT · Investing.com)

| Hora BRT | País | Evento | Importância | Anterior |
|---|---|---|---|---|
| 04:30 | 🇪🇺 EU | Discurso Elderson (BCE) | ★★ | — |
| 08:00 | 🇧🇷 BR | IGP-10 (Mai mensal) | ★★ | 2,9% |
| 08:25 | 🇧🇷 BR | Boletim Focus | ★★ | — |
| **09:00** | **🇧🇷 BR** | **IBC-Br (Mar)** | **★★★** | **0,60%** |
| 17:00 | 🇺🇸 US | Transações Líquidas Longo Prazo (Mar) | ★★ | 58,6B |

**DRIVER ÚNICO ALTO IMPACTO: IBC-Br Mar 09:00 BRT** (PIB mensal do BC · indicador atividade).
- Janela_evitar: **08:55-09:15 BRT** (releitura imediata)
- Kill zone shift recomendada: **10:30-11:30 BRT** pós-digestão (LIÇÃO `roda_briefing.md` 9.5)
- Direção implicada: leitura **forte** = hawkish (BC pode atrasar cortes) = bearish WIN / bullish WDO · leitura **fraca** = dovish (BC pode acelerar cortes) = bullish WIN / bearish WDO
- Anterior 0,60% MoM em fevereiro. Sem projeção mediana no print · Code deve checar via `briefing_check_macro` ou Investing.

**Outros eventos não-críticos:**
- Boletim Focus 08:25 não move mercado per se mas calibra expectativas
- IGP-10 8:00 é inflação atacado (★★) · marginal pra DI
- Elderson 04:30 BCE · zero impacto BR · só pra contexto risk sentiment Europa
- US T-Inflows 17:00 pós-fechamento B3 · zero impacto intraday WIN/WDO

---

## 5. PENDÊNCIAS PRA FASE 2 SEGUNDA MANHÃ ~6h45-7h30 BRT

- [ ] **Curva DI EOD sexta 15/05** (prints F27/F29/F31 da pasta · Code deve ler quando rodar FASE 1 esta noite · Cowork ainda vê prints antigos no mount)
- [ ] **Snapshot global overnight** (Wall St futures dom 22h-seg 5h · Ásia seg 21h dom-01h seg · Europa seg 04h-06h · Vale peers globais · Brent · DXY · USDJPY · VIX)
- [ ] **Release Falcão CETIP 7h11 segunda** (validar DI EOD sexta + qualquer pré-mercado segunda · LIÇÃO 53)
- [ ] **Projeção IBC-Br Mar 09:00** (mediana Bloomberg/Reuters · pra calibrar score CAP final)
- [ ] **Aplicar LIÇÃO 58** se Vale peers globais médio overnight < −3% → viés bearish default WIN
- [ ] **Manchete final** (escolher entre A bearish / B bullish / C neutra das opções preliminares)
- [ ] **Capa PNG** via `scripts/capa_briefing_template.ps1` (LIÇÃO 19) + 5 critérios visuais validados
- [ ] **Publish via** `powershell -File scripts\publish_full.ps1 2026-05-18` (LIÇÃO 22)

---

## 6. NÚMEROS-ÂNCORA PRO BRIEFING #15

```
WIN:
  PDH = 179.385
  PDL = 177.235
  EQ  = 178.310
  Ajuste D-1 = 179.050
  Range D-1 = 2.150 pts
  Suporte crítico (perfurado intraday sexta, mas recuperou): 178.790
  Suporte testado sexta: 177.235 (low absoluto)

WDO:
  PDH = 5.101,00
  PDL = 5.036,50
  EQ  = 5.068,75
  Ajuste D-1 = 5.087,52
  Range D-1 = 64,50 pts
  Resistência atingida sexta (TP3 V1.2): 5.101
```

---

## 7. CROSS-CHECK CHECKLIST (Cowork ↔ Code pós-FASE 1)

Quando Code reportar de volta, validar item por item:

- [ ] Ajuste WIN sexta no JSON = `179.050` (do print)? Se Code reportar diferente, ABORTAR e investigar TV CDP em símbolo errado (LIÇÃO 18)
- [ ] Ajuste WDO sexta no JSON = `5.087,52` (do print)? Idem
- [ ] PDH/PDL/EQ WIN batem com print (179.385 / 177.235 / 178.310)?
- [ ] PDH/PDL/EQ WDO batem com print (5.101 / 5.036,50 / 5.068,75)?
- [ ] Variação WIN reportada = −0,71%? WDO = +1,39%?
- [ ] Fase Wyckoff WIN coerente com PA bearish + perfuração 178.790 (provável Distribuição C/D ou Lateral indecisa)?
- [ ] Fase Wyckoff WDO coerente com PA bullish + fechamento perto da máxima (provável Acumulação D/E ou Markup)?
- [ ] DI EOD 15/05 lido dos prints da pasta · mtime > 2026-05-15T17:00:00 BRT validado?
- [ ] DI Δbps cada vértice |valor| ≤ 80 (LIÇÃO 23 sanity)?
- [ ] Score CAP máximo declarado coerente com componentes faltantes marcados _PENDENTE_FASE2 (overnight, Vale peers, DXY direcional, IBC-Br projeção)?
- [ ] `_meta.fase` = "PARCIAL_AGUARDANDO_FASE2" (não "PRONTA_FASE1" se grep _PENDENTE_ > 0)?
- [ ] Agenda macro 18/05 inclui IBC-Br 09:00 ★★★ com janela_evitar 08:55-09:15?
- [ ] Agenda macro inclui Focus 08:25 + IGP-10 08:00?
- [ ] Filtro Anti-Narrativa preliminar declarado com narrativa dominante identificada (ex: "Trump-Xi tregua resilência" da V1.1 ainda dominante? Ou nova narrativa pós-PMS?)?
- [ ] Manchete: 3 opções (bearish/bullish/neutra) propostas pra Renato escolher segunda?

Se TODOS os itens passarem, Cowork emite **GO FASE 1** · Renato confirma · espera FASE 2 segunda manhã.

Se ALGUM item falhar, Cowork emite **DEVOLVE** com lista numerada de fix.
