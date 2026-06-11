const { getDb, initDb, corsHeaders } = require('./_db.js');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).end();
  }
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  try {
    await initDb();
    const sql = getDb();

    if (req.method === 'GET') {
      const { orderCode } = req.query;
      if (!orderCode) return res.status(400).json({ error: 'Missing orderCode' });
      const rows = await sql`
        SELECT i.*, row_to_json(o.*) as order
        FROM invoices i
        LEFT JOIN orders o ON o.id = i.order_id
        WHERE i.order_code = ${orderCode.toUpperCase()}
        LIMIT 1
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'POST') {
      const { orderId, orderCode, items, taxRate, dueDate, status } = req.body;
      if (!orderId || !orderCode) return res.status(400).json({ error: 'Missing orderId or orderCode' });
      const subtotal = (items || []).reduce((sum, item) => sum + (item.total || 0), 0);
      const tax = Math.round(subtotal * ((taxRate || 10) / 100));
      const total = subtotal + tax;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(orderId).padStart(4, '0')}`;
      const rows = await sql`
        INSERT INTO invoices (order_id, order_code, invoice_number, items, tax_rate, subtotal, tax, total, due_date, status)
        VALUES (${orderId}, ${orderCode.toUpperCase()}, ${invoiceNumber}, ${JSON.stringify(items || [])}::jsonb, ${taxRate || 10}, ${subtotal}, ${tax}, ${total}, ${dueDate || null}, ${status || 'draft'})
        ON CONFLICT (invoice_number) DO UPDATE SET
          items = EXCLUDED.items, tax_rate = EXCLUDED.tax_rate, subtotal = EXCLUDED.subtotal,
          tax = EXCLUDED.tax, total = EXCLUDED.total, due_date = EXCLUDED.due_date, status = EXCLUDED.status
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('invoices error:', err);
    return res.status(500).json({ error: err.message });
  }
};
