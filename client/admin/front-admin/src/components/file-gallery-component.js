import { store } from '../redux/store.js'
import { showFile, removeFile } from '../redux/files-slice.js'

class FileGallery extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.fileType = ''
  }

  connectedCallback () {
    document.addEventListener('openFileGallery', this.handleOpenGallery.bind(this))
  }

  async handleOpenGallery (event) {
    this.fileType = store.getState().files.fileGallery.fileType
    this.entity = store.getState().files.fileGallery.name
    await this.render()
    await this.getThumbnails()
    this.openGallery()
  }

  async render () {
    this.shadow.innerHTML =
      /* html */`
        <style>
          .overlayer {
            align-items: center;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            height: 100vh;
            justify-content: center;
            left: 0;
            opacity: 0;
            position: fixed;
            top: 0;
            transition: opacity 0.3s;
            visibility: hidden;
            width: 100%;
            z-index: -1;
          }

          .overlayer.active {
            opacity: 1;
            visibility: visible;
            z-index: 5000;
          }

          .modal {
            height: 80%;
            position: absolute;
            width: 80%;
          }

          .modal-content {
            background-color: white;
            border: 1px solid #888;
            border-radius: 5px;
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            position: relative;
            width: 100%;
          }

          .modal-header {
            align-items: center;
            display: flex;
            height: 5%;
            justify-content: space-between;
            padding: 1%;
            width: 98%;
          }

          .modal-header h2 {
            font-family: 'Lato', sans-serif;
            margin: 0;
          }

          .modal-header .close {
            color: hsl(0, 0%, 40%);
            float: right;
            font-size: 2rem;
            font-weight: bold;
          }

          .modal-header .close:hover,
          .modal-header .close:focus {
            color: hsl(0, 0%, 20%);
            text-decoration: none;
            cursor: pointer;
          }

          .modal-body {
            border-bottom: 1px solid hsl(0, 0%, 90%);
            border-top: 1px solid hsl(0, 0%, 90%);
            display: flex;
            height: 85%;
          }

          .file-gallery {
            align-content: flex-start;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            height: 96%;
            overflow: scroll;
            overscroll-behavior-y: contain;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 1%;
            width: 80%;
          }

          .file-gallery-loader {
            background-color: hsl(0, 0%, 90%);
            border-left: 1px solid hsl(0, 0%, 80%);
            height: 100%;
            overflow: scroll;
            overscroll-behavior-y: contain;
            overflow-y: auto;
            overflow-x: hidden;
            width: 20%;
          }

          .upload-file {
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box;
            cursor: pointer;
            height: 135px;
            margin: 5px;
            overflow: hidden;
            padding: 5px;
            position: relative;
            width: 135px;
          }

          .upload-file input[type="file"] {
            display: none;
          }

          .upload-file label {
            align-items: center;  
            background-color: hsl(207, 85%, 69%);
            border: none;
            box-sizing: border-box;
            color: white;
            cursor: pointer;
            display: flex;
            font-family: 'Lato', sans-serif;
            font-size: 16px;
            height: 100%;
            justify-content: center;
            text-align: center;
            text-decoration: none;
            transition-duration: 0.4s;
            width: 100%;
          }

          .upload-file label:hover {
            filter: brightness(1.2);
          }

          .upload-file label svg {
            fill: white;
            height: 4em;
            width: 4rem;
          }

          .file-gallery .file {
            background-color: hsl(207, 85%, 69%);
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            height: 135px;
            margin: 5px;
            overflow: hidden;
            padding: 5px;
            position: relative;
            width: 135px;
          }

          .file-gallery .file:hover {
            border: 1px solid #aaa;
          }

          .file-gallery .file span {
            color: white;
            font-family: 'Lato', sans-serif;
            font-size: 1rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .file-gallery .file.selected {
            border: 0.2rem solid #4CAF50;
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

          .file:hover .delete-button {
            opacity: 1;
          }

          .delete-button:hover {
            background-color: hsl(0, 100%, 30%);
          }

          .file-gallery-information{
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 1.5rem 1rem;
          }

          .file-gallery-loader-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
          }

          .file-gallery-loader-form label {
            color: hsl(0, 0%, 40%);
            font-family: 'Lato', sans-serif;
          }   

          .file-gallery-loader-form input {
            border: none;
            border-bottom: 1px solid hsl(0, 0%, 80%);
            box-sizing: border-box;
            font-family: 'Lato', sans-serif;
            height: 2rem;
            outline: none;  
            padding: 0.5rem;
            width: 100%;
          }

          .modal-footer {
            align-items: center;
            display: flex;
            justify-content: flex-end;
            padding: 1rem;
          }

          .modal-footer button {
            background-color: hsl(0, 0%, 90%);
            border: none;
            border-radius: 5px;
            color: white;
            font-size: 16px;
            padding: 12px 24px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            transition-duration: 0.4s;
          }

          .modal-footer button.active {
            background-color: hsl(236 55% 25%);
            cursor: pointer;
          }

          .modal-footer button.active:hover {
            background-color: hsl(272 40% 35%);
          }
        </style>

        <div class="overlayer">
          <div class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h2>Galería</h2>
                <span class="close">&times;</span>
              </div>
              <div class="modal-body">
                <div class="file-gallery"></div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-primary">Elegir archivo</button>
              </div>
            </div>
          </div>
        </div>
      `

    this.shadow.querySelector('.overlayer').addEventListener('click', (event) => {
      if (event.target.closest('.close')) {
        this.closeGallery()
      }

      if (event.target.closest('.file')) {
        this.selectfile(event.target.closest('.file'))
      }

      if (event.target.closest('.modal-footer button')) {
        if (event.target.classList.contains('active')) {
          this.createThumbnail()
        }
      }

      if (event.target.closest('.delete-button')) {
        this.deletefile(event.target.closest('.file').dataset.filename)
      }
    })
  }

  async openGallery () {
    const file = store.getState().files.fileGallery

    this.shadow.querySelector('.overlayer').classList.add('active')
    const fileElement = this.shadow.querySelector(`.file[data-filename="${file.filename}"]`)

    if (fileElement) {
      fileElement.classList.add('selected')
      this.shadow.querySelector('.modal-footer button').classList.add('active')
    }
  }

  async getThumbnails () {
    try {
      const fileGallery = this.shadow.querySelector('.file-gallery')
      fileGallery.innerHTML = ''
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/files?fileType=${this.fileType}`)
      const data = await result.json()
      const files = data.rows

      const uploadfile = document.createElement('div')
      const label = document.createElement('label')
      const input = document.createElement('input')

      uploadfile.classList.add('upload-file')
      label.setAttribute('for', 'file')
      input.setAttribute('type', 'file')
      input.setAttribute('id', 'file')
      input.setAttribute('name', 'file')
      input.setAttribute('accept', 'file/*')

      input.addEventListener('change', (event) => {
        this.uploadfile(event.target.files[0])
      })

      label.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" /></svg>'

      uploadfile.appendChild(label)
      uploadfile.appendChild(input)

      fileGallery.appendChild(uploadfile)

      files.forEach(file => {
        const fileContainer = document.createElement('div')
        const span = document.createElement('span')

        fileContainer.classList.add('file')
        fileContainer.setAttribute('data-filename', file.filename)
        span.textContent = file.filename

        const deleteButton = document.createElement('button')
        deleteButton.classList.add('delete-button')
        deleteButton.innerHTML = 'X'

        fileContainer.appendChild(deleteButton)
        fileContainer.appendChild(span)
        fileGallery.appendChild(fileContainer)
      })
    } catch (e) {
      console.log(e)
    }
  }

  async uploadfile (file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', this.fileType)
    formData.append('entity', this.entity)

    const result = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/files`, {
      method: 'POST',
      body: formData
    })

    const filenames = await result.json()

    this.shadow.querySelectorAll('.file').forEach((item) => {
      item.classList.remove('selected')
    })

    filenames.forEach(filename => {
      const fileContainer = document.createElement('div')
      const span = document.createElement('span')

      fileContainer.classList.add('file', 'selected')
      fileContainer.setAttribute('data-filename', filename)
      span.textContent = filename

      const deleteButton = document.createElement('button')
      deleteButton.classList.add('delete-button')
      deleteButton.innerHTML = 'X'

      fileContainer.appendChild(deleteButton)
      fileContainer.appendChild(span)

      const uploadfile = this.shadow.querySelector('.upload-file')
      uploadfile.insertAdjacentElement('afterend', fileContainer)
    })

    this.shadow.querySelector('.modal-footer button').classList.add('active')
  }

  async selectfile (file) {
    this.shadow.querySelectorAll('.file').forEach(item => {
      item.classList.remove('selected')
    })

    file.classList.add('selected')

    this.shadow.querySelector('.modal-footer button').classList.add('active')
  }

  async deletefile (filename) {
    const result = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/files/${filename}?fileType=${this.fileType}`, {
      method: 'DELETE'
    })

    if (result.status === 200) {
      this.shadow.querySelector(`.file[data-filename="${filename}"`).remove()
      this.shadow.querySelector('.modal-footer button').classList.remove('active')

      if (store.getState().files.fileGallery.filename === filename) {
        store.dispatch(removeFile(store.getState().files.fileGallery))
      }
    }
  }

  async createThumbnail () {
    let file = store.getState().files.fileGallery
    const filename = this.shadow.querySelector('.file.selected').getAttribute('data-filename')
    file = { ...file, filename }

    store.dispatch(showFile(file))
    this.closeGallery()
  }

  async closeGallery () {
    this.shadow.querySelector('.modal-footer button').classList.remove('active')

    this.shadow.querySelectorAll('.file').forEach(item => {
      item.classList.remove('selected')
    })

    this.shadow.querySelector('.overlayer').classList.remove('active')
  }
}

customElements.define('file-gallery-component', FileGallery)