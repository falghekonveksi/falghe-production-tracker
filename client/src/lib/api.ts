// API client - all calls go to Vercel serverless functions → Neon PostgreSQL

const API_BASE = '/api';

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders() {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function getOrderByCode(code: string) {
  const res = await fetch(`${API_BASE}/orders?code=${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] ?? null : data;
}

export async function createOrder(order: {
  code: string;
  clientName: string;
  whatsapp: string;
  quantity: number;
  size: string;
  pricePerPcs: number;
  eta: string;
  company: string;
}) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteOrder(id: number) {
  const res = await fetch(`${API_BASE}/orders?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete order');
  return res.json();
}

// ─── Production Steps ─────────────────────────────────────────────────────────

export async function getProductionSteps(orderId: number) {
  const res = await fetch(`${API_BASE}/production-steps?orderId=${orderId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createProductionStep(step: {
  orderId: number;
  stepName: string;
  status: string;
  notes?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}) {
  const res = await fetch(`${API_BASE}/production-steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProductionStep(id: number) {
  const res = await fetch(`${API_BASE}/production-steps?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete step');
  return res.json();
}

// ─── Photos (Cloudinary) ─────────────────────────────────────────────────────

export async function uploadPhoto(payload: {
  orderId: number;
  stepName: string;
  notes?: string;
  fileName: string;
  fileBase64: string;
  mimeType: string;
}) {
  const res = await fetch(`${API_BASE}/upload-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPhotos(orderId: number) {
  const res = await fetch(`${API_BASE}/upload-photo?orderId=${orderId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function deletePhoto(id: string, publicId?: string) {
  const params = new URLSearchParams({ id });
  if (publicId) params.append('publicId', publicId);
  const res = await fetch(`${API_BASE}/upload-photo?${params}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete photo');
  return res.json();
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getInvoiceByOrderCode(orderCode: string) {
  const res = await fetch(`${API_BASE}/invoices?orderCode=${encodeURIComponent(orderCode)}`);
  if (!res.ok) throw new Error('Invoice not found');
  return res.json();
}

export async function createInvoice(invoice: {
  orderId: number;
  orderCode: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  taxRate: number;
  dueDate: string;
  status: string;
}) {
  const res = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
