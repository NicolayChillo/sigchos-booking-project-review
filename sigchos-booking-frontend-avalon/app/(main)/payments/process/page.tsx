'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { useProcessPaymentCheckout } from '@/modules/payments/hooks/useProcessPaymentCheckout';

export default function PaymentProcessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const id = idParam ? Number(idParam) : null;
  const clientTransactionId = searchParams.get('clientTransactionId');
  const { data, error, isPending } = useProcessPaymentCheckout({
    transactionId: id,
    clientTransactionId
  });

  return (
    <div className="flex justify-content-center p-4">
      <Card className="w-full md:w-30rem">
        {isPending && (
          <div className="text-center">
            <ProgressSpinner />
            <h3>Verificando pago...</h3>
          </div>
        )}

        {data?.status === 'APPROVED' && (
          <div className="text-center">
            <h2>✅ Pago confirmado</h2>
            <p>Tu pago fue procesado correctamente.</p>
          </div>
        )}

        {data?.status === 'REJECTED' && (
          <div className="text-center">
            <h2>❌ Pago rechazado</h2>
            <p>La entidad financiera rechazó el pago.</p>
          </div>
        )}

        {data?.status === 'CANCELLED' && (
          <div className="text-center">
            <h2>⚠️ Pago cancelado</h2>
            <p>El proceso de pago fue cancelado o expiró.</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <h2>Error al verificar el pago</h2>
            <p>Inténtalo nuevamente.</p>
          </div>
        )}

        <div className="flex justify-content-center mt-4">
          <Button
            label="Ir a mis reservas"
            onClick={() => router.push('/bookings')}
          />
        </div>
      </Card>
    </div>
  );
}
