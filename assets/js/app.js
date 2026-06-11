/* ================================================================
   BERTANI APP — Core JavaScript v2.0 (26/05/2026)
   Responsabilidades:
   - Auth real via magic link (substitui ?key= legacy)
   - Sessão server-side (Google Apps Script · validada via session_id)
   - Analytics de uso (pageview · briefing_open · logout)
   - Compat layer pra ?key=TP_BETA_xxx (testers legacy · 30 dias de tolerância)
   - Helpers comuns (formatação, fetch, storage)
   ================================================================ */

(function () {
  'use strict';

  // ============== CONFIG ==============
  const APP = window.BertaniApp = {};

  APP.config = {
    sessionKey: 'bertani_session',           // novo · JSON {session_id, email, tier, ...}
    legacyKey:  'bertani_access_key',        // antigo · só pra compat layer
    sheetsEndpoint: 'https://script.google.com/macros/s/AKfycbyIq1sh5z5pxE5fDEBvxJ2XqDwhgBWZsscDlhETqkU3xmswSCTliPFib4I9XjSY_jY5/exec',
    sheetsToken: 'brt2026kzm9x7q',
    trackRecordPublic: 'https://docs.google.com/spreadsheets/d/11vdDac-OgllCYSCKaRyc9_SlfBH_sifAZHdSaGBjwPM/',
    telegramPublic: 'https://t.me/renato_bertani',
    instagram: 'https://instagram.com/renatobertanioficial',
    loginUrl: '/login.html',
    verifyUrl: '/verify.html',
    appHome: '/briefing/do-dia.html'
  };

  // ============== AUTH ==============
  /*
   * Fluxo:
   * 1. Cliente vai pra /login.html · digita email
   * 2. APP.auth.requestLogin(email) → GAS /login_request → email com magic link
   * 3. Cliente clica no link · vai pra /verify.html?token=xxx
   * 4. APP.auth.verifyToken(token) → GAS /verify → recebe session JSON
   * 5. APP.auth.saveSession(sess) → salva em localStorage
   * 6. Redirect pra appHome
   * 7. Em cada page-load, APP.auth.getSession() pega do localStorage
   * 8. Tier do session destrava conteúdo via APP.access.has(tier)
   */
  APP.auth = {
    /** Solicita magic link · cliente fornece email */
    async requestLogin(email) {
      const params = new URLSearchParams({
        token: APP.config.sheetsToken,
        action: 'login_request',
        email: email
      });
      const url = `${APP.config.sheetsEndpoint}?${params.toString()}`;
      try {
        const res = await fetch(url, { method: 'GET' });
        return await res.json();
      } catch (e) {
        return { ok: false, error: 'rede indisponivel · tente de novo' };
      }
    },

    /** Valida magic link token · recebe sessão · salva */
    async verifyToken(token) {
      const params = new URLSearchParams({
        token: APP.config.sheetsToken,
        action: 'verify',
        token_link: token,
        url: window.location.href
      });
      const url = `${APP.config.sheetsEndpoint}?${params.toString()}`;
      try {
        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();
        if (json.ok && json.session) this.saveSession(json.session);
        return json;
      } catch (e) {
        return { ok: false, error: 'rede indisponivel · tente de novo' };
      }
    },

    /** Salva sessão no localStorage */
    saveSession(session) {
      try {
        localStorage.setItem(APP.config.sessionKey, JSON.stringify(session));
      } catch (e) { console.warn('saveSession falhou:', e); }
    },

    /** Pega sessão atual do localStorage · null se ausente/expirada */
    getSession() {
      try {
        const raw = localStorage.getItem(APP.config.sessionKey);
        if (!raw) return null;
        const sess = JSON.parse(raw);
        if (sess.expires_at && new Date(sess.expires_at) < new Date()) {
          this.logout();
          return null;
        }
        return sess;
      } catch (e) { return null; }
    },

    /** Valida session server-side (renova last_seen) · não-bloqueante */
    async refreshSession() {
      const sess = this.getSession();
      if (!sess || !sess.session_id) return null;
      const params = new URLSearchParams({
        token: APP.config.sheetsToken,
        action: 'session_check',
        session_id: sess.session_id
      });
      try {
        const res = await fetch(`${APP.config.sheetsEndpoint}?${params.toString()}`);
        const json = await res.json();
        if (json.ok && json.session) {
          this.saveSession(json.session);
          return json.session;
        } else if (json.error === 'sessao expirada') {
          this.logout();
        }
      } catch (e) { /* offline · usa cache */ }
      return sess;
    },

    /** Logout · limpa local + redireciona pro login */
    logout() {
      const sess = this.getSession();
      if (sess) APP.analytics.track('logout', { email: sess.email });
      try { localStorage.removeItem(APP.config.sessionKey); } catch (e) {}
      try { localStorage.removeItem(APP.config.legacyKey); } catch (e) {}
      window.location.href = APP.config.loginUrl;
    },

    /** Está logado? */
    isLoggedIn() {
      return this.getSession() !== null;
    },

    /** Redireciona pra login se não estiver logado */
    requireLogin(opts) {
      opts = opts || {};
      if (this.isLoggedIn()) return true;
      // Compat layer · se URL tem ?key=XX_xxx (legacy tester), tolera mas avisa
      const urlKey = new URLSearchParams(window.location.search).get('key');
      if (urlKey && opts.allowLegacyKey !== false) {
        try { localStorage.setItem(APP.config.legacyKey, urlKey); } catch (e) {}
        return true;
      }
      // Senão, redireciona
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = APP.config.loginUrl + '?return_to=' + returnTo;
      return false;
    }
  };

  // ============== ACESSO (tier gating · agora baseado em session) ==============
  APP.access = {
    TIER_DEMO: 'demo',
    TIER_BRIEFING: 'briefing',
    TIER_TELAPRO: 'telapro',
    TIER_ELITE: 'elite',
    TIER_ADMIN: 'admin',

    /** Lê tier da sessão atual · fallback pra legacy key · fallback demo */
    getCurrentTier() {
      const sess = APP.auth.getSession();
      if (sess && sess.tier) return sess.tier;

      // Compat layer · key legacy na URL ou localStorage
      let key = '';
      try {
        const urlKey = new URLSearchParams(window.location.search).get('key');
        if (urlKey) {
          localStorage.setItem(APP.config.legacyKey, urlKey);
          // Limpa URL pra não vazar
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
          key = urlKey;
        } else {
          key = localStorage.getItem(APP.config.legacyKey) || '';
        }
      } catch (e) {}

      if (!key) return this.TIER_DEMO;
      if (key.startsWith('ADMIN_'))    return this.TIER_ADMIN;
      if (key.startsWith('EL_'))       return this.TIER_ELITE;
      if (key.startsWith('TP_'))       return this.TIER_TELAPRO;
      if (key.startsWith('BR_'))       return this.TIER_BRIEFING;
      return this.TIER_DEMO;
    },

    has(requiredTier) {
      const tierRank = {
        [this.TIER_DEMO]: 0,
        [this.TIER_BRIEFING]: 1,
        [this.TIER_TELAPRO]: 2,
        [this.TIER_ELITE]: 3,
        [this.TIER_ADMIN]: 99
      };
      const current = this.getCurrentTier();
      return tierRank[current] >= tierRank[requiredTier];
    },

    isAdmin() {
      return this.getCurrentTier() === this.TIER_ADMIN;
    },

    /** Compat com versão antiga · alias pra auth.logout */
    logout() { APP.auth.logout(); }
  };

  // ============== ANALYTICS ==============
  APP.analytics = {
    /** Registra evento de uso · fire-and-forget · não bloqueia render */
    track(evento, extras) {
      const sess = APP.auth.getSession();
      const params = new URLSearchParams({
        token: APP.config.sheetsToken,
        action: 'track',
        evento: evento,
        url: window.location.pathname + window.location.search,
        extras: extras ? JSON.stringify(extras) : ''
      });
      if (sess && sess.session_id) params.append('session_id', sess.session_id);
      else if (sess && sess.email) params.append('email', sess.email);

      // Usa sendBeacon se disponível (não bloqueia · não exige resposta)
      const url = `${APP.config.sheetsEndpoint}?${params.toString()}`;
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([''], { type: 'text/plain' });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, { method: 'GET', keepalive: true }).catch(() => {});
        }
      } catch (e) { /* silencioso */ }
    },

    /** Auto-track pageview no init · evento especial pra briefing */
    autoTrack() {
      const path = window.location.pathname;
      if (path.indexOf('/briefing/do-dia') >= 0) {
        this.track('briefing_open', { path: path });
      } else {
        this.track('pageview', { path: path });
      }
    }
  };

  // ============== HELPERS (mantidos do v1) ==============
  APP.fmt = {
    pts(n) {
      if (n == null) return '—';
      return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    },
    decimal(n, casas = 1) {
      if (n == null) return '—';
      return Number(n).toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
      });
    },
    brl(n) {
      if (n == null) return '—';
      return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    winBRL(pts, contratos = 1) { return pts * 0.20 * contratos; },
    wdoBRL(pts, contratos = 1) { return pts * 10.00 * contratos; },
    dataBR(d) {
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleDateString('pt-BR');
    },
    horaBRT(d) {
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  };

  // ============== SHEETS (track record · mantido v1) ==============
  APP.sheets = {
    async appendTrade(dados) {
      const params = new URLSearchParams({
        token: APP.config.sheetsToken,
        action: 'append',
        ...dados
      });
      const url = `${APP.config.sheetsEndpoint}?${params.toString()}`;
      try {
        const res = await fetch(url, { method: 'GET' });
        return await res.json();
      } catch (e) {
        console.error('Erro ao registrar trade no Sheets:', e);
        return { ok: false, error: e.message };
      }
    }
  };

  // ============== UI HELPERS ==============
  APP.ui = {
    toast(msg, tipo = 'info', duracao = 3000) {
      const el = document.createElement('div');
      el.className = `toast toast-${tipo}`;
      el.textContent = msg;
      Object.assign(el.style, {
        position: 'fixed', top: '80px', right: '24px', zIndex: '999',
        padding: '12px 20px', borderRadius: '10px',
        background: 'var(--card)', border: '1px solid var(--border-bright)',
        color: 'var(--text)', boxShadow: 'var(--shadow-md)',
        maxWidth: '320px', fontSize: '14px'
      });
      if (tipo === 'success') el.style.borderColor = 'var(--green)';
      if (tipo === 'error')   el.style.borderColor = 'var(--warn)';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), duracao);
    },

    activeNav() {
      const path = window.location.pathname;
      document.querySelectorAll('nav.app-nav .nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (path === href || (href !== '/' && path.startsWith(href))) a.classList.add('active');
      });
    },

    /** 10/06/2026: injeta o link Métricas no menu principal de TODAS as páginas (1 edição · app inteiro).
     *  Gated pra Tela Pro+ via applyNavGate (pattern 'metricas'). */
    injectMetricasNav() {
      const nav = document.querySelector('nav.app-nav .nav-links');
      if (!nav || nav.querySelector('a[data-metricas]')) return;
      // raiz vs subpasta (briefing/, educacao/, registro/, ...)
      const depth = (window.location.pathname.match(/\//g) || []).length;
      const prefix = window.location.pathname.indexOf('/briefing/') >= 0 || window.location.pathname.indexOf('/educacao/') >= 0 ||
                     window.location.pathname.indexOf('/registro/') >= 0 || window.location.pathname.indexOf('/checklist/') >= 0 ||
                     window.location.pathname.indexOf('/calculadora/') >= 0 ? '../' :
                     (window.location.pathname.indexOf('/modelos/') >= 0 || window.location.pathname.indexOf('/fases/') >= 0 ? '../../' : '');
      const a = document.createElement('a');
      a.setAttribute('data-metricas', '1');
      a.href = prefix + 'briefing/metricas.html';
      a.textContent = 'Métricas';
      // insere antes do Track Record (ou no fim)
      const tr = Array.prototype.find.call(nav.querySelectorAll('a'), x => (x.getAttribute('href') || '').indexOf('historico') >= 0);
      nav.insertBefore(a, tr || null);
    },

    applyNavGate() {
      const isTelaPro = APP.access.has(APP.access.TIER_TELAPRO);
      if (isTelaPro) return;
      const techPatterns = ['calculadora', 'educacao', 'historico', 'checklist', 'novo-trade', 'metricas'];
      document.querySelectorAll('nav.app-nav .nav-links a').forEach(a => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        if (techPatterns.some(p => href.indexOf(p) >= 0)) a.style.display = 'none';
      });
    },

    /** Adiciona botão de logout no nav (se logado · senão botão de login) */
    renderAuthButton() {
      const nav = document.querySelector('nav.app-nav .nav-links');
      if (!nav) return;
      const sess = APP.auth.getSession();

      // Remove existente se houver
      const existing = nav.querySelector('.auth-action');
      if (existing) existing.remove();

      const a = document.createElement('a');
      a.className = 'auth-action';
      if (sess) {
        a.href = '#';
        a.textContent = '↪ Sair';
        a.title = sess.email + ' · ' + sess.tier;
        a.addEventListener('click', function(e) { e.preventDefault(); APP.auth.logout(); });
      } else {
        a.href = APP.config.loginUrl;
        a.textContent = '↳ Entrar';
      }
      nav.appendChild(a);
    }
  };

  // ============== INIT ==============
  APP.init = function (opts) {
    opts = opts || {};
    const onReady = () => {
      APP.ui.injectMetricasNav();
      APP.ui.activeNav();
      APP.ui.applyNavGate();
      APP.ui.renderAuthButton();
      // Auto-track pageview (exceto na própria login/verify)
      const path = window.location.pathname;
      if (path.indexOf('/login') < 0 && path.indexOf('/verify') < 0) {
        APP.analytics.autoTrack();
        // Tenta refresh de session em background (atualiza last_seen)
        APP.auth.refreshSession();
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  };

  APP.init();

})();
