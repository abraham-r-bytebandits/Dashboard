import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import workReducer from './workSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    work: workReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
