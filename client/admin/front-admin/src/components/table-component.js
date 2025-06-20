class Table extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  async connectedCallback () {
    await this.loadData()
    await this.render()
  }

  async loadData () {
    try {
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`)
      }

      this.data = await response.json()

      console.log(this.data)
    } catch (error) {
      console.error('Error loading data:', error)
      this.data = []
    }
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

      h1, h2, h3, h4, h5, h6, p{
        margin: 0;
      }

      h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button{
        font-family: "Nunito Sans", serif;
        font-optical-sizing: auto;
      }

      ul{
        list-style-type: none;
        margin: 0;
        padding: 0;
      }

      li{
      }

      button{
        background-color: transparent;
        border: none;
        cursor: pointer;
        outline: none;
        padding: 0;
      }


      .table {
        display:flex;
        flex-direction: column;
        flex: 1;
        gap: 10px;
        border-radius: 10px;
      }

      .table__header {
        display: flex;
        justify-content: flex-start; /* Icono alineado a la izquierda */
        background-color: hsl(198, 100%, 85%);
        height: 30px;
        border-radius: 5px;
      }

      .table__header-icon{
        margin-left: 5px;
      }

      .table__header-icon ,
      .edit-icon ,
      .delete-icon ,
      .clean-icon,
      .save-icon,
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
        max-height: 63vh;
        overflow-y: auto;
        padding-right: 1rem;
      }



      .table__body__user-box {
        color: white;

      }

      .user-box__data {
        padding: 15px;
        background-color: hsl(200, 77%, 32%);
        border-radius: 0 0 10px 10px;
      }



      .user-box__data li {
        margin-top: 5px; 
      }

      .user-box__upper-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        background-color: hsl(198, 100%, 85%);
        border-radius: 10px 10px 0 0;
      }



      /* Footer de la tabla */
      .table__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;
        background-color: hsl(198, 100%, 85%);
        border-radius: 5px;
      }

      .table__footer-box {
        display: flex;
        width: 100%;
        justify-content: space-between;
        align-items: center;
      }

      .table-page-info {
        text-align: left;
        color: rgb(0, 0, 0);

      }

      .table-page-logo svg {
        width: 30px;
        height: 30px;
        fill: rgb(0, 0, 0);
      }


  

   
    </style>

    <section class="table">
      <div class="table__header">
        <div class="table__header-box">
          <button class="table__header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <title>filter-check</title>
              <path
                d="M12 12V19.88C12.04 20.18 11.94 20.5 11.71 20.71C11.32 21.1 10.69 21.1 10.3 20.71L8.29 18.7C8.06 18.47 7.96 18.16 8 17.87V12H7.97L2.21 4.62C1.87 4.19 1.95 3.56 2.38 3.22C2.57 3.08 2.78 3 3 3H17C17.22 3 17.43 3.08 17.62 3.22C18.05 3.56 18.13 4.19 17.79 4.62L12.03 12H12M17.75 21L15 18L16.16 16.84L17.75 18.43L21.34 14.84L22.5 16.25L17.75 21" />
            </svg>
        </button>
        </div>
      </div>
      <div class="table__body"></div>
      <div class="table__footer">
        <div class="table__footer-box">
          <div class="table-page-info">1 registro en total, mostrando 10 por página</div>
          <button class="table-page-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <title>chevron-double-left</title>
              <path
                d="M18.41,7.41L17,6L11,12L17,18L18.41,16.59L13.83,12L18.41,7.41M12.41,7.41L11,6L5,12L11,18L12.41,16.59L7.83,12L12.41,7.41Z" />
            </svg>
        </button>
        </div>
      </div>
    </section>
    
    `

    this.data.rows.forEach(element => {
      const tableBody = this.shadow.querySelector('.table__body')
      const userBox = document.createElement('div')
      userBox.classList.add('.table__body__user-box')
      tableBody.appendChild(userBox)

      const upperRow = document.createElement('div')
      upperRow.classList.add('user-box__upper-row')
      userBox.appendChild(upperRow)

      const editIcon = document.createElement('button')
      editIcon.classList.add('edit-icon')
      editIcon.dataset.id = element.id
      upperRow.appendChild(editIcon)
      editIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <title>pencil</title>
                <path
                  d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
              </svg>`
      const deleteIcon = document.createElement('button')
      deleteIcon.classList.add('delete-icon')
      deleteIcon.dataset.id = element.id
      upperRow.appendChild(deleteIcon)
      deleteIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <title>delete</title>
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
              </svg>`

      const data = document.createElement('div')
      data.classList.add('user-box__data')
      userBox.appendChild(data)

      const ul = document.createElement('ul')
      data.appendChild(ul)

      const name = document.createElement('li')
      ul.appendChild(name)
      name.textContent = `Nombre: ${element.name}`

      const email = document.createElement('li')
      ul.appendChild(email)
      email.textContent = `Email: ${element.email}`

      const createdAt = document.createElement('li')
      ul.appendChild(createdAt)
      createdAt.textContent = `Fecha de creación: ${element.createdAt}`

      const uptatedAt = document.createElement('li')
      ul.appendChild(uptatedAt)
      uptatedAt.textContent = `Fecha de actualización: ${element.updatedAt}`
    })
    
  }
  
}

customElements.define('table-component', Table)
