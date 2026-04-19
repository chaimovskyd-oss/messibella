import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('ORDER_FROM_EMAIL') || 'orders@messibella.online';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ORDER_ASSETS_BUCKET = 'order-assets';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const adminSupabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function formatCurrency(value: number) {
  return `₪${Number(value || 0).toFixed(0)}`;
}

function buildItemsHtml(items: Array<Record<string, unknown>>) {
  return items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name || ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity || 0}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${formatCurrency(Number(item.unit_price || 0))}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${formatCurrency(Number(item.line_total || 0))}</td>
    </tr>
  `).join('');
}

async function getAssetUrl(asset: Record<string, unknown>) {
  const publicFallback = typeof asset.file_url === 'string' ? asset.file_url : '';
  const filePath = typeof asset.file_path === 'string' ? asset.file_path : '';

  if (!filePath || !adminSupabase) return publicFallback;

  const { data, error } = await adminSupabase.storage
    .from(ORDER_ASSETS_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (error) {
    console.error('Failed to create signed URL for order email asset', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      filePath,
    });
    return publicFallback;
  }

  return data?.signedUrl || publicFallback;
}

async function buildAssetsHtml(assets: Array<Record<string, unknown>>) {
  if (!assets.length) return '<p>לא צורפו תמונות.</p>';

  const items = await Promise.all(assets.map(async asset => {
    const assetUrl = await getAssetUrl(asset);
    if (!assetUrl) {
      return `<li>${asset.original_filename || asset.product_name || 'קובץ'} (ללא קישור זמין)</li>`;
    }

    return `<li><a href="${assetUrl}">${asset.original_filename || asset.product_name || 'קובץ'}</a></li>`;
  }));

  return `<ul>${items.join('')}</ul>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await request.json();
    const customerEmail = payload.customerEmail as string;
    const adminEmail = payload.adminEmail as string;
    const orderNumber = payload.orderNumber as string | number;
    const items = Array.isArray(payload.items) ? payload.items : [];
    const assets = Array.isArray(payload.assets) ? payload.assets : [];

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'Missing customer email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const itemsHtml = buildItemsHtml(items);
    const assetsHtml = await buildAssetsHtml(assets);

    await sendEmail(
      customerEmail,
      `תודה על ההזמנה שלך #${orderNumber}`,
      `
        <div dir="rtl" style="font-family:Arial,sans-serif;">
          <h2>תודה על ההזמנה!</h2>
          <p>קיבלנו את ההזמנה מספר <strong>#${orderNumber}</strong> ונחזור אליך בהקדם.</p>
          <p>שם: ${payload.customerName || ''}</p>
          <p>טלפון: ${payload.phone || ''}</p>
          <p>משלוח: ${payload.shippingMethod || ''}</p>
          <p>כתובת: ${payload.address || ''}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead><tr><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">מוצר</th><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">כמות</th><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">מחיר</th><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">סה"כ</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin-top:16px;"><strong>סה"כ:</strong> ${formatCurrency(Number(payload.total || 0))}</p>
          <p>לשאלות: ${payload.sitePhone || ''} | ${payload.siteEmail || ''}</p>
        </div>
      `
    );

    if (adminEmail) {
      await sendEmail(
        adminEmail,
        `הזמנה חדשה באתר #${orderNumber}`,
        `
          <div dir="rtl" style="font-family:Arial,sans-serif;">
            <h2>התקבלה הזמנה חדשה באתר</h2>
            <p><strong>מספר הזמנה:</strong> #${orderNumber}</p>
            <p><strong>לקוח:</strong> ${payload.customerName || ''}</p>
            <p><strong>טלפון:</strong> ${payload.phone || ''}</p>
            <p><strong>מייל:</strong> ${customerEmail}</p>
            <p><strong>שיטת משלוח:</strong> ${payload.shippingMethod || ''}</p>
            <p><strong>כתובת:</strong> ${payload.address || ''}</p>
            <p><strong>הערות:</strong> ${payload.notes || '-'}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
              <thead><tr><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">מוצר</th><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">כמות</th><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">מחיר</th><th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">סה"כ</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p style="margin-top:16px;"><strong>סה"כ:</strong> ${formatCurrency(Number(payload.total || 0))}</p>
            <h3>קבצים מצורפים</h3>
            ${assetsHtml}
          </div>
        `
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-order-emails failed', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
