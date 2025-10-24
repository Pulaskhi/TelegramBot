class Title extends HTMLElement {
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
        margin: 0;
        padding: 0;
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

      ul{
        list-style-type: none;
        margin: 0;
        padding: 0;
      }

      .header__title h2 {
        font-size: 24px;
      }
   

    </style>

    <div class="header__title">
      <h2></h2>
    </div>
    
    `
  }
}

customElements.define('title-component', Title)
