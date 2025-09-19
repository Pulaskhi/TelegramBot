import { createSlice } from '@reduxjs/toolkit'

export const filesSlice = createSlice({
  name: 'files',
  initialState: {
    fileGallery: null,
    showedFiles: [],
    selectedFiles: []
  },
  reducers: {
    setFileGallery: (state, action) => {
      state.fileGallery = action.payload
    },
    showFile: (state, action) => {
      state.showedFiles.push(action.payload)
    },
    showFiles: (state, action) => {
      state.showedFiles = action.payload
    },
    addFile: (state, action) => {
      if (!state.selectedFiles.some(file =>
        file.name === action.payload.name &&
        file.languageAlias === action.payload.languageAlias &&
        file.filename === action.payload.filename)) {
        state.selectedFiles.push(action.payload)
      }
    },
    removeFile: (state, action) => {
      const selectedFile = state.selectedFiles.findIndex(file =>
        file.filename === action.payload.filename &&
        file.languageAlias === action.payload.languageAlias &&
        file.name === action.payload.name
      )

      if (selectedFile !== -1) {
        state.selectedFiles.splice(selectedFile, 1)
      }

      const showedFile = state.showedFiles.findIndex(file =>
        file.filename === action.payload.filename &&
        file.languageAlias === action.payload.languageAlias &&
        file.name === action.payload.name
      )

      if (showedFile !== -1) {
        state.showedFiles.splice(showedFile, 1)
      }
    },
    removeFiles: (state, action) => {
      state.selectedFiles = []
      state.showedFiles = []
    }
  }
})

export const { setFileGallery, showFile, showFiles, addFile, removeFile, removeFiles } = filesSlice.actions

export default filesSlice.reducer