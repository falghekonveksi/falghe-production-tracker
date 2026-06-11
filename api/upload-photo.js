const { getDb, initDb, corsHeaders } = require('./_db.js');

async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function uploadToCloudinary(base64Data, fileName) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary credentials not configured');

  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'falghe-production';
  const publicId = `${folder}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
  const signatureStr = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1(signatureStr);

  const formData = new FormData();
  formData.append('file', `data:image/jpeg;base64,${base64}`);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`Cloudinary upload failed: ${await response.text()}`);
  return response.json();
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
      const rows = await sql`SELECT * FROM photos WHERE order_id = ${parseInt(orderId)} ORDER BY created_at ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { orderId, stepName, notes, fileName, fileBase64, mimeType } = req.body;
      if (!orderId || !fileBase64 || !fileName) return res.status(400).json({ error: 'Missing required fields' });
      const cloudResult = await uploadToCloudinary(fileBase64, fileName);
      const rows = await sql`
        INSERT INTO photos (order_id, step_name, photo_url, cloudinary_public_id, notes)
        VALUES (${parseInt(orderId)}, ${stepName || null}, ${cloudResult.secure_url}, ${cloudResult.public_id}, ${notes || null})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id, publicId } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      if (publicId) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = await sha1(signatureStr);
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body: formData }).catch(console.warn);
      }
      await sql`DELETE FROM photos WHERE id = ${parseInt(id)}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('upload-photo error:', err);
    return res.status(500).json({ error: err.message });
  }
};
