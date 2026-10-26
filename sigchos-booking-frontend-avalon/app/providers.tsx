'use client';

import { PrimeReactProvider } from 'primereact/api';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { AppProviders } from '../lib/providers/AppProviders';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrimeReactProvider>
      <AppProviders>
        <LayoutProvider>{children}</LayoutProvider>
      </AppProviders>
    </PrimeReactProvider>
  );
}
