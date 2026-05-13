import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  logLevel: 'error',
  // Serve migrated product images from the migrator output directory.
  // Files under messibella_migrator/output_gui/images/ are available at /images/...
  publicDir: 'messibella_migrator/output_gui',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [react()],
});
