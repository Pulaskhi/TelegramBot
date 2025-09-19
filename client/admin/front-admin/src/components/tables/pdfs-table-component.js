import { store } from '../../redux/store.js'
import { showFormElement } from '../../redux/crud-slice.js'

class PdfTable extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.endpoint = '/api/admin/pdfs'
    this.filterQuery = null
    this.unsubscribe = null
  }

  async connectedCallback () {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (currentState.crud.filterQuery.query && currentState.crud.filterQuery.endPoint === this.endpoint) {
        this.filterQuery = currentState.crud.filterQuery.query
        const endpoint = `${this.endpoint}?${currentState.crud.filterQuery.query}`
        this.loadData(endpoint).then(() => this.render())
      }

      if (!currentState.crud.filterQuery.query && currentState.crud.tableEndpoint === this.endpoint) {
        this.loadData().then(() => this.render())
      }
    })

    await this.loadData()
    await this.render()
  }

  async loadData (endpoint = this.endpoint) {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`)
      }
      this.data = await response.json()
    } catch (error) {
      console.error('Error loading data:', error)
      this.data = []
    }
  }

  render () {
    this.shadow.innerHTML = /*html*/`
      <style>
        * {
          box-sizing: border-box;
          font-family: "Nunito Sans", serif;
        }

        h1, h2, h3, h4, h5, h6, p {
          margin: 0;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        button {
          background-color: transparent;
          border: none;
          cursor: pointer;
        }

        .table {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-radius: 10px;
        }

        .table__header {
          display: flex;
          justify-content: flex-start;
          background-color: hsl(198, 100%, 85%);
          height: 30px;
          border-radius: 5px;
        }

        .filter-icon,
        .edit-icon,
        .delete-icon,
        .view-pdf-icon {
          width: 30px;
          height: 30px;
          fill: black;
        }

        .table__body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 90%;
          margin: 1rem auto;
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 1rem;
        }

        .pdf-box__data {
          padding: 15px;
          background-color: hsl(200, 77%, 32%);
          border-radius: 0 0 10px 10px;
          color: white;
        }

        .pdf-box__data li {
          margin-top: 5px;
        }

        .pdf-box__upper-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background-color: hsl(198, 100%, 85%);
          border-radius: 10px 10px 0 0;
        }

        .table__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 10px;
          background-color: hsl(198, 100%, 85%);
          border-radius: 5px;
          font-size: 0.95rem;
        }

        .table__footer span {
          color: hsl(0, 0%, 0%);
        }

        .table__footer-left {
          font-weight: 500;
        }

        .table__footer-right .pagination {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pagination {
          align-items: center;
          display: flex;
          gap: 0.5rem;
        }

        .pagination button {
          background-color: transparent;
          border: none;
          cursor: pointer;
          font-size: 2rem;
          padding: 4px 6px;
          border-radius: 5px;
          color: black;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .pagination button.disabled {
          cursor: default;
        }

        .pagination button:hover {
          background-color: rgba(0, 0, 0, 0.1);
          color: #000000cc;
        }

        .pagination button.disabled {
          background-color: transparent;
          color:hsl(0, 0.00%, 26.70%);
        }

        .page-info {
          font-weight: bold;
          font-size: 0.7rem;
        }
      </style>

      <section class="table">
        <div class="table__header">
          <div class="table__header-box">
            <button class="filter-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <title>filter-check</title>
                <path d="M12 12V19.88C12.04 20.18 11.94 20.5 11.71 20.71C11.32 21.1 10.69 21.1 10.3 20.71L8.29 18.7C8.06 18.47 7.96 18.16 8 17.87V12H7.97L2.21 4.62C1.87 4.19 1.95 3.56 2.38 3.22C2.57 3.08 2.78 3 3 3H17C17.22 3 17.43 3.08 17.62 3.22C18.05 3.56 18.13 4.19 17.79 4.62L12.03 12H12M17.75 21L15 18L16.16 16.84L17.75 18.43L21.34 14.84L22.5 16.25L17.75 21" />
              </svg>
            </button>
          </div>
        </div>
        <div class="table__body"></div>
        <div class="table__footer">
          <div class="table__footer-left">
            <span>${this.data.meta.total} registros en total, mostrando ${this.data.meta.size} por página</span>
          </div>
          <div class="table__footer-right">
            <div class="pagination">
              <button class="pagination-button ${this.data.meta.currentPage === 1 ? 'disabled' : ''}" data-page="1">&laquo;</button>
              <button class="pagination-button ${this.data.meta.currentPage === 1 ? 'disabled' : ''}" data-page="${this.data.meta.currentPage > 1 ? this.data.meta.currentPage - 1 : 1}">&lsaquo;</button>
              <span class="page-info">${this.data.meta.currentPage} de ${this.data.meta.pages}</span>
              <button class="pagination-button ${this.data.meta.currentPage === this.data.meta.pages ? 'disabled' : ''}"  data-page="${this.data.meta.currentPage < this.data.meta.pages ? this.data.meta.currentPage + 1 : this.data.meta.currentPage}">&rsaquo;</button>
              <button class="pagination-button ${this.data.meta.currentPage === this.data.meta.pages ? 'disabled' : ''}" data-page="${this.data.meta.pages}">&raquo;</button>
            </div>
          </div>
        </div>
      </section>
    `

    const tableBody = this.shadow.querySelector('.table__body')
    tableBody.innerHTML = ''

    this.data.rows.forEach(element => {
      const pdfBox = document.createElement('div')
      const upperRow = document.createElement('div')
      const viewIcon = document.createElement('a')
      const deleteIcon = document.createElement('button')
      const data = document.createElement('div')
      const ul = document.createElement('ul')

      pdfBox.classList.add('table__body__user-box')
      upperRow.classList.add('pdf-box__upper-row')
      viewIcon.classList.add('view-pdf-icon')
      deleteIcon.classList.add('delete-icon')
      data.classList.add('pdf-box__data')

      viewIcon.href = element.pdfUrl
      viewIcon.target = '_blank'
      deleteIcon.dataset.id = element.id

      viewIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <title>file-pdf-box</title>
          <path d="M19.5,12.5C19.5,12.5 19.5,13.3 18.7,14.5C18.7,14.5 17.6,15.9 17.6,16.5C17.6,17.6 18.2,18.5 19.2,18.5A2.3,2.3 0 0,0 21.5,16.2C21.5,15.5 21.5,14.5 21.5,14.5C21.5,14.5 22.3,13.7 22.3,13C22.3,13 22.8,11.5 20.8,11.5C20.8,11.5 20.1,11.5 19.5,12.5M16,19V5H21V19H16M19,17.5V15.5C19,15.5 19.4,14.9 19.4,14.9C19.4,14.9 19.8,14.3 19.8,14.3C19.8,14.3 19.4,13.7 19.4,13.7C19.4,13.7 19,13.1 19,13.1V11.5H19.5C20.5,11.5 21.5,12.5 21.5,14C21.5,15.5 20.5,16.5 19.5,16.5H19M4,17.5L5,17.5L5,16L4.5,16C4,16 3.5,15.5 3.5,15C3.5,14.5 4,14 4.5,14H5V13.5H3.5L3.5,12.5L5.5,12.5C6,12.5 6.5,13 6.5,13.5C6.5,14 6,14.5 5.5,14.5H5.5L5.5,15C6,15 6.5,15.5 6.5,16C6.5,16.5 6,17 5.5,17H5V17.5H6.5V18.5H3V17.5M8,17.5V11.5H10.5C11.3,11.5 11.5,12 11.5,12.5C11.5,13 11.3,13.5 10.5,13.5H9.5V14.5H11.5C12.3,14.5 12.5,15 12.5,15.5C12.5,16 12.3,16.5 11.5,16.5H9.5V17.5H12.5V18.5H8V17.5M13.5,17.5V11.5H15V12.5H14.5V16.5H15V17.5H13.5" />
        </svg>`
      deleteIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <title>delete</title>
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
        </svg>`

      ul.innerHTML = `
        <li>Nombre: ${element.fileName}</li>
        <li>URL: ${element.pdfUrl}</li>
        <li>Fecha de subida: ${element.createdAt}</li>
        <li>Última modificación: ${element.updatedAt}</li>
      `

      upperRow.append(viewIcon, deleteIcon)
      data.appendChild(ul)
      pdfBox.append(upperRow, data)
      tableBody.appendChild(pdfBox)
    })

    this.renderButtons()
  }

  renderButtons () {
    this.shadow.querySelector('.table').addEventListener('click', async event => {
      const deleteBtn = event.target.closest('.delete-icon')
      const filterBtn = event.target.closest('.filter-icon')

      if (deleteBtn) {
        const id = deleteBtn.dataset.id
        document.dispatchEvent(new CustomEvent('showDeleteModal', {
          detail: { endpoint: this.endpoint, elementId: id }
        }))
      }

      if (filterBtn) {
        document.dispatchEvent(new CustomEvent('showFilterModal', {
          detail: {
            endpoint: this.endpoint
          }
        }))
      }

      const paginationBtn = event.target.closest('.pagination-button')
      if (paginationBtn && !paginationBtn.classList.contains('disabled')) {
        const page = paginationBtn.dataset.page
        let endpoint = `${this.endpoint}?page=${page}`
        if (this.filterQuery) {
          endpoint = `${endpoint}&${this.filterQuery}`
        }
        this.loadData(endpoint).then(() => this.render())
      }
    })
  }
}

customElements.define('pdfs-table-component', PdfTable)