class Main extends HTMLElement {
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

      * { box-sizing: border-box; }

      main {
        display: grid;
        grid-template-columns: 1fr 420px; /* content + right panel (form/details) */
        gap: 20px;
        padding: 20px;
        width: calc(100% - var(--sidebar-width));
        margin-left: var(--sidebar-width);
        margin-top: var(--header-height);
        min-height: calc(100vh - var(--header-height));
      }

      @media (max-width: 1000px){
        main{ grid-template-columns: 1fr; margin-left: 0; width:100%; }
      }

      ::slotted(*){ background: var(--card); padding: 18px; border-radius: 12px; box-shadow: 0 8px 24px rgba(17,24,39,0.04); border: 1px solid rgba(16,24,40,0.04); }

      /* Ensure forms and tables inside scale properly */
      .panel-full{ width:100%; height:100%; }

    </style>

    <main class="fill-viewport">
      <slot></slot>
    </main>
    `
  }
}

customElements.define('main-component', Main)
