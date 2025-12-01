class Menu extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback () {
    this.render()
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
    <style>


      * {
        box-sizing: border-box;
      }

      button{
        background-color: transparent;
        border: none;
        cursor: pointer;
        outline: none;
        padding: 0;
      }

      h1, h2, h3, h4, h5, h6, p{
        margin: 0;
      }
      
      h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button{
          font-family: "Nunito Sans", serif;
          font-optical-sizing: auto;
        }


      img{
        object-fit: cover;
        width: 100%;
      }


      :host{ display:block; }

      /* Fixed left sidebar */
      .sidebar{
        position: fixed;
        left: 0;
        top: 0;
        width: var(--sidebar-width);
        height: 100vh;
        padding: 24px 16px;
        background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(8,10,14,0.04));
        border-right: 1px solid rgba(16,24,40,0.04);
        display:flex;
        flex-direction:column;
        gap:12px;
        z-index: 1002;
      }

      .brand{ display:flex; gap:12px; align-items:center; margin-bottom:8px; }
      .brand .logo-mark{ width:40px; height:40px; border-radius:8px; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800 }
      .brand h3{ font-size:16px; margin:0; color: var(--text); }

      nav{ margin-top:8px; display:flex; flex-direction:column; gap:6px; }
      nav a{ display:flex; gap:10px; align-items:center; padding:10px 12px; border-radius:10px; color: var(--muted); text-decoration:none; font-weight:700; }
      nav a:hover{ background: rgba(99,102,241,0.06); color: var(--brand-1); }
      nav a.active{ background: linear-gradient(90deg, var(--brand-1), var(--brand-2)); color: white; box-shadow: 0 6px 18px rgba(99,102,241,0.12); }

      .footer-info{ margin-top:auto; font-size:12px; color:var(--muted); }

    </style>
    
    <div class="header__menu">
      <div class="menu__logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <title>menu</title>
          <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
        </svg>
      </div>
    </div>
  
    `
  }
}

customElements.define('menu-component', Menu)
