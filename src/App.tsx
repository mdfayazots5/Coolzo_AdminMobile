/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AppRouter from './routes';
import { Toaster } from '@/components/ui/sonner';
import { NetworkStatusBanner } from '@/components/shared/NetworkStatusBanner';
import { MasterDataProvider } from '@/core/master-data/MasterDataProvider';
import { SystemUXProvider } from '@/core/system/SystemUXProvider';

export default function App() {
  return (
    <SystemUXProvider>
      <MasterDataProvider>
        <NetworkStatusBanner />
        <AppRouter />
        <Toaster position="top-right" richColors />
      </MasterDataProvider>
    </SystemUXProvider>
  );
}
