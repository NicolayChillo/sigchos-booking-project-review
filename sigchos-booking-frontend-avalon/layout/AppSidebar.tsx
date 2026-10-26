import Link from 'next/link';
import React, { useContext } from 'react';
import AppMenu from './AppMenu';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import AppMenuProfile from './AppMenuProfile';

const AppSidebar = () => {
    const { layoutConfig, setLayoutState } = useContext(LayoutContext);

    const anchor = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            anchored: !prevLayoutState.anchored
        }));
    };

    return (
        <React.Fragment>
            <div className="layout-sidebar-top">
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', width: 'auto' }}>
                    <span className="layout-sidebar-logo-slim" style={{ width: '2.8rem', display: 'flex', justifyContent: 'center' }}>
                        <img src="/images/logo/logo-gad.png" alt="Sigchos Logo" style={{ height: '2rem', width: 'auto', objectFit: 'contain' }} />
                    </span>
                    <span className="layout-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/images/logo/logo-gad.png" alt="Sigchos Logo" style={{ height: '2.8rem', width: 'auto', objectFit: 'contain' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--topbar-item-text-color)', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                                SIGCHOS BOOKING
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--topbar-item-text-color)', whiteSpace: 'nowrap', lineHeight: '1.2', opacity: 0.8 }}>
                                Panel de gestión
                            </span>
                        </div>
                    </span>
                </Link>
                <button className="layout-sidebar-anchor p-link" type="button" onClick={anchor}></button>
            </div>

            {layoutConfig.menuProfilePosition === 'start' && <AppMenuProfile />}
            <div className="layout-menu-container">
                <MenuProvider>
                    <AppMenu />
                </MenuProvider>
            </div>
            {layoutConfig.menuProfilePosition === 'end' && <AppMenuProfile />}
        </React.Fragment>
    );
};

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;
