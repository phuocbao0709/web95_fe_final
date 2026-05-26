import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/teachers": "http://localhost:3003",
      "/teacher-positions": "http://localhost:3003",
      "/user": "http://localhost:3003",
    },
  },
});
