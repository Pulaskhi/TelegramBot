class Header extends HTMLElement {
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

      header {
        position: fixed;
        top: 0;
        left: var(--sidebar-width);
        right: 0;
        height: var(--header-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));
        border-bottom: 1px solid rgba(16,24,40,0.04);
        z-index: 1001;
        backdrop-filter: blur(6px);
      }

      .header-left{ display:flex; align-items:center; gap:14px; }
      .title{ font-size:18px; font-weight:800; color:var(--text); }

      .header-actions{ display:flex; gap:10px; align-items:center; }
      .search{ padding:8px 12px; border-radius:12px; border:1px solid rgba(16,24,40,0.06); background: rgba(255,255,255,0.02); }
      .user{ display:flex; gap:8px; align-items:center; padding:6px 8px; border-radius:10px; cursor:pointer; }
      .avatar{ width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,var(--brand-1),var(--brand-2)); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; }
   
    </style>

    <header>
      <slot></slot>
    </header>
    
    `
  }
}

customElements.define('header-component', Header)
