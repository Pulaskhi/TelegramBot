class ChatBot extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.socket = new WebSocket(import.meta.env.VITE_WS_URL)
    this.threadId = null
    this.isOpen = false
    this.isTyping = false
    this.escalateToHuman = false
  }

  connectedCallback () {
    this.socket.addEventListener('open', () => {
      this.socketReady = true
      if (sessionStorage.getItem('threadId')) this.wsSubscribe(sessionStorage.getItem('threadId'))
    })

    this.socket.addEventListener('message', event => {
      const { channel, data } = JSON.parse(event.data)

      if (this.threadId && channel === this.threadId) {
        const sendButton = this.shadow.querySelector('.send-button')
        const container = this.createHumanResponseContainer()
        this.writeNewAnswer(data.message, container, true)
        this.isTyping = false
        sendButton.disabled = false
      }
    })

    this.socket.addEventListener('close', () => { this.socketReady = false })
    this.socket.addEventListener('error', () => { this.socketReady = false })

    if (sessionStorage.getItem('threadId')) {
      this.loadData()
    }

    this.render()
  }

  wsSend (obj) {
    console.log(this.socketReady)
    if (!this.socketReady) return
    this.socket.send(JSON.stringify(obj))
  }

  wsSubscribe (channel) {
    this.wsSend({ type: 'subscribe', channel })
  }

  wsUnsubscribe (channel) {
    this.wsSend({ type: 'unsubscribe', channel })
  }

  loadData = async () => {
    try {
      const response = await fetch(`/api/customer/chats/${sessionStorage.getItem('threadId')}`)
      const data = await response.json()
      this.renderChat(data)
    } catch (error) {
      console.error('Error loading chat data:', error)
    }
  }

  renderChat (data) {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    chatMessages.innerHTML = ''

    data.reverse().forEach(message => {
      if (message.role === 'user') {
        this.createUserMessage(message.content)
      } else if (message.role === 'assistant') {
        const container = this.createAssistantResponseContainer()
        this.writeNewAnswer(JSON.parse(message.content).text, container, false)
      }
    })

    if (sessionStorage.getItem('escalateToHuman') === 'true') {
      this.escalateToHuman = true
    }
  }

  render () {
    this.shadow.innerHTML = /* html */`
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .chatbot-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          padding: 15px 25px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
          transition: all 0.3s ease;
          z-index: 1000;
          min-width: 280px;
          text-align: center;
          font-family: "SoehneBuch", sans-serif;
        }

        .chatbot-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
          background: linear-gradient(135deg, #c0392b, #a93226);
        }

        .chatbot-button:active {
          transform: translateY(0);
        }

        .chat-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 380px;
          height: 500px;
          background: hsl(235, 7%, 31%);
          border: 1px solid hsl(0, 0%, 40%);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: none;
          flex-direction: column;
          z-index: 1001;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
          font-family: "SoehneBuch", sans-serif;
          color: hsl(0, 0%, 100%);
        }

        .chat-container.active {
          display: flex;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          padding: 20px;
          text-align: center;
          position: relative;
        }

        .chat-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .chat-header p {
          font-size: 12px;
          opacity: 0.9;
        }

        .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: hsl(235, 7%, 31%);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: hsl(0, 0%, 20%);
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: hsl(0, 0%, 50%);
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: hsl(0, 0%, 60%);
        }

        .prompt {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .prompt:first-child {
          margin-top: 1rem;
        }

        .prompt:last-child {
          margin-bottom: 1rem;
        }

        .message {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .message h3 {
          font-size: 0.9rem;
          margin: 0;
          color: hsl(0, 0%, 100%);
        }

        .message p {
          font-size: 1rem;
          margin: 0;
          color: hsl(0, 0%, 100%);
          line-height: 1.4;
        }

        .avatar {
          align-items: center;
          border: 1px solid hsl(0, 0%, 40%);
          border-radius: 50%;
          display: flex;
          height: 1.5rem;
          justify-content: center;
          min-width: 1.5rem;
          overflow: hidden;
          width: 1.5rem;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .avatar.assistant {
          background: linear-gradient(135deg, #27ae60, #229954);
        }

        .state {
          align-items: center;
          display: flex;
          gap: 0.5rem;
        }

        .state-bubble {
          background-color: hsl(0, 0%, 100%);
          border-radius: 50%;
          height: 1rem;
          width: 1rem;
        }

        .state-bubble.active {
          animation: pulse 1s infinite;
        }

        .state-message {
          font-size: 0.9rem;
          color: hsl(0, 0%, 100%);
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1);
          }
          100% {
            transform: scale(0.8);
          }
        }

        .chat-input-area {
          padding: 20px;
          background: hsl(235, 7%, 31%);
          border-top: 1px solid hsl(0, 0%, 40%);
          display: flex;
          gap: 10px;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid hsl(0, 0%, 40%);
          border-radius: 25px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          font-family: "SoehneBuch", sans-serif;
          background: hsl(235, 7%, 25%);
          color: hsl(0, 0%, 100%);
        }

        .chat-input:focus {
          border-color: #e74c3c;
        }

        .chat-input::placeholder {
          color: hsl(0, 0%, 60%);
        }

        .send-button {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 16px;
        }

        .send-button:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .welcome-message {
          text-align: center;
          padding: 20px;
          color: hsl(0, 0%, 80%);
          font-size: 14px;
        }

        @media (max-width: 480px) {
          .chat-container {
            width: calc(100vw - 20px);
            height: calc(100vh - 40px);
            bottom: 10px;
            right: 10px;
            left: 10px;
            border-radius: 10px;
          }

          .chatbot-button {
            bottom: 20px;
            right: 20px;
            min-width: 250px;
            padding: 12px 20px;
            font-size: 13px;
          }
        }
      </style>

      <button class="chatbot-button">
        ¿alguna duda? habla con nosotros ahora
      </button>

      <div class="chat-container">
        <div class="chat-header">
          <button class="close-button">×</button>
          <h3>Asistente Virtual</h3>
          <p>Estamos aquí para ayudarte</p>
        </div>

        <div class="chat-messages">
          <div class="welcome-message">
            ¡Hola! 👋 Soy tu asistente virtual de Producto de Aquí.<br>
            ¿En qué puedo ayudarte hoy?
          </div>
        </div>

        <div class="chat-input-area">
          <input type="text" class="chat-input" name="prompt" placeholder="Escribe tu mensaje..." required>
          <button class="send-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `

    const chatButton = this.shadow.querySelector('.chatbot-button')
    const closeButton = this.shadow.querySelector('.close-button')
    const chatInput = this.shadow.querySelector('.chat-input')
    const sendButton = this.shadow.querySelector('.send-button')

    chatButton.addEventListener('click', () => this.toggleChat())
    closeButton.addEventListener('click', () => this.closeChat())
    sendButton.addEventListener('click', () => this.sendMessage())
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage()
      }
    })
  }

  toggleChat () {
    if (this.isOpen) {
      this.closeChat()
    } else {
      this.openChat()
    }
  }

  openChat () {
    const chatContainer = this.shadow.querySelector('.chat-container')
    const chatButton = this.shadow.querySelector('.chatbot-button')
    const chatInput = this.shadow.querySelector('.chat-input')

    chatContainer.classList.add('active')
    chatButton.style.display = 'none'
    this.isOpen = true
    chatInput.focus()
  }

  closeChat () {
    const chatContainer = this.shadow.querySelector('.chat-container')
    const chatButton = this.shadow.querySelector('.chatbot-button')

    chatContainer.classList.remove('active')
    chatButton.style.display = 'block'
    this.isOpen = false
  }

  sendMessage () {
    const chatInput = this.shadow.querySelector('.chat-input')
    const message = chatInput.value.trim()

    if (message === '' || this.isTyping) return

    this.createUserMessage(message)
    chatInput.value = ''

    if (this.escalateToHuman) {
      this.sendMessageToHuman(message)
    } else {
      const contents = this.createAssistantResponseContainer()
      this.createAssistantResponse(message, contents)
    }
  }

  createUserMessage = (newPrompt) => {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const userName = document.createElement('h3')
    const prompt = document.createElement('p')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar')
    messageContainer.classList.add('message')
    messageContainer.classList.add('user')

    avatarContainer.textContent = 'U'
    userName.textContent = 'Tú'
    prompt.textContent = newPrompt

    messageContainer.appendChild(userName)
    messageContainer.appendChild(prompt)
    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)

    chatMessages.appendChild(promptContainer)
    this.scrollToBottom()
  }

  createAssistantResponseContainer = () => {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const modelName = document.createElement('h3')
    const container = document.createElement('div')
    const state = document.createElement('div')
    const stateBubble = document.createElement('div')
    const stateMessage = document.createElement('span')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar')
    avatarContainer.classList.add('assistant')
    messageContainer.classList.add('message')
    messageContainer.classList.add('model')
    container.classList.add('contents')
    state.classList.add('state')
    stateBubble.classList.add('state-bubble')
    stateBubble.classList.add('active')
    stateMessage.classList.add('state-message')

    avatarContainer.textContent = 'A'
    modelName.textContent = 'Asistente'
    stateMessage.textContent = 'Preparando respuesta...'

    container.appendChild(state)
    state.appendChild(stateBubble)
    state.appendChild(stateMessage)
    messageContainer.appendChild(modelName)
    messageContainer.appendChild(container)

    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)

    chatMessages.appendChild(promptContainer)
    this.scrollToBottom()
    return container
  }

  createHumanResponseContainer = () => {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    const promptContainer = document.createElement('div')
    const avatarContainer = document.createElement('div')
    const messageContainer = document.createElement('div')

    const modelName = document.createElement('h3')
    const container = document.createElement('div')

    promptContainer.classList.add('prompt')
    avatarContainer.classList.add('avatar')
    avatarContainer.classList.add('assistant')
    messageContainer.classList.add('message')
    messageContainer.classList.add('model')
    container.classList.add('contents')

    avatarContainer.textContent = 'H'
    modelName.textContent = 'Humano'

    messageContainer.appendChild(modelName)
    messageContainer.appendChild(container)
    promptContainer.appendChild(avatarContainer)
    promptContainer.appendChild(messageContainer)
    chatMessages.appendChild(promptContainer)
    this.scrollToBottom()

    return container
  }

  createAssistantResponse = async (userMessage, container) => {
    this.isTyping = true
    const sendButton = this.shadow.querySelector('.send-button')
    sendButton.disabled = true

    const response = await this.generateResponse(userMessage)

    if (this.escalateToHuman) {
      this.writeNewAnswer('Un humano se va a incorporar a la conversación para resolver tu consulta. Espere un momento...', container, true)
    } else {
      this.writeNewAnswer(response, container, true)
      this.isTyping = false
      sendButton.disabled = false
    }
  }

  sendMessageToHuman = async (message) => {
    try {
      await fetch('/api/customer/chats/human', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, threadId: this.threadId })
      })
    } catch (error) {
      console.error('Error sending message to human:', error)
    }
  }

  writeNewAnswer = async (answer, container, timeInterval) => {
    const state = container.querySelector('.state')

    if (state) {
      state.remove()
    }

    const responseElement = document.createElement('p')
    container.appendChild(responseElement)

    let i = 0
    let text = ''

    if (timeInterval) {
      const interval = setInterval(() => {
        if (i >= answer.length) {
          clearInterval(interval)
          return
        }

        text += answer[i++]
        responseElement.textContent = text
        this.scrollToBottom()
      }, 30)
    } else {
      responseElement.textContent = answer
    }
  }

  async generateResponse (userMessage) {
    const response = await fetch('/api/customer/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: userMessage, threadId: this.threadId })
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const data = await response.json()
    this.threadId = data.threadId
    this.escalateToHuman = data.escalateToHuman

    sessionStorage.setItem('threadId', this.threadId)
    sessionStorage.setItem('escalateToHuman', this.escalateToHuman)

    if (this.socketReady && this.escalateToHuman) {
      this.wsSubscribe(this.threadId)
    }

    return data.answer.text
  }

  scrollToBottom () {
    const chatMessages = this.shadow.querySelector('.chat-messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

customElements.define('chatbot-component', ChatBot)