'use client';

import { useEffect, useRef } from 'react';
import { PaymentCheckoutResponse } from '../dto/payment';
import { Dialog } from 'primereact/dialog';

declare global {
  interface Window {
    PPaymentButtonBox: any;
  }
}

interface PayPhoneModalProps {
  open: boolean;
  payment: PaymentCheckoutResponse | null;
  onClose: () => void;
}

export default function PayPhoneModal({
  open,
  payment,
  onClose
}: PayPhoneModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAssets = async () => {
      if (
        document.querySelector(
          'script[src="https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js"]'
        )
      ) {
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css';
      link.crossOrigin = 'anonymous';
      link.integrity = 'sha384-yIxNgn9lXjR+7/gLkFr1QGiBQXEUxxVJPzt4k1ht9/YpVuBvqk1xWsfRsTz7EjeD';

      document.head.appendChild(link);

      const script = document.createElement('script');
      script.type = 'module';
      script.src =
        'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js';
      script.crossOrigin = 'anonymous';
      script.integrity = 'sha384-Sm+9Xqtft3RTeDmnb0+gGymCad3sBUjgXCj+LuvNeZcd5TMgWUkoUNUTdQSKwA6q';

      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    };

    loadAssets();
  }, []);

  useEffect(() => {
    if (!open || !payment) return;

    const timer = setTimeout(() => {
      const container = document.getElementById('pp-button');

      if (container) {
        container.innerHTML = '';

        new window.PPaymentButtonBox({
          token: payment.token,
          amount: payment.amount,
          amountWithoutTax: payment.amountWithoutTax,
          amountWithTax: 0,
          tax: 0,
          service: 0,
          tip: 0,
          storeId: payment.storeId,
          reference: payment.reference,
          currency: payment.currency,
          clientTransactionId: payment.transactionId,
          backgroundColor: '#6610f2',
          // Intercept the payment result and redirect to the current
          // environment's /payments/process page instead of using the
          // URL configured in the Payphone merchant panel (which points to prod)
          dataCallback: function (payphoneData: {
            id: number;
            clientTransactionId: string;
          }) {
            window.location.href =
              `${window.location.origin}/payments/process` +
              `?id=${payphoneData.id}` +
              `&clientTransactionId=${encodeURIComponent(payphoneData.clientTransactionId)}`;
          }
        }).render('pp-button');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, payment]);

  if (!open || !payment) return null;

  return (
    <Dialog
      header="Pago"
      visible={open}
      style={{ width: '500px' }}
      onHide={onClose}
    >
      <div id="pp-button" />
    </Dialog>
  );
}
