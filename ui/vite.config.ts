import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,

    // @ts-expect-error for some reason, TypeScript thinks host MUST be an object
    https: true,
  },
});
