import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src", "resources", "login.html"),
        getstarted: resolve(__dirname, "src", "resources", "login.html"),
        dashboard: resolve(__dirname, "src", "main", "app.html"),
        terms: resolve(__dirname, "src", "resources", "terms.html"),
        'privacy-policy': resolve(__dirname, "src", "resources", "policy.html") 
      }
    }
  }
})