import { getDb, initDb, corsHeaders } from './_db.js';

async function uploadToCloudinary(base64Data, fileName) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured');
  }

  // Strip data:image/...;base64, prefix if present
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'falghe-production';
  const publicId = `${folder}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

  // Generate SHA-1 signature
  const signatureStr = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1(signatureStr);

  const formData = new FormData();
  formData.append('file', `data:image/jpeg;base64,${base64}`);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  return response.json();
}

async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).set(corsHeaders()).end();
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  try {
    await initDb();
    const sql = getDb();

    // GET /api/upload-photo?orderId=123
    if (req.method === 'GET') {
      const { orderId } = req.query;
      if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
      const rows = await sql`
        SELECT * FROM photos WHERE order_id = ${parseInt(orderId)} ORDER BY created_at ASC
      `;
      return res.status(200).json(rows);
    }

    // POST /api/upload-photo - upload to Cloudinary + save URL
    if (req.method === 'POST') {
      const { orderId, stepName, notes, fileName, fileBase64, mimeType } = req.body;

      if (!orderId || !fileBase64 || !fileName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Upload to Cloudinary
      const cloudResult = await uploadToCloudinary(fileBase64, fileName);

      // Save URL to Neon
      const rows = await sql`
        INSERT INTO photos (order_id, step_name, photo_url, cloudinary_public_id, notes)
        VALUES (
          ${parseInt(orderId)},
          ${stepName || null},
          ${cloudResult.secure_url},
          ${cloudResult.public_id},
          ${notes || null}
        )
        RETURNING *
      `;

      return res.status(201).json(rows[0]);
    }

    // DELETE /api/upload-photo?id=123&publicId=falghe-production/xxx
    if (req.method === 'DELETE') {
      const { id, publicId } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      // Delete from Cloudinary if publicId provided
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

        await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
          method: 'POST', body: formData,
        }).catch(err => console.warn('Cloudinary delete warn:', err.message));
      }

      // Delete from Neon
      await sql`DELETE FROM photos WHERE id = ${parseInt(id)}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('upload-photo error:', err);
    return res.status(500).json({ error: err.message });
  }
}
