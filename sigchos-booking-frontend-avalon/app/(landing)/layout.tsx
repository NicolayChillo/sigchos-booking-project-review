import { Metadata } from 'next';
import React from 'react';
import { LandingPublicHeader } from './LandingHeader';

interface LandingLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Sigchos Booking — Catálogo de alojamiento',
    description: 'Explora establecimientos de hospedaje y turismo en el cantón Sigchos.'
};

export default function LandingLayout({ children }: LandingLayoutProps) {
    return (
        <React.Fragment>
            <LandingPublicHeader />
            <main>
                {children}
            </main>
        </React.Fragment>
    );
}
