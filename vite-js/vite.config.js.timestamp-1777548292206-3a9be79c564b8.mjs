// vite.config.js
import path from "path";
import { defineConfig, loadEnv } from "file:///D:/Rafay/AMSPortal/vite-js/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Rafay/AMSPortal/vite-js/node_modules/@vitejs/plugin-react-swc/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
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
          target: env.VITE_API_BASE_URL || "http://localhost:7024",
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      port: 3030
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxSYWZheVxcXFxBTVNQb3J0YWxcXFxcdml0ZS1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcUmFmYXlcXFxcQU1TUG9ydGFsXFxcXHZpdGUtanNcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1JhZmF5L0FNU1BvcnRhbC92aXRlLWpzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCkpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6IC9efiguKykvLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnbm9kZV9tb2R1bGVzLyQxJyksXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXnNyYyguKykvLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnc3JjLyQxJyksXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogMzAzMCxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQVBJX0JBU0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjcwMjQnLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHByZXZpZXc6IHtcclxuICAgICAgcG9ydDogMzAzMCxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1EsT0FBTyxVQUFVO0FBQ3pSLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUlsQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBRXZDLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYSxLQUFLLEtBQUssUUFBUSxJQUFJLEdBQUcsaUJBQWlCO0FBQUEsUUFDekQ7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhLEtBQUssS0FBSyxRQUFRLElBQUksR0FBRyxRQUFRO0FBQUEsUUFDaEQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUSxJQUFJLHFCQUFxQjtBQUFBLFVBQ2pDLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
