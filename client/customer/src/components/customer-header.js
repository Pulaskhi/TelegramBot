class CustomerHeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.user = null;
  }

  connectedCallback() {
    this.render();
    this.loadUser();
  }

  async loadUser() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/customer/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('No autenticado');
      this.user = await res.json();
      this.render();
    } catch (e) {
      this.user = null;
      this.render();
    }
  }

  handleMenuToggle() {
    const menu = this.shadowRoot.querySelector('.user-menu');
    menu.classList.toggle('open');
  }

  handleLogout() {
    localStorage.removeItem('token');
    window.location.reload();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .header {
          width: 100vw;
          height: 0;
          position: relative;
        }
        .user-area {
          position: fixed;
          top: 18px;
          right: 32px;
          z-index: 1000;
        }
        .user-btn {
          background: var(--accent, #2ea67a);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-btn:hover {
          background: #249366;
        }
        .user-menu {
          display: none;
          position: absolute;
          right: 0;
          top: 48px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          min-width: 180px;
          padding: 0.5rem 0;
        }
        .user-menu.open {
          display: block;
        }
        .user-menu-item {
          padding: 0.7rem 1.2rem;
          cursor: pointer;
          color: #222;
        }
        .user-menu-item:hover {
          background: #f5f6f7;
        }
        .login-link {
          background: var(--accent, #2ea67a);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          text-decoration: none;
        }
        .login-link:hover {
          background: #249366;
        }
      </style>
      <div class="header">
        <div class="user-area">
          ${this.user ? `
            <button class="user-btn" id="user-btn">${this.user.name || this.user.email.split('@')[0]} &#x25BC;</button>
            <div class="user-menu" id="user-menu">
              <div class="user-menu-item" id="my-account">Mi cuenta</div>
              <div class="user-menu-item" id="my-bot">Mi bot</div>
              <div class="user-menu-item" id="logout">Salir</div>
            </div>
          ` : `<a href="#" class="login-link" id="login-link">Login</a>`}
        </div>
      </div>
    `;
    if (this.user) {
      this.shadowRoot.getElementById('user-btn').onclick = () => this.handleMenuToggle();
      this.shadowRoot.getElementById('logout').onclick = () => this.handleLogout();
      // Aquí puedes añadir listeners para "Mi cuenta" y "Mi bot"
    } else {
      const loginLink = this.shadowRoot.getElementById('login-link');
      if (loginLink) loginLink.onclick = (e) => {
        e.preventDefault();
        document.querySelector('login-modal').show();
      };
    }
  }
}

customElements.define('customer-header', CustomerHeaderComponent);
