class LoginButtonComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector('#login-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('show-login-modal', { bubbles: true, composed: true }));
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .login-btn {
          position: fixed;
          top: 18px;
          right: 32px;
          z-index: 1000;
          background: var(--accent, #2ea67a);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
      </style>
      <button id="login-btn" class="login-btn">Login</button>
    `;
  }
}

customElements.define('login-button', LoginButtonComponent);
