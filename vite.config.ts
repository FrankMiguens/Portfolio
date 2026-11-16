import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// base: "./" hace que las rutas sean relativas, así el sitio funciona
// tanto en usuario.github.io/nombre-repo/ como en Netlify, Vercel o un dominio propio.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
})
