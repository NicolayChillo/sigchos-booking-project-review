'use client';

import React from 'react';
import AppSubMenu from './AppSubMenu';
import { useAuth } from '@/lib/auth/AuthContext';
import type { MenuModel } from '@/types';

const AppMenu = () => {
    const { user } = useAuth();
    const role = user?.role;
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const model: MenuModel[] = [];

    if (!mounted) {
        return null; // Or a skeleton/loading state
    }

    // --- Dashboard (todos los roles) ---
    model.push({
        label: 'Inicio',
        icon: 'pi pi-home',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/dashboard'
            }
        ]
    });

    // --- Sección de Catálogo Público ---
    model.push({
        label: 'Catálogo',
        icon: 'pi pi-fw pi-globe',
        items: [
            {
                label: 'Ver Establecimientos',
                icon: 'pi pi-fw pi-building',
                to: '/landing'
            }
        ]
    });

    // --- Reservas (CLIENT y ESTABLISHMENT_ADMIN) ---
    if (role === 'CLIENT') {
        model.push({
            label: 'Reservas',
            icon: 'pi pi-fw pi-calendar',
            items: [
                {
                    label: 'Mis Reservas',
                    icon: 'pi pi-fw pi-calendar',
                    to: '/bookings'
                }
            ]
        });
    }

    // --- Reservas (CLIENT y ESTABLISHMENT_ADMIN) ---
    if (role === 'ESTABLISHMENT_ADMIN') {
        model.push({
            label: 'Gestionar Reservas',
            icon: 'pi pi-fw pi-calendar',
            items: [
                {
                    label: 'Reservas',
                    icon: 'pi pi-fw pi-calendar',
                    to: '/bookings'
                }
            ]
        });
    }

    // --- Establecimientos (ESTABLISHMENT_ADMIN) ---
    if (role === 'ESTABLISHMENT_ADMIN') {
        model.push({
            label: 'Gestión Hotelera',
            icon: 'pi pi-fw pi-building',
            items: [
                {
                    label: 'Mis Establecimientos',
                    icon: 'pi pi-fw pi-building',
                    to: '/establishments'
                }
            ]
        });
    }

    // --- Administración (SYSTEM_ADMIN) ---
    if (role === 'SYSTEM_ADMIN') {
        model.push({
            label: 'Administración',
            icon: 'pi pi-fw pi-cog',
            items: [
                {
                    label: 'Usuarios',
                    icon: 'pi pi-fw pi-users',
                    to: '/admin/users'
                },
                {
                    label: 'Solicitudes de Membresía',
                    icon: 'pi pi-fw pi-id-card',
                    to: '/admin/membership-requests'
                },
                {
                    label: 'Solicitudes de Establecimiento',
                    icon: 'pi pi-fw pi-file',
                    to: '/admin/establishment-requests'
                }
            ]
        });
    }



    return <AppSubMenu model={model} />;
};

export default AppMenu;
