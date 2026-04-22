import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/features/admin/') || id.includes('/src/core/master-data/') || id.includes('/src/core/network/user-repository') || id.includes('/src/core/network/role-repository') || id.includes('/src/core/network/branch-repository')) {
              return 'admin';
            }

            if (id.includes('/src/features/operations/') || id.includes('/src/features/team/') || id.includes('/src/core/network/service-request-repository') || id.includes('/src/core/network/technician-repository') || id.includes('/src/core/network/scheduling-repository') || id.includes('/src/core/network/operations-dashboard-repository')) {
              return 'operations';
            }

            if (id.includes('/src/features/field/') || id.includes('/src/core/network/field-workflow-repository')) {
              return 'field';
            }

            if (id.includes('/src/features/governance/') || id.includes('/src/features/system/') || id.includes('/src/core/network/governance-repository') || id.includes('/src/core/network/system-repository')) {
              return 'governance';
            }

            if (id.includes('/src/features/billing/') || id.includes('/src/features/finance/') || id.includes('/src/core/network/invoice-repository') || id.includes('/src/core/network/payment-repository')) {
              return 'finance';
            }

            if (id.includes('/src/features/customers/') || id.includes('/src/features/equipment/') || id.includes('/src/features/amc/') || id.includes('/src/core/network/customer-repository') || id.includes('/src/core/network/equipment-repository') || id.includes('/src/core/network/amc-repository')) {
              return 'customer';
            }

            if (id.includes('/src/features/inventory/') || id.includes('/src/features/estimates/') || id.includes('/src/core/network/inventory-repository') || id.includes('/src/core/network/estimate-repository') || id.includes('/src/core/network/job-report-repository')) {
              return 'inventory';
            }

            if (id.includes('/src/features/support/') || id.includes('/src/core/network/support-repository')) {
              return 'support';
            }

            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }

            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }

            if (id.includes('@base-ui') || id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('tw-animate-css') || id.includes('motion') || id.includes('sonner')) {
              return 'ui-vendor';
            }

            if (id.includes('axios') || id.includes('date-fns') || id.includes('zustand') || id.includes('next-themes')) {
              return 'app-vendor';
            }

            if (id.includes('@google/genai')) {
              return 'ai-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
