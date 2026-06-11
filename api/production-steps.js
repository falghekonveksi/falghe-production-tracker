const { getDb, initDb, corsHeaders } = require('./_db.js');

async function sendWANotification(phone, message) {
  const token = process.env.FONNTE_TOKEN;
  if (!token || !phone) return;
  try {
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: phone, message }),
    });
  } catch (err) {
    console.warn('WA notification failed:', err.message);
  }
}

function calculateProgress(steps) {
  if (!steps || steps.length === 0) return 0;
  const done = steps.filter(s => s.status === 'completed').length;
  return Math.round((done / steps.length) * 100);
}

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
      const { orderId } = req.query;
      if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
      const rows = await sql`SELECT * FROM production_steps WHERE order_id = ${parseInt(orderId)} ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { orderId, stepName, status, notes, startedAt, completedAt } = req.body;
      if (!orderId || !stepName || !status) return res.status(400).json({ error: 'Missing required fields' });

      const step = await sql`
        INSERT INTO production_steps (order_id, step_name, status, notes, started_at, completed_at)
        VALUES (${orderId}, ${stepName}, ${status}, ${notes || null}, ${startedAt || null}, ${completedAt || null})
        RETURNING *
      `;

      const allSteps = await sql`SELECT status FROM production_steps WHERE order_id = ${orderId}`;
      const progress = calculateProgress(allSteps);
      const orderStatus = progress === 100 ? 'completed' : allSteps.some(s => s.status === 'in_progress') ? 'in_progress' : 'pending';
      await sql`UPDATE orders SET progress = ${progress}, status = ${orderStatus} WHERE id = ${orderId}`;

      const orderRows = await sql`SELECT client_name, whatsapp FROM orders WHERE id = ${orderId}`;
      if (orderRows[0]) {
        const { client_name, whatsapp } = orderRows[0];
        const statusLabel = status === 'completed' ? 'Selesai ✅' : status === 'in_progress' ? 'Sedang Berjalan 🔄' : 'Menunggu ⏳';
        const message = `Halo ${client_name}! 👋\n\nUpdate produksi Falghe:\n\n📦 Divisi: *${stepName}*\n📊 Status: *${statusLabel}*\n${notes ? `📝 Catatan: ${notes}\n` : ''}⚡ Progress: *${progress}%*\n\nTerima kasih telah mempercayai Falghe! 🧡`;
        await sendWANotification(whatsapp, message);
      }
      return res.status(201).json(step[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const stepRows = await sql`SELECT order_id FROM production_steps WHERE id = ${parseInt(id)}`;
      await sql`DELETE FROM production_steps WHERE id = ${parseInt(id)}`;
      if (stepRows[0]) {
        const { order_id } = stepRows[0];
        const allSteps = await sql`SELECT status FROM production_steps WHERE order_id = ${order_id}`;
        const progress = calculateProgress(allSteps);
        const orderStatus = progress === 100 ? 'completed' : allSteps.some(s => s.status === 'in_progress') ? 'in_progress' : 'pending';
        await sql`UPDATE orders SET progress = ${progress}, status = ${orderStatus} WHERE id = ${order_id}`;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('production-steps error:', err);
    return res.status(500).json({ error: err.message });
  }
};
