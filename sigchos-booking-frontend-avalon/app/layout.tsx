import { Metadata } from 'next';
import { RootProviders } from './providers';

import '../styles/layout/layout.scss';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.css';

export const metadata: Metadata = {
    title: {
        template: '%s | Sigchos Booking',
        default: 'Sigchos Booking - Gestiona tus alojamientos',
    },
    description: 'Plataforma oficial para la gestión de alojamientos y reservas turísticas en Sigchos.',
    keywords: ['sigchos', 'booking', 'turismo', 'alojamiento', 'ecuador', 'reservas'],
    authors: [{ name: 'Sigchos Booking Team' }],
    creator: 'Sigchos Booking',
    publisher: 'Sigchos Booking',
    icons: {
        icon: '/favicon.ico',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <link id="theme-link" href={`/theme/theme-light/green/theme.css`} rel="stylesheet"></link>
            </head>
            <body>
                <RootProviders>
                    {children}
                </RootProviders>
            </body>
        </html>
    );
}
