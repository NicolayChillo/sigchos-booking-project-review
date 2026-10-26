import { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { LayoutContext } from './context/layoutcontext';
import type { AppTopbarRef } from '@/types';
import Link from 'next/link';
import { Ripple } from 'primereact/ripple';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { onMenuToggle } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);

    const onMenuButtonClick = () => {
        onMenuToggle();
    };

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current
    }));

    return (
        <div className="layout-topbar">
            <div className="layout-topbar-start">
                <a 
                    ref={menubuttonRef} 
                    className="p-ripple layout-menu-button" 
                    onClick={onMenuButtonClick} 
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onMenuButtonClick();
                        }
                    }}
                    style={{ display: 'flex', flexShrink: 0, position: 'static', marginTop: 0, marginRight: '1rem'}}
                >
                    <i className="pi pi-angle-right"></i>
                    <Ripple />
                </a>
                <Link className="layout-topbar-logo" href="/dashboard" style={{ textDecoration: 'none', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/images/logo/logo-gad.png" alt="Sigchos Logo" style={{ height: '2.5rem', width: 'auto', objectFit: 'contain' }} className="h-2rem sm:h-3rem" />
                    <div className="flex flex-column justify-content-center">
                        <span className="font-bold text-sm sm:text-xl" style={{ color: 'var(--topbar-item-text-color)', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                            SIGCHOS BOOKING
                        </span>
                        <span className="hidden sm:block text-xs" style={{ color: 'var(--topbar-item-text-color)', whiteSpace: 'nowrap', lineHeight: '1.2', opacity: 0.8 }}>
                            Panel de gestión
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
