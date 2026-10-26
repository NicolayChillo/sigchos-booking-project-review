'use client';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import type { ChildContainerProps, LayoutContextProps, LayoutConfig, LayoutState, Breadcrumb } from '@/types';

export const LayoutContext = React.createContext({} as LayoutContextProps);

export const LayoutProvider = (props: ChildContainerProps) => {
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        ripple: true,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'light',
        componentTheme: 'purple',
        scale: 14,
        menuTheme: 'light',
        topbarTheme: 'dark',
        menuProfilePosition: 'start',
        desktopMenuActive: true,
        mobileMenuActive: false,
        mobileTopbarActive: false
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
        rightMenuActive: false,
        topbarMenuActive: false,
        sidebarActive: false,
        anchored: false,
        overlaySubmenuActive: false,
        menuProfileActive: false,
        resetMenu: false
    });

    const onMenuProfileToggle = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            menuProfileActive: !prevLayoutState.menuProfileActive
        }));
    };

    const isSidebarActive = () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive || layoutState.overlaySubmenuActive;

    const onMenuToggle = () => {
        if (isOverlay()) {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                overlayMenuActive: !prevLayoutState.overlayMenuActive
            }));
        }

        if (isDesktop()) {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive
            }));
        } else {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive
            }));
        }
    };

    const isOverlay = () => {
        return layoutConfig.menuMode === 'overlay';
    };

    const isSlim = () => {
        return layoutConfig.menuMode === 'slim';
    };

    const isSlimPlus = () => {
        return layoutConfig.menuMode === 'slim-plus';
    };

    const isHorizontal = () => {
        return layoutConfig.menuMode === 'horizontal';
    };

    const isDesktop = () => {
        return window.innerWidth > 991;
    };
    const onTopbarMenuToggle = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            topbarMenuActive: !prevLayoutState.topbarMenuActive
        }));
    };
    const showRightSidebar = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            rightMenuActive: true
        }));
    };

    const value = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        isSlim,
        isSlimPlus,
        isHorizontal,
        isDesktop,
        isSidebarActive,
        breadcrumbs,
        setBreadcrumbs,
        onMenuProfileToggle,
        onTopbarMenuToggle,
        showRightSidebar
    };

    return (
        <LayoutContext.Provider value={value}>
            <>
                <Head>
                    <title>Sigchos Booking</title>
                    <meta charSet="UTF-8" />
                    <meta name="description" content="Sistema de reservas turísticas del cantón Sigchos" />
                    <meta name="robots" content="index, follow" />
                    <meta name="viewport" content="initial-scale=1, width=device-width" />
                    <meta property="og:type" content="website"></meta>
                    <meta property="og:title" content="Sigchos Booking"></meta>
                    <meta property="og:description" content="Sistema de reservas turísticas del cantón Sigchos" />
                    <link rel="icon" href={`/favicon.ico`} type="image/x-icon"></link>
                </Head>
                {props.children}
            </>
        </LayoutContext.Provider>
    );
};
