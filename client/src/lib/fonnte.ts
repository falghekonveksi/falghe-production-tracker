// WhatsApp notification via Fonnte (called server-side from Vercel functions)
export async function sendWANotification(phone: string, message: string) {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: process.env.FONNTE_TOKEN || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target: phone, message }),
  });
  return res.json();
}
