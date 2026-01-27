import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize system environment variables (Vercel) -> .env files
  const apiKey = process.env.API_KEY || env.API_KEY || 
                 process.env.VITE_API_KEY || env.VITE_API_KEY || 
                 process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || 
                 process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-genai': ['@google/genai']
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});