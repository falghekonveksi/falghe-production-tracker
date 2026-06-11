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
      const { code } = req.query;
      if (code) {
        const rows = await sql`SELECT * FROM orders WHERE code = ${code.toUpperCase()} LIMIT 1`;
        return res.status(200).json(rows[0] || null);
      }
      const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { code, clientName, whatsapp, quantity, size, pricePerPcs, eta, company } = req.body;
      if (!code || !clientName || !whatsapp || !quantity || !size || !pricePerPcs || !eta) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const rows = await sql`
        INSERT INTO orders (code, client_name, whatsapp, quantity, size, price_per_pcs, eta, company, status, progress)
        VALUES (${code.toUpperCase()}, ${clientName}, ${whatsapp}, ${quantity}, ${size}, ${pricePerPcs}, ${eta}, ${company || null}, 'pending', 0)
        RETURNING *
      `;
      const order = rows[0];
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(order.id).padStart(4, '0')}`;
      await sql`
        INSERT INTO invoices (order_id, order_code, invoice_number, items, status)
        VALUES (${order.id}, ${order.code}, ${invoiceNumber}, '[]', 'draft')
        ON CONFLICT DO NOTHING
      `;
      return res.status(201).json(order);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await sql`DELETE FROM orders WHERE id = ${parseInt(id)}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('orders error:', err);
    return res.status(500).json({ error: err.message });
  }
};
