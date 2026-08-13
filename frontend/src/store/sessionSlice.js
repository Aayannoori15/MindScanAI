import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "session",
  initialState: { token: localStorage.getItem("ms_token") || "", history: [], trends: null },
  reducers: {
    setToken: (s, a) => {
      s.token = a.payload;
      if (a.payload) localStorage.setItem("ms_token", a.payload);
      else localStorage.removeItem("ms_token");
    },
    setHistory: (s, a) => {
      s.history = a.payload.sessions || [];
      s.trends = a.payload.trends || null;
    },
  },
});

export const { setToken, setHistory } = slice.actions;
export default slice.reducer;
