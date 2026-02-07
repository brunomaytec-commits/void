import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Use '.' instead of process.cwd() to prevent TypeScript errors if Node types are missing
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Vital: Expose the process.env.API_KEY to the client-side code securely during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      port: 3000
    }
  };
});