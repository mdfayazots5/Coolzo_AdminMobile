/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AppRouter from './routes';
import { Toaster } from '@/components/ui/sonner';
import { NetworkStatusBanner } from '@/components/shared/NetworkStatusBanner';

export default function App() {
  return (
    <>
      <NetworkStatusBanner />
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}
