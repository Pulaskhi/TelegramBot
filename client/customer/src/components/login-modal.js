class LoginModalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleClose = this.handleClose.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this._outsideClickHandler = this._outsideClickHandler.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector('#close-modal').addEventListener('click', this.handleClose);
    this.shadowRoot.querySelector('#login-modal-btn').addEventListener('click', this.handleLogin);
    this.shadowRoot.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      this.handleLogin();
    });

    // Close when clicking outside the modal content
    this.shadowRoot.addEventListener('click', this._outsideClickHandler);
    // Close on Escape key
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    // Clean up listeners
    try { this.shadowRoot.querySelector('#close-modal').removeEventListener('click', this.handleClose); } catch (e) {}
    try { this.shadowRoot.querySelector('#login-modal-btn').removeEventListener('click', this.handleLogin); } catch (e) {}
    this.shadowRoot.removeEventListener('click', this._outsideClickHandler);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  handleClose() {
    this.style.display = 'none';
  }

  _outsideClickHandler(e) {
    const path = e.composedPath();
    const modal = this.shadowRoot.querySelector('.modal');
    if (!path.includes(modal)) {
      this.handleClose();
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') this.handleClose();
  }

  async handleLogin() {
    const email = this.shadowRoot.querySelector('#modal-email').value.trim();
    const password = this.shadowRoot.querySelector('#modal-password').value;
    const message = this.shadowRoot.querySelector('#modal-message');
    message.textContent = '';
    if (!email) return message.textContent = 'El email es requerido';
    if (!password) return message.textContent = 'La contraseña es requerida';
    const btn = this.shadowRoot.querySelector('#login-modal-btn');
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    try {
      const res = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      localStorage.setItem('token', data.token);
      message.textContent = 'Login correcto. Redirigiendo...';
      setTimeout(() => { window.location.href = '/'; }, 600);
    } catch (err) {
      message.textContent = err.message || 'Credenciales inválidas';
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  }

  show() {
    this.style.display = 'flex';
    this.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.shadowRoot.querySelector('#modal-email').focus();
  }

  handleClose() {
    this.style.display = 'none';
    this.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; position: fixed; top:0; left:0; width:100vw; height:100vh; z-index:2000; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); }
        .modal { position:relative; background: #ffffff; border-radius: 12px; padding: 32px 28px 24px 28px; box-shadow: 0 12px 40px rgba(0,0,0,0.28); min-width:320px; max-width:560px; width:90%; color:#222; }
        .modal h2 { margin-top:0; margin-bottom:8px; font-size:1.25rem; }
        .modal label { display:block; margin: 12px 0 6px 0; font-weight:600; color: #1f2933; }
        .modal input { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #d1d5db; margin-bottom:10px; font-size:1rem; background:#fbfcfd; color:#111; }
        .modal input:focus { outline:none; border-color:var(--accent,#2ea67a); box-shadow:0 0 0 3px rgba(46,166,122,0.08); }
        .modal button { margin-top:10px; width:100%; padding:10px; border-radius:8px; border:none; background:var(--accent,#2ea67a); color:#fff; font-weight:700; font-size:1rem; cursor:pointer; }
        .modal button[disabled]{ opacity:0.6; cursor:not-allowed; }
        .close-btn {
          position:absolute;
          top:10px;
          right:10px;
          width:24px;
          height:24px;
          min-width:24px;
          min-height:24px;
          max-width:24px;
          max-height:24px;
          border-radius:50%;
          background:transparent;
          border:none;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:16px !important;
          color:#888;
          cursor:pointer;
          transition: background 0.15s, color 0.15s;
          box-shadow:none;
          padding:0;
          line-height:1;
        }
        .close-btn span {
          font-size:18px !important;
          line-height:1;
          pointer-events:none;
        }
        .close-btn:hover {
          background:#f0f0f0;
          color:#d32f2f;
        }
        #modal-message { color:#b91c1c; min-height:24px; margin-top:8px; font-weight:600; }
      </style>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
        <button id="close-modal" class="close-btn" title="Cerrar" aria-label="Cerrar"><span>&times;</span></button>
        <h2 id="login-modal-title">Iniciar sesión</h2>
        <form autocomplete="off" novalidate>
          <label>Email
            <input id="modal-email" name="email" type="email" required autocomplete="username">
          </label>
          <label>Contraseña
            <input id="modal-password" name="password" type="password" required autocomplete="current-password">
          </label>
          <button type="submit" id="login-modal-btn">Entrar</button>
        </form>
        <div id="modal-message"></div>
      </div>
    `;
  }
}

customElements.define('login-modal', LoginModalComponent);
