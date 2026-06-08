import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  server: {
    port: 5175
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing dependencies into a separate vendor
        // chunk so the browser can cache them independently of app code.
        manualChunks: {
          react: ["react", "react-dom"],
          icons: ["lucide-react"]
        }
      }
    }
  }
});
