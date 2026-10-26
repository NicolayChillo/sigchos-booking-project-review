import React from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';

export default function NotFound() {
    return (
        <div className="overflow-hidden m-0 relative h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/layout/images/pages/exception/bg-404.png)' }}>
            <div className="text-center text-5xl pt-5 font-bold text-white">
                <div className="inline-block py-1 px-2 text-white surface-900">
                    <span>Página</span>
                </div>
                <span className="text-color"> No Encontrada</span>
            </div>
            <div className="w-full absolute bottom-0 text-center surface-900 h-14rem">
                <div className="w-full absolute text-center z-1" style={{ top: '-36px' }}>
                    <img src="/layout/images/pages/exception/icon-error.png" alt="avalon-react" />
                </div>
                <div className="w-29rem relative text-white" style={{ marginLeft: '-200px', left: '50%', top: '30px' }}>
                    <div className="p-3">
                        <h3 className="m-0 mb-2 text-white">Página no encontrada.</h3>
                        <p className="m-0">La ruta que intentas acceder no existe.</p>
                    </div>
                    <Link href="/landing">
                        <Button label="Volver al Inicio" type="button" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
