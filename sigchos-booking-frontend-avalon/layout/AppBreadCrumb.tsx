import { usePathname, useSearchParams } from 'next/navigation';
import { ObjectUtils } from 'primereact/utils';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from './context/layoutcontext';
import type { Breadcrumb } from '@/types';
import { Button } from 'primereact/button';
import Link from 'next/link';

const AppBreadcrumb = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [breadcrumb, setBreadcrumb] = useState<Breadcrumb | null>(null);
    const { breadcrumbs } = useContext(LayoutContext);
    const isDashboard = pathname + searchParams.toString() !== '/' && pathname + searchParams.toString() !== '/dashboards/banking';

    useEffect(() => {
        const filteredBreadcrumbs = breadcrumbs?.find((crumb) => {
            return crumb.to?.replace(/\/$/, ' ') === pathname.replace(/\/$/, '');
        });
        setBreadcrumb(filteredBreadcrumbs ?? null);
    }, [pathname, breadcrumbs]);

    return (
        <div className="layout-breadcrumb-container">
            <nav className="layout-breadcrumb py-2">
                <ol>
                    <li>
                        <Link href={'/'} style={{ color: 'inherit' }}>
                            <i className="pi pi-home"></i>
                        </Link>
                    </li>
                    {ObjectUtils.isNotEmpty(breadcrumb?.labels) && isDashboard ? (
                        breadcrumb?.labels?.map((label, index) => {
                            return (
                                <React.Fragment key={index}>
                                    <i className="pi pi-angle-right"></i>
                                    <li key={index}>{label}</li>
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <>
                            <i className="pi pi-angle-right"></i>
                            {pathname + searchParams.toString() === '/' && <li key={'home'}>E-Commerce Dashboard</li>}
                            {pathname + searchParams.toString() === '/dashboards/banking' && <li key={'home'}>Banking Dashboard</li>}
                        </>
                    )}
                </ol>
            </nav>
        </div>
    );
};

export default AppBreadcrumb;
