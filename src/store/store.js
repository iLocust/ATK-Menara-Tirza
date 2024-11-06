import { configureStore } from '@reduxjs/toolkit';
import atkReducer from '../features/atk/atkSlice';

export const store = configureStore({
  reducer: {
    atk: atkReducer,
  },
});