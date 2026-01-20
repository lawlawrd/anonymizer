import { configureStore } from "@reduxjs/toolkit";

import anonymizerReducer from "./anonymizerStore.js";

export const store = configureStore({
  reducer: {
    anonymizer: anonymizerReducer,
  },
});
