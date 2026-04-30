/* ================================================================
   BERTANI APP — Core JavaScript v1.0
   Responsabilidades:
   - Gerenciamento de acesso (Briefing R$ 147 vs Tela Pro)
   - Navegação entre páginas
   - Helpers comuns (formatação, fetch, storage)
   ================================================================ */

(function () {
  'use strict';

  // ============== CONFIG ==============
  const APP = window.BertaniApp = {};

  APP.config = {
    storageKey: 'bertani_access_key',
    sheetsEndpoint: 'https://script.google.com/macros/s/AKfycbxpwJIJyvtpQWXdMULZ-W-ABN2jQGp5obBSZusU3mtJPZPHPRiU7Ip_hlEmI3OM6Hui/exec',
    sheetsToken: 'brt2026kzm9x7q',
    trackRecordPublic: 'https://docs.google.com/spreadsheets/d/11vdDac-OgllCYSCKaRyc9_SlfBH_sifAZHdSaGBjwPM/',
    telegramPublic: 'https://t.me/renato_bertani',
    instagram: 'https://instagram.com/renatobertanioficial',
  };

  // ============== ACESSO (tier gating) ==============
  /*
   * MVP simplificado:
   * - URL com `?key=BR_xxx` → camada Briefing R$ 147
   * - URL com `?key=TP_xxx` → camada Tela Pro
   * - Sem key → modo demo (alguns recursos visíveis, calculadora bloqueada)
   *
   * V2: integração TurboCloud webhook → liberação automática
   */
  APP.access = {
    TIER_DEMO: 'demo',
    TIER_BRIEFING: 'briefing',
    TIER_TELAPRO: 'telapro',
    TIER_ELITE: 'elite',
    TIER_ADMIN: 'admin',

    /**
     * Captura key da URL (se presente) e armazena. Senão, usa armazenada.
     * Retorna o tier atual.
     */
    init() {
      const params = new URLSearchParams(window.location.search);
      const urlKey = params.get('key');
      if (urlKey) {
        try {
          localStorage.setItem(APP.config.storageKey, urlKey);
          // Limpa a URL pra não vazar a key em compartilhamentos
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
        } catch (e) {
          console.warn('localStorage indisponível, key fica em sessão apenas');
        }
      }
      return this.getCurrentTier();
    },

    getStoredKey() {
      try {
        return localStorage.getItem(APP.config.storageKey) || '';
      } catch (e) {
        return '';
      }
    },

    getCurrentTier() {
      const k = this.getStoredKey();
      if (!k) return this.TIER_DEMO;
      if (k.startsWith('ADMIN_')) return this.TIER_ADMIN;
      if (k.startsWith('EL_')) return this.TIER_ELITE;
      if (k.startsWith('TP_')) return this.TIER_TELAPRO;
      if (k.startsWith('BR_')) return this.TIER_BRIEFING;
      return this.TIER_DEMO;
    },

    has(requiredTier) {
      const tierRank = {
        [this.TIER_DEMO]: 0,
        [this.TIER_BRIEFING]: 1,
        [this.TIER_TELAPRO]: 2,
        [this.TIER_ELITE]: 3,
        [this.TIER_ADMIN]: 99,
      };
      const current = this.getCurrentTier();
      return tierRank[current] >= tierRank[requiredTier];
    },

    /** Atalho · só ADMIN tem acesso */
    isAdmin() {
      return this.getCurrentTier() === this.TIER_ADMIN;
    },

    requireOrLock(requiredTier, $elements) {
      // Se não tem o tier requerido, aplica visual de lock
      if (this.has(requiredTier)) return true;
      $elements.forEach(el => {
        el.classList.add('tier-locked');
        const lockEl = document.createElement('div');
        lockEl.className = 'tier-lock';
        const tierLabel = requiredTier === this.TIER_TELAPRO ? 'TELA PRO' : 'BRIEFING';
        lockEl.innerHTML = `
          <div class="blur">${el.innerHTML}</div>
          <div class="upgrade-cta">
            <p class="muted">Esse recurso é exclusivo da camada <strong>${tierLabel}</strong>.</p>
            <a href="/upgrade.html" class="btn btn-primary mt-3">Saber mais</a>
          </div>
        `;
        el.replaceWith(lockEl);
      });
      return false;
    },

    logout() {
      try { localStorage.removeItem(APP.config.storageKey); } catch (e) { /* noop */ }
      window.location.href = '/';
    },
  };

  // ============== HELPERS ==============
  APP.fmt = {
    /** Formata número como ponto BR (194500 → "194.500") */
    pts(n) {
      if (n == null) return '—';
      return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    },
    /** Formata número decimal BR (4985.5 → "4.985,5") */
    decimal(n, casas = 1) {
      if (n == null) return '—';
      return Number(n).toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
      });
    },
    /** R$ formatado */
    brl(n) {
      if (n == null) return '—';
      return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    /** Calcula resultado em R$ pra WIN (R$ 0,20/pt) */
    winBRL(pts, contratos = 1) {
      return pts * 0.20 * contratos;
    },
    /** Calcula resultado em R$ pra WDO (R$ 10/pt) */
    wdoBRL(pts, contratos = 1) {
      return pts * 10.00 * contratos;
    },
    /** Data BR (Date → "DD/MM/YYYY") */
    dataBR(d) {
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleDateString('pt-BR');
    },
    /** Hora BRT (Date → "HH:MM") */
    horaBRT(d) {
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },
  };

  // ============== SHEETS API (track record) ==============
  APP.sheets = {
    /**
     * Append novo trade no Sheets (BR público).
     * @param {object} dados - {data, hora_brt, ativo, direcao, ...}
     */
    async appendTrade(dados) {
      const params = new URLSearchParams({
        token: APP.config.sheetsToken,
        action: 'append',
        ...dados,
      });
      const url = `${APP.config.sheetsEndpoint}?${params.toString()}`;
      try {
        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();
        return json;
      } catch (e) {
        console.error('Erro ao registrar trade no Sheets:', e);
        return { ok: false, error: e.message };
      }
    },
  };

  // ============== UI HELPERS ==============
  APP.ui = {
    /** Mostra toast simples no topo direito */
    toast(msg, tipo = 'info', duracao = 3000) {
      const el = document.createElement('div');
      el.className = `toast toast-${tipo}`;
      el.textContent = msg;
      Object.assign(el.style, {
        position: 'fixed',
        top: '80px',
        right: '24px',
        zIndex: '999',
        padding: '12px 20px',
        borderRadius: '10px',
        background: 'var(--card)',
        border: '1px solid var(--border-bright)',
        color: 'var(--text)',
        boxShadow: 'var(--shadow-md)',
        maxWidth: '320px',
        fontSize: '14px',
      });
      if (tipo === 'success') el.style.borderColor = 'var(--green)';
      if (tipo === 'error') el.style.borderColor = 'var(--warn)';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), duracao);
    },

    /** Highlight item ativo no nav baseado em pathname */
    activeNav() {
      const path = window.location.pathname;
      document.querySelectorAll('nav.app-nav .nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (path === href || (href !== '/' && path.startsWith(href))) {
          a.classList.add('active');
        }
      });
    },

    /** Esconde links técnicos do nav pra tier Briefing/Demo (só Tela Pro+ vê) */
    applyNavGate() {
      const isTelaPro = APP.access.has(APP.access.TIER_TELAPRO);
      if (isTelaPro) return;
      const techPatterns = ['calculadora', 'educacao', 'historico', 'checklist', 'novo-trade'];
      document.querySelectorAll('nav.app-nav .nav-links a').forEach(a => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        if (techPatterns.some(p => href.indexOf(p) >= 0)) {
          a.style.display = 'none';
        }
      });
    },
  };

  // ============== INIT ==============
  APP.init = function () {
    APP.access.init();
    const onReady = () => {
      APP.ui.activeNav();
      APP.ui.applyNavGate();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  };

  APP.init();

})();
