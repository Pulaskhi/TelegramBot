import { configureStore } from '@reduxjs/toolkit'
import crudReducer from './crud-slice'
import filesReducer from './files-slice'

export const store = configureStore({
  reducer: {
    crud: crudReducer,
    files: filesReducer
  }
})

export default store