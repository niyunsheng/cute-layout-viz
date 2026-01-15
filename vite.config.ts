import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

// Custom plugin to copy Python files to public directory
function copyPythonFiles() {
  return {
    name: 'copy-python-files',
    buildStart() {
      const pythonFiles = [
        'layout.py',
        'composition.py',
        'utils.py',
        'layout_string_parser.py'
      ];

      const targetDir = resolve(__dirname, 'public/python');
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      pythonFiles.forEach(file => {
        const src = resolve(__dirname, 'python', file);
        const dest = resolve(targetDir, file);
        try {
          copyFileSync(src, dest);
          console.log(`Copied ${file} to public/python/`);
        } catch (err) {
          console.error(`Failed to copy ${file}:`, err);
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [copyPythonFiles(), react(), tailwindcss()],
  base: '/cute-layout-viz/',
  optimizeDeps: {
    // Exclude pyodide from pre-bundling - it will be loaded dynamically
    exclude: ['pyodide'],
    // Force immediate optimization on server start
    force: false
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000
    },
    fs: {
      strict: false
    }
  }
})
