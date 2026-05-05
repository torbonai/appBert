# DI Curve — fonte humana de fallback

Pasta onde Renato cola **prints/screenshots** ou exports CSV/JSON da curva de juros DI futuro quando a fonte automatizada não estiver disponível.

## Convenção de nome

`YYYY-MM-DD_HHMM_di.png` (BRT)

Exemplos:
- `2026-05-05_0830_di.png` — print da curva às 8h30 da terça 05/05
- `2026-05-05_1430_di.png` — segundo print no mesmo dia (intraday)

Múltiplos prints no mesmo dia são bem-vindos — eu uso o mais recente disponível ao montar o briefing.

## O que precisa estar visível no print

1. **Pelo menos os 3 vértices canônicos**: DI Jan/27, Jan/29, Jan/31
2. **Comparação com ajuste anterior** (se a fonte exibir): mostrando a variação em bps
3. **Carimbo de hora** (idealmente no print)

Fontes recomendadas (qualquer uma serve):
- Tela do home broker (XP, BTG, Itaú, Clear, Genial, etc.)
- Investing.com Brasil — Renda Fixa → Brazil Government Bonds
- ANBIMA — site de mercado secundário
- Bloomberg / Reuters Eikon (se você usar)

## Fluxo automatizado

Eu (Claude) leio imagens nativamente. Quando você colar um print aqui:
1. Falar "olha o DI" ou "novo print da curva"
2. Eu leio a imagem mais recente da pasta
3. Extraio os valores e comparo com o ajuste anterior
4. Aplico o framework `rules_br.json > di_curva_correlation` automaticamente

## Alternativa: cola de texto simples

Se preferir, em vez de print pode colar no chat assim:
```
DI 9h15 BRT
F27: 14,175 (-3,4 bps)
F29: 13,800 (-5,9 bps)
F31: 13,820 (-5,9 bps)
```

Eu interpreto igual. Mas **um print é mais à prova de erro** porque traz contexto visual (carimbos, gráficos da curva, etc).

## Status do scraping automático

A automação 100% (sem print humano) está em desenvolvimento — o TradingView Desktop não indexa DI por vencimento, então estamos avaliando Investing.com / B3 / Anbima como fontes alternativas. Quando estiver pronto, esta pasta vira opcional.
