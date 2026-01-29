class Faqs extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = []
  }

  async connectedCallback () {
    await this.loadData()
    this.render()
  }

  async loadData () {
    try {
      const response = await fetch('/api/customer/faqs') // use proxy / relative path
      if (!response.ok) throw new Error('Error al obtener FAQs')
      this.data = await response.json()
    } catch (error) {
      console.error('Error cargando FAQs:', error)
      this.data = []
    }
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
    <style>
      *{ box-sizing: border-box }
      :host{ display:block }
      h1,h2,h3,h4,h5,h6,p{ margin:0 }
      h1,h2,h3,h4,h5,h6,p,a,span,li,label,input,button{ font-family: Inter, 'Nunito Sans', system-ui, sans-serif }
      .faqs{ background: var(--surface); padding:2.25rem; border-radius: 0; color:var(--text); }
      .faqs-title{ padding: 0 0 1rem 0 }
      .faqs-title h3{ font-weight:700; font-size:1.5rem; text-transform:uppercase; color:var(--accent) }
      .faqs-content{ display:flex; flex-direction:column; gap:0.75rem }
      .faq{ border-radius:10px; overflow:hidden }
      .faqs summary{ list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.85rem 1rem; background:transparent; border-bottom:1px solid rgba(255,255,255,0.04) }
      .faqs details[open] summary{ background: rgba(255,255,255,0.02); }
      .faqs details[open]{ border-bottom: none }
      .faqs details p{ font-size:0.98rem; line-height:1.6; color:var(--muted); padding:0.75rem 1rem 1rem 1rem }
      .faq-button{ display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px }
      .faq-button svg{ width:20px; height:20px; fill:var(--muted) }
      details[open] .faq-button svg{ transform:rotate(45deg); fill:var(--accent) }
      summary::-webkit-details-marker{ display:none }
      @media(min-width:768px){ .faqs-title h3{ font-size:2rem } }
    </style>

    <section class="faqs">
      <div class="faqs-title">
        <h3>Preguntas frecuentes</h3>
      </div>
      <div class="faqs-content"></div>
    </section>
    `

    const faqsContainer = this.shadow.querySelector('.faqs-content')

    this.data.forEach(faq => {
      const faqContainer = document.createElement('div')
      faqContainer.classList.add('faq')
      faqsContainer.appendChild(faqContainer)

      const details = document.createElement('details')
      details.name = 'faqs'
      faqContainer.appendChild(details)

      const summary = document.createElement('summary')
      details.appendChild(summary)

      const faqContentTitle = document.createElement('div')
      faqContentTitle.classList.add('faq-content-title')
      summary.appendChild(faqContentTitle)

      const faqTitle = document.createElement('h3')
      faqTitle.textContent = faq.title
      faqContentTitle.appendChild(faqTitle)

      const faqButton = document.createElement('div')
      faqButton.classList.add('faq-button')
      summary.appendChild(faqButton)

      faqButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <title>plus</title>
        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
      </svg>`

      const faqContent = document.createElement('p')
      faqContent.textContent = faq.description || faq.content || ''
      details.appendChild(faqContent)
    })
  }
}

customElements.define('faqs-component', Faqs)