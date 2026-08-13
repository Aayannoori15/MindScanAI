import { configureStore } from "@reduxjs/toolkit";
import assessment from "./assessmentSlice";
import session from "./sessionSlice";

export const store = configureStore({
  reducer: { assessment, session },
  middleware: (g) => g({ serializableCheck: false }),
});
