class PageComponent extends HTMLElement {
  constructor () {
    super()
    this.basePath = this.getAttribute('base-path') || ''
  }

  connectedCallback () {
    this.render()
    window.onpopstate = () => this.handleRouteChange()
  }

  handleRouteChange () {
    this.render()
  }

  render () {
    const path = window.location.pathname
    this.getTemplate(path)
  }

  async getTemplate (path) {
    const routes = {
      '/': 'home.html',
      '/login': 'login.html',
      '/create-password': 'create-password.html'
    }

    const filename = routes[path] || '404.html'

    await this.loadPage(filename)
    console.log('[page-component] route ->', path, 'file ->', filename)
  }

  async loadPage (filename) {
    const url = `${this.basePath}/pages/${filename}`
    console.log('[page-component] fetch ->', url)
    let response
    try {
      response = await fetch(url)
    } catch (err) {
      console.error('[page-component] fetch error', err)
      this.innerHTML = `<section style="padding:24px; max-width:720px; margin:24px auto;color:#c00">Error cargando la página: ${err.message}</section>`
      return
    }

    console.log('[page-component] response status', response.status)
    const html = await response.text()
    console.log('[page-component] html length', html.length)

    if (!response.ok || !html || html.trim().length === 0) {
      console.warn('[page-component] Página vacía o no encontrada')
      this.innerHTML = `<section style="padding:24px; max-width:720px; margin:24px auto;color:#c00">Página no encontrada o vacía (status: ${response.status})</section>`
      return
    }

    // Use startViewTransition if available, otherwise fall back to direct insertion
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        // Render page into light DOM so inline scripts can access elements via document.getElementById
        this.innerHTML = html
        document.documentElement.scrollTop = 0
      })
    } else {
      console.log('[page-component] startViewTransition not supported, using direct insert')
      this.innerHTML = html
      document.documentElement.scrollTop = 0
    }

    // Ejecutar scripts inline tras insertar el HTML
    const scripts = Array.from(this.querySelectorAll('script'))
    for (const oldScript of scripts) {
      const newScript = document.createElement('script')
      // Copia atributos
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value)
      }
      if (oldScript.src) {
        newScript.src = oldScript.src
        newScript.async = false
      } else {
        newScript.textContent = oldScript.textContent
      }
      oldScript.parentNode.replaceChild(newScript, oldScript)
    }

    // Development debug overlay to inspect rendered content
    try {
      if (window.location.hostname === 'localhost') {
        const dbgId = '_page_debug_overlay'
        let dbg = document.getElementById(dbgId)
        if (!dbg) {
          dbg = document.createElement('div')
          dbg.id = dbgId
          dbg.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;background:rgba(0,0,0,0.75);color:#fff;padding:8px;border-radius:6px;font-size:12px;max-width:380px;line-height:1.2;'
          document.body.appendChild(dbg)
        }
        const childrenCount = this.children.length
        const tags = Array.from(this.querySelectorAll('*')).slice(0,20).map(n => n.tagName.toLowerCase())
        dbg.textContent = `route:${window.location.pathname} children:${childrenCount} tags:${tags.join(',')}`
      }
    } catch (e) {
      console.warn('[page-component] debug overlay error', e)
    }
  }
}

customElements.define('page-component', PageComponent)
