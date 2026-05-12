import type { SafEvent } from '../models';

export const mockEvents: SafEvent[] = [
  {
    id: 'event-001',
    topic: 'ecohub.saf.iat.orders',
    direction: 'incoming',
    eventType: 'saf.order.created',
    correlationId: 'mock-correlation-001',
    timestamp: '2026-05-12T08:30:00.000Z',
    status: 'mocked',
    profileId: 'service-consumer-iat',
    payload: {
      orderId: 'MOCK-ORDER-1001',
      customerReference: 'MOCK-CUSTOMER-A',
      materialCode: 'SAF-DEMO-001',
      quantity: 1200,
      unit: 'L',
    },
  },
  {
    id: 'event-002',
    topic: 'ecohub.saf.iat.status',
    direction: 'outgoing',
    eventType: 'saf.delivery.status.updated',
    correlationId: 'mock-correlation-002',
    timestamp: '2026-05-12T08:36:00.000Z',
    status: 'mocked',
    profileId: 'service-provider-iat',
    payload: {
      deliveryId: 'MOCK-DELIVERY-2001',
      status: 'READY_FOR_PICKUP',
      locationCode: 'MOCK-DEPOT-CH',
    },
  },
];
