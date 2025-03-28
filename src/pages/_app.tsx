'use client';

import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { moonbaseAlpha } from 'wagmi/chains';
import { http } from 'viem';
import { Bounce, ToastContainer } from 'react-toastify';

const MOONBEAM_TESTNET_RPC = 'https://moonbase-alpha.public.blastapi.io';

const config = getDefaultConfig({
  appName: 'Payroll',
  projectId: 'aad376918081f148396f443ac7a53eb7',
  chains: [moonbaseAlpha],
  transports: {
    [moonbaseAlpha.id]: http(MOONBEAM_TESTNET_RPC),
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = new QueryClient();

  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider modalSize="compact">
              {children}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
              />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}