import { createSlice } from '@reduxjs/toolkit'

export const crudSlice = createSlice({
  name: 'crud',
  initialState: {
    formElement: {
      endPoint: null,
      data: null
    },
    filterQuery: {
      endPoint: null,
      query: null
    },
    tableEndpoint: null
  },
  reducers: {
    showFormElement: (state, action) => {
      state.formElement = action.payload
    },
    refreshTable: (state, action) => {
      state.tableEndpoint = action.payload
    },
    setFilterQuery: (state, action) => {
      state.filterQuery = action.payload
    }
  }
})

export const {
  showFormElement,
  refreshTable,
  setFilterQuery
} = crudSlice.actions

export default crudSlice.reducer