#!/usr/bin/env python3
# Gera capa briefing #18 · terça 26/05/2026
# Baseado no template canônico scripts/capa_briefing_template.ps1 (PowerShell Windows · Segoe UI)
# Adaptado pra Linux sandbox com PIL + DejaVu Sans (cosmético equivalente)
# A capa OFICIAL Windows deve ser regerada com scripts/capa_briefing_18.ps1 (Segoe UI + UTF-8 BOM)

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1920
OUT = "/sessions/admiring-adoring-albattani/mnt/tradingview-mcp-jackson/bertani_app/assets/img/stories/briefing_18_capa_26mai.png"

# Paleta Bertani (idêntica ao .ps1 canônico)
BG       = (11, 14, 20)
BG2      = (17, 23, 34)
CARD     = (21, 28, 41)
BORDER   = (31, 42, 60)
TEXT     = (230, 235, 242)
TEXT2    = (195, 204, 219)
MUTED    = (138, 149, 168)
ACCENT   = (41, 98, 255)
ACCENT_L = (90, 145, 255)
GREEN    = (0, 200, 83)
WARN     = (255, 23, 68)
GOLD     = (212, 175, 55)
ORANGE   = (255, 152, 0)
GRAY_PILL= (100, 116, 139)
WHITE    = (255, 255, 255)

FONT_DIR_DEJAVU = "/usr/share/fonts/truetype/dejavu"
FONT_DIR_LIBER  = "/usr/share/fonts/truetype/liberation2"

def F(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR_DEJAVU, name), size)

def Fmono(size, bold=False):
    name = "DejaVuSansMono-Bold.ttf" if bold else "DejaVuSansMono.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR_DEJAVU, name), size)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def text_w(text, font):
    bbox = d.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]

def center_text(text, font, y, color):
    w = text_w(text, font)
    d.text(((W - w) / 2, y), text, font=font, fill=color)

def rounded_rect(x, y, w, h, r, fill=None, outline=None, width=1):
    d.rounded_rectangle([x, y, x+w, y+h], radius=r, fill=fill, outline=outline, width=width)

# ========== HEADER ==========
fBrand   = F(26)
fData    = F(50, bold=True)
fEdicao  = F(22)
fPill    = F(22, bold=True)

center_text("BERTANI BRIEFING", fBrand, 100, MUTED)
center_text("TERÇA · 26 MAI", fData, 140, TEXT)
center_text("EDIÇÃO Nº 18", fEdicao, 215, MUTED)

# Pill ANTI-NARRATIVA MODERADO (ORANGE)
pillText = "⚠ ANTI-NARRATIVA MODERADO"
pillColor = ORANGE
pw = text_w(pillText, fPill)
ph = 40
px = int((W - pw - 40) / 2)
py = 265
rounded_rect(px, py, pw + 40, ph + 22, 30, fill=BG2, outline=pillColor, width=2)
d.text((px + 20, py + 11), pillText, font=fPill, fill=pillColor)

# ========== MANCHETE PRINCIPAL ==========
fH1 = F(88, bold=True)
mancheteColor = GREEN  # bull flatten dovish = positivo equities
center_text("DI VIROU DOVISH", fH1, 355, mancheteColor)
center_text("-14 bps NO MIOLO", fH1, 460, mancheteColor)

# ========== SUBMANCHETE ==========
fH2 = F(25)
center_text("WIN respeitou suporte sem sweep · GO_CONDICIONAL", fH2, 595, TEXT2)
center_text("DI dovish forte + Treasuries -1,66% + NY reabre", fH2, 635, TEXT2)
center_text("Filtro Anti-Narrativa MODERADO · Brent é o gauge", fH2, 675, TEXT2)

# ========== CARDS ==========
padX  = 75
cardY = 740
cardH = 200
cardW = W - 2 * padX

# WIN1! · GO_CONDICIONAL (ACCENT)
cardWinColor = ACCENT
rounded_rect(padX, cardY, cardW, cardH, 20, fill=CARD, outline=cardWinColor, width=3)
fAtivo = F(54, bold=True)
d.text((padX + 35, cardY + 20), "WIN1!", font=fAtivo, fill=TEXT)

