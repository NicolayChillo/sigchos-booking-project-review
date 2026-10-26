import { classNames } from 'primereact/utils';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Tooltip } from 'primereact/tooltip';
import { LayoutContext } from './context/layoutcontext';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

const AppMenuProfile = () => {
    const { layoutState, layoutConfig, isSlim, isHorizontal, onMenuProfileToggle } = useContext(LayoutContext);
    const router = useRouter();
    const ulRef = useRef<HTMLUListElement | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, signOut } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const roleLabels: Record<string, string> = {
        CLIENT: 'Cliente',
        ESTABLISHMENT_ADMIN: 'Administrador de establecimiento',
        SYSTEM_ADMIN: 'Administrador de sistema'
    };

    const fullName = mounted && user ? `${user.firstName} ${user.lastName}`.trim() : 'Usuario Invitado';
    const role = mounted && user?.role ? (roleLabels[user.role] || user.role) : '';

    const hiddenClassName = classNames({ hidden: layoutConfig.menuMode === 'drawer' && !layoutState.sidebarActive });

    const toggleMenu = () => {
        if (layoutState.menuProfileActive) {
            setTimeout(() => {
                (ulRef.current as any).style.maxHeight = '0';
            }, 1);
            (ulRef.current as any).style.opacity = '0';
            if (isHorizontal()) {
                (ulRef.current as any).style.transform = 'scaleY(0.8)';
            }
        } else {
            setTimeout(() => {
                (ulRef.current as any).style.maxHeight = (ulRef.current as any).scrollHeight.toString() + 'px';
            }, 1);
            (ulRef.current as any).style.opacity = '1';
            if (isHorizontal()) {
                (ulRef.current as any).style.transform = 'scaleY(1)';
            }
        }
        onMenuProfileToggle();
    };

    useEffect(() => {
        if (layoutState.menuProfileActive) toggleMenu();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    const tooltipValue = (tooltipText: string) => {
        return isSlim() ? tooltipText : null;
    };

    return (
        <React.Fragment>
            <div className="layout-menu-profile" style={{ marginLeft: '-0.75rem', width: 'calc(100% + 0.75rem)' }}>
                <Tooltip target={'.avatar-button'} content={tooltipValue('Profile') as string} />
                <button className="avatar-button p-link border-noround" onClick={toggleMenu}>
                    <span className="inline-flex align-items-center justify-content-center border-circle" style={{ width: '32px', height: '32px', background: 'var(--primary-color)', color: 'white', flexShrink: 0 }}>
                        <i className="pi pi-user text-sm"></i>
                    </span>
                    <span>
                        <strong className="white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ maxWidth: '120px', display: 'block' }}>{fullName}</strong>
                        <small className="white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ maxWidth: '120px', display: 'block' }}>{role}</small>
                    </span>
                    <i
                        className={classNames('layout-menu-profile-toggler pi pi-fw', {
                            'pi-angle-down': layoutConfig.menuProfilePosition === 'start' || isHorizontal(),
                            'pi-angle-up': layoutConfig.menuProfilePosition === 'end' && !isHorizontal()
                        })}
                    ></i>
                </button>

                <ul ref={ulRef} className={classNames('menu-transition', { overlay: isHorizontal() })} style={{ overflow: 'hidden', maxHeight: 0, opacity: 0, marginLeft: '0.75rem', width: 'calc(100% - 0.75rem)' }}>
                    {layoutState.menuProfileActive && (
                        <>
                            <li>
                                <button className="p-link" onClick={() => router.push('/profile')}>
                                    <i className="pi pi-user pi-fw"></i>
                                    <span className={hiddenClassName}>Mi Perfil</span>
                                </button>
                            </li>
                            <li>
                                <button className="p-link" onClick={() => {
                                    signOut();
                                    router.push('/auth/login');
                                }}>
                                    <i className="pi pi-power-off pi-fw"></i>
                                    <span className={hiddenClassName}>Cerrar sesión</span>
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </React.Fragment>
    );
};

export default AppMenuProfile;
