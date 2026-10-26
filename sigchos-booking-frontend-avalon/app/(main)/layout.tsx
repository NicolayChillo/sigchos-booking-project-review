import { Metadata } from 'next';
import Layout from '../../layout/layout';

interface MainLayoutProps {
    children: React.ReactNode;
}
export const metadata: Metadata = {
    title: 'Sigchos Booking - Panel',
    description: 'Panel de administración del sistema de reservas turísticas de Sigchos.',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function MainLayout({ children }: MainLayoutProps) {
    return <Layout>{children}</Layout>;
}
