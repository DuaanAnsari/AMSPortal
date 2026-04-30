// vite.config.js
import path from "path";
import { defineConfig } from "file:///D:/Owais/AMSPortal/vite-js/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Owais/AMSPortal/vite-js/node_modules/@vitejs/plugin-react-swc/index.mjs";
var vite_config_default = defineConfig({
  // `.env` is under `src/` — Vite default is repo root; without this, live build misses VITE_* vars
  envDir: path.join(process.cwd(), "src"),
  /** Expose `REACT_APP_API_BASE_URL` and `VITE_API_BASE_URL` to the client bundle. */
  envPrefix: ["VITE_", "REACT_APP_"],
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), "node_modules/$1")
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), "src/$1")
      }
    ]
  },
  server: {
    port: 3030,
    proxy: {
      "/api": {
        target: "http://192.168.18.13",
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3030
    // build ke baad bhi isi port pe chalega
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPd2Fpc1xcXFxBTVNQb3J0YWxcXFxcdml0ZS1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcT3dhaXNcXFxcQU1TUG9ydGFsXFxcXHZpdGUtanNcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L093YWlzL0FNU1BvcnRhbC92aXRlLWpzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIC8vIGAuZW52YCBpcyB1bmRlciBgc3JjL2AgXHUyMDE0IFZpdGUgZGVmYXVsdCBpcyByZXBvIHJvb3Q7IHdpdGhvdXQgdGhpcywgbGl2ZSBidWlsZCBtaXNzZXMgVklURV8qIHZhcnNcbiAgZW52RGlyOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYycpLFxuICAvKiogRXhwb3NlIGBSRUFDVF9BUFBfQVBJX0JBU0VfVVJMYCBhbmQgYFZJVEVfQVBJX0JBU0VfVVJMYCB0byB0aGUgY2xpZW50IGJ1bmRsZS4gKi9cbiAgZW52UHJlZml4OiBbJ1ZJVEVfJywgJ1JFQUNUX0FQUF8nXSxcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IFtcbiAgICAgIHtcbiAgICAgICAgZmluZDogL15+KC4rKS8sXG4gICAgICAgIHJlcGxhY2VtZW50OiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ25vZGVfbW9kdWxlcy8kMScpLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmluZDogL15zcmMoLispLyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnc3JjLyQxJyksXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMzAsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTkyLjE2OC4xOC4xMycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDMwMzAsIC8vIGJ1aWxkIGtlIGJhYWQgYmhpIGlzaSBwb3J0IHBlIGNoYWxlZ2FcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3USxPQUFPLFVBQVU7QUFDelIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBSWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUIsUUFBUSxLQUFLLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSztBQUFBO0FBQUEsRUFFdEMsV0FBVyxDQUFDLFNBQVMsWUFBWTtBQUFBLEVBQ2pDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sYUFBYSxLQUFLLEtBQUssUUFBUSxJQUFJLEdBQUcsaUJBQWlCO0FBQUEsTUFDekQ7QUFBQSxNQUNBO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssS0FBSyxRQUFRLElBQUksR0FBRyxRQUFRO0FBQUEsTUFDaEQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
