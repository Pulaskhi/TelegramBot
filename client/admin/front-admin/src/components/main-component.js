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

      /* Default layout: content + right panel */
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

      /* Fullscreen mode: when the host element has class 'fullscreen' make the inner main occupy whole viewport
         and use a single column layout so slotted full-page components can take entire width/height. */
      :host(.fullscreen) main {
        grid-template-columns: 1fr;
        gap: 0;
        padding: 0;
        width: 100%;
        margin-left: 0;
        margin-top: 0;
        min-height: 100vh;
      }

      /* Make slotted children expand when in fullscreen */
      :host(.fullscreen) ::slotted(*) {
        width: 100%;
        height: 100vh;
        display: block;
        padding: 0;
        margin: 0;
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
