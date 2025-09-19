class Message extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })

    document.addEventListener('notice', this.handleMessage.bind(this))
  }

  async connectedCallback () {
    await this.render()
  }

  handleMessage (event) {
    const { message, type } = event.detail
    const spanMessage = this.shadowRoot.querySelector('.message span')
    spanMessage.textContent = message

    const colorElement = this.shadowRoot.querySelector('.color')
    colorElement.classList.remove('success', 'error')
    colorElement.classList.add(type)

    const colorTimeElement = this.shadowRoot.querySelector('.color-time')
    colorTimeElement.classList.remove('success', 'error')
    colorTimeElement.classList.add(type)

    colorTimeElement.style.transition = 'none'
    colorTimeElement.style.width = '0%'
    colorTimeElement.style.transition = 'width 5s linear'
    colorTimeElement.style.width = '100%'

    const messageElement = this.shadowRoot.querySelector('.notice')
    messageElement.classList.add('active')

    setTimeout(() => {
      messageElement.classList.remove('active')
      colorTimeElement.style.transition = 'none'
      colorTimeElement.style.width = '0%'
    }, 5000)
  }

  render () {
    this.shadow.innerHTML =
      /* html */`
    <style>
      *{
        box-sizing: border-box;
        font-family: "Nunito Sans", serif;
        font-optical-sizing: auto;
      }

      .color-container {
        position: relative;
        width: 100%;
        height: 0.2rem;
        overflow: hidden;
      }

      .color,
      .color-time {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
      }

      .color {
        width: 100%;
        z-index: 0;
      }

      .color-time {
        width: 0%;
        z-index: 1;
        filter: saturate(10%);
        transition: width 5s linear;
      }


      .success{
        background-color: hsl(120, 94%, 32%);
      }

      .error{
        background-color: hsl(0, 100%, 50%);
      }

      .notice {
        background-color: wheat;
        position: fixed;
        bottom: 3%;
        right: 2%;
        text-align: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
      }

      .notice.active {
        opacity: 1;
        visibility: visible;
      }

      .message{
        padding: 1rem;
        color: #000;
      }

    </style>

    <section class="notice">
      <div class="color-container">
        <div class="color"></div>
        <div class="color-time"></div>
      </div>
      <div class="message">
        <span></span>
      </div>
    </section>

    `
  }
}

customElements.define('message-component', Message)
