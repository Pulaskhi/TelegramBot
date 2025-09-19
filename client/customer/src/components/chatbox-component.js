class ChatBoxComponent extends HTMLElement {
    constructor() {
      super()
      this.shadow = this.attachShadow({ mode: 'open' })
      this.isOpen = false
      this.messages = []
    }
  
    connectedCallback() {
      this.render()
      this.addEvents()
      this.loadMessages()
    }
  
    addEvents() {
      const toggleBtn = this.shadow.querySelector('.chatbox-toggle')
      const sendBtn = this.shadow.querySelector('.send-btn')
      const input = this.shadow.querySelector('.chatbox-input input')
  
      toggleBtn.addEventListener('click', () => {
        this.isOpen = !this.isOpen
        this.updateState()
      })
  
      sendBtn.addEventListener('click', () => this.sendMessage())
  
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.sendMessage()
        }
      })
    }
  
    updateState() {
      const chatbox = this.shadow.querySelector('.chatbox')
      if (this.isOpen) {
        chatbox.classList.add('open')
      } else {
        chatbox.classList.remove('open')
      }
    }
  
    sendMessage() {
      const input = this.shadow.querySelector('.chatbox-input input')
      const text = input.value.trim()
      if (!text) return
  
      this.addMessage('user', text)
      input.value = ''
      this.fakeBotReply()
    }
  
    addMessage(type, text) {
      const messages = this.shadow.querySelector('.chatbox-messages')
      const msg = document.createElement('div')
      msg.className = `message ${type}`
      msg.textContent = text
      messages.appendChild(msg)
      messages.scrollTop = messages.scrollHeight
      this.messages.push({ type, text })
      localStorage.setItem('chatbox-messages', JSON.stringify(this.messages))
    }
  
    loadMessages() {
      const saved = JSON.parse(localStorage.getItem('chatbox-messages') || '[]')
      this.messages = saved
      const messagesDiv = this.shadow.querySelector('.chatbox-messages')
      saved.forEach(m => {
        const msg = document.createElement('div')
        msg.className = `message ${m.type}`
        msg.textContent = m.text
        messagesDiv.appendChild(msg)
      })
      messagesDiv.scrollTop = messagesDiv.scrollHeight
    }
  
    fakeBotReply() {
      setTimeout(() => {s
        const responses = [
          "🔥 ¡Aquí falta pes!",
          "💪 Los cascoooos",
          "🚒 Me falta cafe",
          "🙂 me encanta correr"
        ]
        const reply = responses[Math.floor(Math.random() * responses.length)]
        this.addMessage('bot', reply)
      }, 1000)
    }
  
    render() {
      this.shadow.innerHTML = /* html */`
        <style>
          * { box-sizing: border-box; font-family: 'Nunito Sans', sans-serif; }
  
          .chatbox-container {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            font-size: 14px;
          }
  
          .chatbox-toggle {
            background: linear-gradient(135deg, #ff2a2a, #ff7a00);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            font-size: 1.8rem;
            height: 4rem;
            width: 4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            transition: transform 0.2s ease-in-out;
          }
          .chatbox-toggle:hover { transform: scale(1.1); }
  
          .chatbox {
            width: 320px;
            max-height: 450px;
            background: #1a1a1a;
            border-radius: 1.5rem;
            box-shadow: 0 8px 30px rgba(255,69,0,0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            margin-bottom: 1rem;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
          }
          .chatbox.open { opacity: 1; transform: translateY(0); }
  
          .chatbox-header {
            background: linear-gradient(135deg, #ff2a2a, #ff7a00);
            color: white;
            font-weight: 700;
            padding: 1rem;
            text-align: center;
            letter-spacing: 0.5px;
            font-size: 1rem;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
          }
  
          .chatbox-messages {
            flex: 1;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            overflow-y: auto;
            background: #2a2a2a;
          }
  
          .message {
            max-width: 80%;
            padding: 0.6rem 1rem;
            border-radius: 1rem;
            word-wrap: break-word;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease;
          }
          .message.user {
            align-self: flex-end;
            background: #ff2a2a;
            color: white;
            border-bottom-right-radius: 0.2rem;
            box-shadow: 0 2px 10px rgba(255,0,0,0.6);
          }
          .message.bot {
            align-self: flex-start;
            background: #ffcc00;
            color: #1a1a1a;
            border-bottom-left-radius: 0.2rem;
            box-shadow: 0 2px 10px rgba(255,153,0,0.6);
          }
  
          @keyframes fadeIn { from { opacity:0; transform: translateY(5px);} to { opacity:1; transform: translateY(0);} }
  
          .chatbox-input {
            display: flex;
            border-top: 1px solid #444;
            padding: 0.5rem;
            background: #333;
          }
          .chatbox-input input {
            flex: 1;
            border: none;
            border-radius: 1rem;
            padding: 0.6rem 1rem;
            outline: none;
            font-size: 0.9rem;
            background: #222;
            color: #fff;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
          }
          .chatbox-input input:focus { box-shadow: 0 0 0 2px #ff2a2a; }
  
          .chatbox-input button {
            background: #ff4500;
            border: none;
            color: white;
            margin-left: 0.5rem;
            padding: 0 1rem;
            border-radius: 1rem;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          .chatbox-input button:hover { background: #ff2a2a; }
        </style>
  
        <div class="chatbox-container">
          <div class="chatbox">
            <div class="chatbox-header">Chat Bombero 🔥</div>
            <div class="chatbox-messages"></div>
            <div class="chatbox-input">
              <input type="text" placeholder="Escribe un mensaje..." />
              <button class="send-btn">➤</button>
            </div>
          </div>
          <button class="chatbox-toggle">💬</button>
        </div>
      `
    }
  }
  
  customElements.define('chatbox-component', ChatBoxComponent)