'use client';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutContext } from './context/layoutcontext';
import { classNames, DomHandler } from 'primereact/utils';
import { useEventListener, useMountEffect, useResizeListener, useUnmountEffect } from 'primereact/hooks';
import { PrimeReactContext } from 'primereact/api';

import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import AppBreadcrumb from './AppBreadCrumb';
import AppFooter from './AppFooter';
import type { AppTopbarRef, ChildContainerProps } from '@/types';

const Layout = (props: ChildContainerProps) => {
    const { layoutConfig, layoutState, setLayoutState, setLayoutConfig, isSlim, isSlimPlus, isHorizontal, isDesktop, isSidebarActive } = useContext(LayoutContext);
    const { setRipple } = useContext(PrimeReactContext);
    const topbarRef = useRef<AppTopbarRef>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    let timeout: NodeJS.Timeout | null = null;

    const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
        type: 'click',
        listener: (event) => {
            const isOutsideClicked = !(
                sidebarRef.current?.isSameNode(event.target as Node) ||
                sidebarRef.current?.contains(event.target as Node) ||
                topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
                topbarRef.current?.menubutton?.contains(event.target as Node)
            );

            if (isOutsideClicked) {
                hideMenu();
            }
        }
    });

    const [bindDocumentResizeListener, unbindDocumentResizeListener] = useResizeListener({
        listener: () => {
            if (isDesktop() && !DomHandler.isTouchDevice()) {
                hideMenu();
            }
        }
    });

    const hideMenu = useCallback(() => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            overlayMenuActive: false,
            overlaySubmenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false,
            resetMenu: (isSlim() || isSlimPlus() || isHorizontal()) && isDesktop()
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSlim, isSlimPlus, isHorizontal, isDesktop]);

    const blockBodyScroll = () => {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    };

    const unblockBodyScroll = () => {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    };
    useMountEffect(() => {
        setRipple?.(layoutConfig.ripple);
    });

    const onMouseEnter = () => {
        if (!layoutState.anchored) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                sidebarActive: true
            }));
        }
    };

    const onMouseLeave = () => {
        if (!layoutState.anchored) {
            if (!timeout) {
                timeout = setTimeout(
                    () =>
                        setLayoutState((prevLayoutState) => ({
                            ...prevLayoutState,
                            sidebarActive: false
                        })),
                    300
                );
            }
        }
    };

    useEffect(() => {
        const onRouteChange = () => {
            if (layoutConfig.colorScheme === 'dark') {
                setLayoutConfig((prevState) => ({ ...prevState, menuTheme: 'dark' }));
            }
        };
        onRouteChange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    useEffect(() => {
        if (isSidebarActive()) {
            bindMenuOutsideClickListener();
        }

        if (layoutState.staticMenuMobileActive) {
            blockBodyScroll();
            (isSlim() || isSlimPlus() || isHorizontal()) && bindDocumentResizeListener();
        }

        return () => {
            unbindMenuOutsideClickListener();
            unbindDocumentResizeListener();
            unblockBodyScroll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive, layoutState.overlaySubmenuActive]);

    useEffect(() => {
        const onRouteChange = () => {
            hideMenu();
        };
        onRouteChange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    useUnmountEffect(() => {
        unbindMenuOutsideClickListener();
    });

    const containerClassName = classNames('layout-topbar-' + layoutConfig.topbarTheme, 'layout-menu-' + layoutConfig.menuTheme, 'layout-menu-profile-' + layoutConfig.menuProfilePosition, {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-slim': layoutConfig.menuMode === 'slim',
        'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
        'layout-horizontal': layoutConfig.menuMode === 'horizontal',
        'layout-reveal': layoutConfig.menuMode === 'reveal',
        'layout-drawer': layoutConfig.menuMode === 'drawer',
        'p-input-filled': layoutConfig.inputStyle === 'filled',
        'layout-sidebar-dark': layoutConfig.colorScheme === 'dark',
        'p-ripple-disabled': !layoutConfig.ripple,
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive,
        'layout-topbar-menu-active': layoutState.topbarMenuActive,
        'layout-menu-profile-active': layoutState.menuProfileActive,
        'layout-sidebar-active': layoutState.sidebarActive,
        'layout-sidebar-anchored': layoutState.anchored
    });

    return (
        <React.Fragment>
            <div className={classNames('layout-container', containerClassName)}>
                <AppTopbar ref={topbarRef} />
                <div ref={sidebarRef} className="layout-sidebar" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                    <AppSidebar />
                </div>
                <div className="layout-content-wrapper">
                    <div>
                        <AppBreadcrumb></AppBreadcrumb>
                        <div className="layout-content">{props.children}</div>
                    </div>
                    {/* <AppFooter></AppFooter> */}
                </div>
                <div className="layout-mask"></div>
            </div>
        </React.Fragment>
    );
};

export default Layout;
