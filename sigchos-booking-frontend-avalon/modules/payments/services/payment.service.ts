import { HttpStatusCode } from 'axios';
import { apiHandler } from '@/lib/http/apiHandler';
import { PaymentApi } from '../api/payment.api';
import type { PaymentStatusFilter } from '../enums/PaymentStatusFilter';
import { PaymentMapper } from '../mappers/payment.mapper';
import type {
  BankTransferPaymentValidationRequest,
  VerifyPaymentRequest
} from '../dto/payment';

const baseErrorMapper = {
  [HttpStatusCode.NotFound]: 'No se encontro la reserva',
  [HttpStatusCode.Conflict]:
    'Tiene pagos pendientes de revisión o la reserva fue completada',
  [HttpStatusCode.BadRequest]:
    'El archivo no es valido o es muy pesado (Tamaño maximo: 1MB)',
  [HttpStatusCode.InternalServerError]: 'Ocurrio un error, intente mas tarde'
};

export const PaymentService = {
  async findByBookingId(bookingId: number, status: PaymentStatusFilter) {
    const { data } = await apiHandler(
      () => PaymentApi.findByBookingId(bookingId, status),
      baseErrorMapper
    );

    return data.map(PaymentMapper.toEntity);
  },

  async uploadBankTransferReceipt(bookingId: number, file: File) {
    const { data } = await apiHandler(
      () => PaymentApi.uploadBankTransferReceipt(bookingId, file),
      baseErrorMapper
    );
    return PaymentMapper.toEntity(data);
  },

  async validateBankTransferReceipt(
    id: number,
    dto: BankTransferPaymentValidationRequest
  ) {
    const errorMapper = {
      ...baseErrorMapper,
      [HttpStatusCode.BadRequest]:
        'El pago no puede ser procesado o falta razón de rechazo',
      [HttpStatusCode.Unauthorized]: 'No tiene permisos para validar el pago'
    };

    const { data } = await apiHandler(
      () => PaymentApi.validateBankTransferReceipt(id, dto),
      errorMapper
    );

    return PaymentMapper.toEntity(data);
  },

  async createPaymentCheckout(bookingId: number) {
    const errorMapper = {
      ...baseErrorMapper,
      [HttpStatusCode.BadRequest]: 'El pago no puede ser procesado',
      [HttpStatusCode.Unauthorized]:
        'No tiene permisos para iniciar el proceso de pago'
    };

    const { data } = await apiHandler(
      () => PaymentApi.createPaymentCheckout(bookingId),
      errorMapper
    );

    return data;
  },

  async processPaymentCheckout(dto: VerifyPaymentRequest) {
    const errorMapper = {
      ...baseErrorMapper,
      [HttpStatusCode.NotFound]: 'No se encontro el pago',
      [HttpStatusCode.Conflict]: 'Inconsistencia de datos en el pago',
      [HttpStatusCode.BadRequest]: 'El pago no puede ser procesado'
    };

    const { data } = await apiHandler(
      () => PaymentApi.processPaymentCheckout(dto),
      errorMapper
    );

    return data;
  }
};