badgeWinText = "GO COND"
badgeWinColor = ACCENT
fBadge = F(22, bold=True)
bw = text_w(badgeWinText, fBadge)
bh = 40
badgeX = padX + cardW - int(bw) - 70
badgeY = cardY + 32
rounded_rect(badgeX, badgeY, int(bw + 35), bh + 18, 30, fill=badgeWinColor, outline=badgeWinColor, width=2)
d.text((badgeX + 17, badgeY + 9), badgeWinText, font=fBadge, fill=WHITE)

fFase = F(21)
d.text((padX + 35, cardY + 100), "Reacumulação Fase B · ST acima do PDL", font=fFase, fill=MUTED)

fScore = Fmono(32, bold=True)
fDir   = F(22, bold=True)
winScoreColor = ACCENT_L
d.text((padX + 35, cardY + 145), "6,5/10", font=fScore, fill=winScoreColor)
d.text((padX + 175, cardY + 151), "LONG · DI dovish · risk-on", font=fDir, fill=TEXT2)

# WDO1! · AGUARDAR (GRAY_PILL)
cardY2 = cardY + cardH + 30
cardWdoColor = GRAY_PILL
rounded_rect(padX, cardY2, cardW, cardH, 20, fill=CARD, outline=cardWdoColor, width=3)
d.text((padX + 35, cardY2 + 20), "WDO1!", font=fAtivo, fill=TEXT)

badgeWdoText = "AGUARDAR"
badgeWdoColor = GRAY_PILL
bw2 = text_w(badgeWdoText, fBadge)
badgeX2 = padX + cardW - int(bw2) - 70
badgeY2 = cardY2 + 32
rounded_rect(badgeX2, badgeY2, int(bw2 + 35), bh + 18, 30, fill=badgeWdoColor, outline=badgeWdoColor, width=2)
d.text((badgeX2 + 17, badgeY2 + 9), badgeWdoText, font=fBadge, fill=WHITE)

d.text((padX + 35, cardY2 + 100), "Acumulação Fase B · ST 5.000 OK", font=fFase, fill=MUTED)
wdoScoreColor = MUTED
d.text((padX + 35, cardY2 + 145), "4,5/10", font=fScore, fill=wdoScoreColor)
d.text((padX + 175, cardY2 + 151), "Short cond. · DXY+Brent", font=fDir, fill=MUTED)

# ========== BANNERS INFERIORES ==========
bnPad = 80
bnW = W - 2*bnPad

# Banner 1 · VENTO MORNO + NY REABRE
bn1Y = 1220
bn1H = 150
bn1Color = ACCENT
rounded_rect(bnPad, bn1Y, bnW, bn1H, 20, fill=bn1Color, outline=bn1Color, width=0)
fBnT = F(32, bold=True)
center_text("VENTO MORNO · NY REABRE", fBnT, bn1Y + 25, WHITE)
fBnS = F(28, bold=True)
center_text("Risk-on global · US10Y -1,66% · futuros US +0,7-1,0%", fBnS, bn1Y + 78, WHITE)

# Banner 2 · JANELA QUENTE 08:30
bn2Y = 1400
bn2H = 150
bn2Color = WARN
rounded_rect(bnPad, bn2Y, bnW, bn2H, 20, fill=bn2Color, outline=bn2Color, width=0)
center_text("T.CORRENTES + IDP 08:30", fBnT, bn2Y + 25, WHITE)
center_text("Evitar 08:25-08:35 · janela quente BR", fBnS, bn2Y + 78, WHITE)

# ========== EVENTOS DO DIA ==========
fAvLbl = F(22, bold=True)
fAv    = F(22)
center_text("EVENTOS DO DIA", fAvLbl, 1600, WARN)
center_text("08:30 Transações Correntes + IDP ★★★", fAv, 1640, TEXT2)
center_text("11:00 Confiança do Consumidor CB EUA ★★★", fAv, 1680, TEXT2)

# ========== FOOTER ==========
fHandle = F(30)
center_text("@renatobertanioficial", fHandle, 1770, MUTED)
fComp = F(18)
center_text("CNPI T 9644 · CVM 20 · Educacional", fComp, 1820, MUTED)
fHora = Fmono(26, bold=True)
center_text("26 MAI 08:30 BRT", fHora, 1870, MUTED)

# Save
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG", optimize=False)
sz = os.path.getsize(OUT)
print(f"OK · {OUT} · {sz} bytes")
