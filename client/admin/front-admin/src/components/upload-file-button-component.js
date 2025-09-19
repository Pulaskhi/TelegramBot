import isEqual from 'lodash-es/isEqual'
import { store } from '../redux/store.js'
import { setFileGallery, addFile, removeFile } from '../redux/files-slice.js'

class UploadFileButton extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.unsubscribe = null
    this.files = []
    this.fileType = null
    this.icons = {
      documents: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6M18 12H16V14H18V16H16V18H14V16H16V14H14V12H16V10H14V8H16V10H18V12Z" />
        </svg>
      `,
      scripts: `
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M3,3H21V21H3V3M7.73,18.04C8.13,18.89 8.92,19.59 10.27,19.59C11.77,19.59 12.8,18.79 12.8,17.04V11.26H11.1V17C11.1,17.86 10.75,18.08 10.2,18.08C9.62,18.08 9.38,17.68 9.11,17.21L7.73,18.04M13.71,17.86C14.21,18.84 15.22,19.59 16.8,19.59C18.4,19.59 19.6,18.76 19.6,17.23C19.6,15.82 18.79,15.19 17.35,14.57L16.93,14.39C16.2,14.08 15.89,13.87 15.89,13.37C15.89,12.96 16.2,12.64 16.7,12.64C17.18,12.64 17.5,12.85 17.79,13.37L19.1,12.5C18.55,11.54 17.77,11.17 16.7,11.17C15.19,11.17 14.22,12.13 14.22,13.4C14.22,14.78 15.03,15.43 16.25,15.95L16.67,16.13C17.45,16.47 17.91,16.68 17.91,17.26C17.91,17.74 17.46,18.09 16.76,18.09C15.93,18.09 15.45,17.66 15.09,17.06L13.71,17.86Z" />
        </svg>
      `
    }
  }

  connectedCallback () {
    this.name = this.getAttribute('name')
    this.languageAlias = this.getAttribute('language-alias')
    this.quantity = this.getAttribute('quantity')
    this.fileType = this.getAttribute('file-type')

    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (currentState.files.showedFiles.length > 0 && !isEqual(this.files, currentState.files.showedFiles)) {
        this.files = currentState.files.showedFiles
        this.showThumbnails(this.files)
      }

      if (currentState.files.showedFiles.length === 0) {
        this.deleteThumbnails()
      }
    })

    this.render()
  }

  disconnectedCallback () {
    this.unsubscribe && this.unsubscribe()
  }

  render () {
    this.shadow.innerHTML =
      /* html */`
      <style>
        * {
          box-sizing: border-box;
        }

        .square-button {
          border: none;
          background-color: hsl(207, 85%, 69%);
          color: hsl(0, 0%, 100%);
          cursor: pointer;
          display: inline-block;
          font-size: 16px;
          height: 135px;
          text-align: center;
          width: 135px;
          z-index: 2000;
        }

        .square-button:hover {
          cursor: pointer;
          filter: brightness(1.2);
        }
      
        .square-button svg {
          fill: white;
          height: 4em;
          width: 4rem;
        }

        .upload-file-container {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: left;
          position: relative;
        }

        .upload-file{
          background-color: hsl(207, 85%, 69%);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 135px;
          justify-content: flex-end;
          padding: 0.5rem;
          position: relative;
          width: 135px;
        }

        .upload-file.single {
          position: absolute;
          z-index: 2001;
        }

        .upload-file span {
          color: white;
          font-family: 'Lato', sans-serif;
          font-size: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .upload-file-overlay {
          align-items: center;
          background-color: hsla(0, 0%, 0%, 0.5);
          height: 100%;
          display: flex;
          justify-content: center;
          left: 0;
          opacity: 0;
          position: absolute;
          top: 0;
          transition: opacity 0.3s ease;
          width: 100%;
          z-index: 2000;
        }

        .upload-file:hover .upload-file-overlay {
          opacity: 1;
        }

        .delete-button {
          background-color: hsl(0, 100%, 50%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          font-size: 12px;
          height: 20px;
          opacity: 0;
          position: absolute;
          right: 0.2rem;
          top: 0.2rem;
          transition: opacity 0.3s ease;
          width: 20px;
          z-index: 2001;
        }

        .upload-file:hover .delete-button {
          opacity: 1;
        }

        .delete-button:hover {
          background-color: hsl(0, 100%, 30%);
        }
      </style>

      <div class="upload-file-container">
        <button class="square-button"></button>
      </div>
    `

    this.shadow.querySelector('.square-button').innerHTML = this.icons[this.getAttribute('icon')]
    const uploadfileContainer = this.shadow.querySelector('.upload-file-container')

    uploadfileContainer.addEventListener('click', event => {
      if (event.target.closest('.square-button')) {
        const file = {
          name: this.getAttribute('name'),
          languageAlias: this.languageAlias,
          fileType: this.fileType
        }

        store.dispatch(setFileGallery(file))
        document.dispatchEvent(new CustomEvent('openFileGallery'))
      }
    })
  }

  async createThumbnail (file) {
    const uploadfileContainer = this.shadow.querySelector('.upload-file-container')

    if (this.shadow.querySelector(`.upload-file[data-filename="${file.filename}"]`)) {
      return
    }

    const fileContainer = document.createElement('div')
    fileContainer.classList.add('upload-file')
    fileContainer.dataset.filename = file.filename

    if (this.quantity === 'single') {
      fileContainer.classList.add('single')
    }

    const span = document.createElement('span')
    span.textContent = file.filename

    const deleteButton = document.createElement('button')
    deleteButton.classList.add('delete-button')
    deleteButton.innerHTML = 'X'

    fileContainer.appendChild(deleteButton)
    fileContainer.appendChild(span)
    uploadfileContainer.appendChild(fileContainer)

    uploadfileContainer.addEventListener('click', (event) => {
      file = { ...file, filename: fileContainer.dataset.filename }
      store.dispatch(setFileGallery(file))
      document.dispatchEvent(new CustomEvent('openFileGallery'))
    })

    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation()
      deleteButton.parentElement.remove()
      store.dispatch(removeFile(file))

      if (this.getAttribute('quantity') === 'single') {
        const uploadFileContainer = this.shadow.querySelector('.upload-file-container')
        uploadFileContainer.innerHTML = ''
        const squareButton = document.createElement('button')
        squareButton.classList.add('square-button')
        uploadFileContainer.appendChild(squareButton)
        squareButton.innerHTML = this.icons[this.getAttribute('icon')]
      }
    })
  }

  async showThumbnails (files) {
    this.shadow.querySelectorAll('.upload-file').forEach(file => {
      file.remove()
    })

    files.forEach(file => {
      if (file.name === this.name && file.languageAlias === this.languageAlias) {
        file = { ...file, quantity: this.quantity, fileType: this.fileType }
        store.dispatch(addFile(file))
        this.createThumbnail(file)
      }
    })
  }

  async deleteThumbnails () {
    this.shadow.querySelectorAll('.upload-file').forEach(file => {
      file.remove()
    })
  }
}

customElements.define('upload-file-button-component', UploadFileButton)