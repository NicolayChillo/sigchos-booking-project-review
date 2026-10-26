import { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';

interface FullPageLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Sigchos Booking',
    description: 'Sistema de reservas turísticas del cantón Sigchos'
};

export default function FullPageLayout({ children }: FullPageLayoutProps) {
    return (
        <React.Fragment>
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            {children}
        </React.Fragment>
    );
}
