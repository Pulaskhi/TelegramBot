import { store } from '../../redux/store.js';
import { showFormElement } from '../../redux/crud-slice.js';

class FaqTable extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.endpoint = '/api/admin/faqs';
    this.filterQuery = null;
    this.unsubscribe = null;
  }

  async connectedCallback() {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState();

      if (currentState.crud.filterQuery.query && currentState.crud.filterQuery.endPoint === this.endpoint) {
        this.filterQuery = currentState.crud.filterQuery.query;
        const endpoint = `${this.endpoint}?${currentState.crud.filterQuery.query}`;
        this.loadData(endpoint).then(() => this.render());
      }

      if (!currentState.crud.filterQuery.query && currentState.crud.tableEndpoint === this.endpoint) {
        this.loadData().then(() => this.render());
      }
    });

    await this.loadData();
    await this.render();
  }

  async loadData(endpoint = this.endpoint) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = [];
    }
  }

  render() {
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
        .view-pdf-icon,
        .table-page-logo {
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

        .user-box__data {
          padding: 15px;
          background-color: hsl(200, 77%, 32%);
          border-radius: 0 0 10px 10px;
          color: white;
        }

        .user-box__data li {
          margin-top: 5px;
        }

        .user-box__upper-row {
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
          color: hsl(0, 0.00%, 26.70%);
        }

        .page-info {
          font-weight: bold;
          font-size: 0.7rem;
        }

        .pdf-section {
          display: flex;
          align-items: center;
          gap: 10px;
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
              <button class="pagination-button ${this.data.meta.currentPage === this.data.meta.pages ? 'disabled' : ''}" data-page="${this.data.meta.currentPage < this.data.meta.pages ? this.data.meta.currentPage + 1 : this.data.meta.currentPage}">&rsaquo;</button>
              <button class="pagination-button ${this.data.meta.currentPage === this.data.meta.pages ? 'disabled' : ''}" data-page="${this.data.meta.pages}">&raquo;</button>
            </div>
          </div>
        </div>
      </section>
    `;

    const tableBody = this.shadow.querySelector('.table__body');
    tableBody.innerHTML = '';

    this.data.rows.forEach(element => {
      const userBox = document.createElement('div');
      const upperRow = document.createElement('div');
      const editIcon = document.createElement('button');
      const deleteIcon = document.createElement('button');
      const data = document.createElement('div');
      const ul = document.createElement('ul');

      userBox.classList.add('table__body__user-box');
      upperRow.classList.add('user-box__upper-row');
      editIcon.classList.add('edit-icon');
      deleteIcon.classList.add('delete-icon');
      data.classList.add('user-box__data');

      editIcon.dataset.id = element.id;
      deleteIcon.dataset.id = element.id;

      editIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <title>pencil</title>
          <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
        </svg>`;
      deleteIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <title>delete</title>
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
        </svg>`;

      ul.innerHTML = `
        <li>Titulo: ${element.title}</li>
        <li>Descripcion: ${element.description}</li>
        <li>Fecha de creación: ${element.createdAt}</li>
        <li>Fecha de actualización: ${element.updatedAt}</li>
      `;

      // Nuevo: Agregar el campo para el PDF
      const pdfLi = document.createElement('li');
      if (element.pdfUrl) {
        const pdfName = element.pdfUrl.split('/').pop();
        pdfLi.innerHTML = `
          <div class="pdf-section">
            <span>PDF: ${pdfName}</span>
            <a href="${element.pdfUrl}" target="_blank">
              <button class="view-pdf-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>file-pdf-box</title>
                  <path d="M19.5,12.5C19.5,12.5 19.5,13.3 18.7,14.5C18.7,14.5 17.6,15.9 17.6,16.5C17.6,17.6 18.2,18.5 19.2,18.5A2.3,2.3 0 0,0 21.5,16.2C21.5,15.5 21.5,14.5 21.5,14.5C21.5,14.5 22.3,13.7 22.3,13C22.3,13 22.8,11.5 20.8,11.5C20.8,11.5 20.1,11.5 19.5,12.5M16,19V5H21V19H16M19,17.5V15.5C19,15.5 19.4,14.9 19.4,14.9C19.4,14.9 19.8,14.3 19.8,14.3C19.8,14.3 19.4,13.7 19.4,13.7C19.4,13.7 19,13.1 19,13.1V11.5H19.5C20.5,11.5 21.5,12.5 21.5,14C21.5,15.5 20.5,16.5 19.5,16.5H19M4,17.5L5,17.5L5,16L4.5,16C4,16 3.5,15.5 3.5,15C3.5,14.5 4,14 4.5,14H5V13.5H3.5L3.5,12.5L5.5,12.5C6,12.5 6.5,13 6.5,13.5C6.5,14 6,14.5 5.5,14.5H5.5L5.5,15C6,15 6.5,15.5 6.5,16C6.5,16.5 6,17 5.5,17H5V17.5H6.5V18.5H3V17.5M8,17.5V11.5H10.5C11.3,11.5 11.5,12 11.5,12.5C11.5,13 11.3,13.5 10.5,13.5H9.5V14.5H11.5C12.3,14.5 12.5,15 12.5,15.5C12.5,16 12.3,16.5 11.5,16.5H9.5V17.5H12.5V18.5H8V17.5M13.5,17.5V11.5H15V12.5H14.5V16.5H15V17.5H13.5" />
                </svg>
              </button>
            </a>
            <button class="delete-pdf-icon" data-id="${element.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <title>file-remove-outline</title>
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20M12 13C10.61 13 9.4 13.92 9 15.2L10.5 15.63C10.79 14.86 11.34 14.28 12 14.28C12.66 14.28 13.21 14.86 13.5 15.63L15 15.2C14.6 13.92 13.39 13 12 13M12 16.5C10.61 16.5 9.4 17.42 9 18.7L10.5 19.13C10.79 18.36 11.34 17.78 12 17.78C12.66 17.78 13.21 18.36 13.5 19.13L15 18.7C14.6 17.42 13.39 16.5 12 16.5Z" />
              </svg>
            </button>
          </div>
        `;
      } else {
        pdfLi.innerHTML = '<span>PDF: No hay archivo adjunto</span>';
      }

      ul.appendChild(pdfLi);
      upperRow.append(editIcon, deleteIcon);
      data.appendChild(ul);
      userBox.append(upperRow, data);
      tableBody.appendChild(userBox);
    });

    this.renderButtons();
  }

  renderButtons() {
    this.shadow.querySelector('.table').addEventListener('click', async event => {
      const editBtn = event.target.closest('.edit-icon');
      const deleteBtn = event.target.closest('.delete-icon');
      const deletePdfBtn = event.target.closest('.delete-pdf-icon'); // Nuevo
      const filterBtn = event.target.closest('.filter-icon');
      const paginationBtn = event.target.closest('.pagination-button');

      if (editBtn) {
        const id = editBtn.dataset.id;
        try {
          const response = await fetch(`${this.endpoint}/${id}`);
          if (!response.ok) throw response;
          const data = await response.json();
          store.dispatch(showFormElement({ endPoint: this.endpoint, data }));
        } catch {
          document.dispatchEvent(new CustomEvent('notice', {
            detail: { message: 'No se ha podido recuperar el dato', type: 'error' }
          }));
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        document.dispatchEvent(new CustomEvent('showDeleteModal', {
          detail: { endpoint: this.endpoint, elementId: id, pdf: true }
        }));
      }

      // Nuevo: Lógica para eliminar solo el PDF
      if (deletePdfBtn) {
        const id = deletePdfBtn.dataset.id;
        document.dispatchEvent(new CustomEvent('showDeleteModal', {
          detail: { endpoint: `${this.endpoint}/${id}/pdf`, elementId: id, isPdf: true }
        }));
      }

      if (filterBtn) {
        document.dispatchEvent(new CustomEvent('showFilterModal', {
          detail: {
            endpoint: this.endpoint
          }
        }));
      }

      if (paginationBtn && !paginationBtn.classList.contains('disabled')) {
        const page = paginationBtn.dataset.page;
        let endpoint = `${this.endpoint}?page=${page}`;
        if (this.filterQuery) {
          endpoint = `${endpoint}&${this.filterQuery}`;
        }
        this.loadData(endpoint).then(() => this.render());
      }
    });
  }
}

customElements.define('faqs-table-component', FaqTable);
