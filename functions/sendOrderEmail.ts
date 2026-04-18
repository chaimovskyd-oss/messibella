import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { order } = await req.json();

  const adminEmail = Deno.env.get('ADMIN_EMAIL');
  if (!adminEmail) {
    return Response.json({ error: 'ADMIN_EMAIL not set' }, { status: 500 });
  }

  // Build items HTML
  const itemsHtml = (order.items || []).map(item => {
    const customLines = Object.entries(item.customizations || {}).map(([k, v]) => {
      let display = v;
      // Try parse JSON array (multi-image)
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr)) {
          display = arr.map((url, i) => `<a href="${url}" target="_blank">תמונה ${i + 1}</a>`).join(' | ');
          return `<div style="color:#555;font-size:13px;margin-top:4px"><strong>${k}:</strong> ${display}</div>`;
        }
      } catch (_) {}
      // Names list (newline separated)
      if (typeof v === 'string' && v.includes('\n')) {
        const names = v.split('\n').filter(n => n.trim());
        display = '<ol style="margin:4px 0 0 0;padding-right:20px">' + names.map(n => `<li>${n}</li>`).join('') + '</ol>';
        return `<div style="color:#555;font-size:13px;margin-top:4px"><strong>${k}:</strong>${display}</div>`;
      }
      return `<div style="color:#555;font-size:13px;margin-top:4px"><strong>${k}:</strong> ${v}</div>`;
    }).join('');

    return `
      <div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between">
          <strong>${item.product_name} × ${item.quantity}</strong>
          <strong>₪${item.total_price?.toFixed(0)}</strong>
        </div>
        ${customLines}
      </div>`;
  }).join('');

  // Collect all uploaded images across all items
  const allImages = [];
  (order.items || []).forEach(item => {
    Object.entries(item.customizations || {}).forEach(([k, v]) => {
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr)) {
          arr.forEach((url, i) => allImages.push({ label: `${item.product_name} – ${k} #${i + 1}`, url }));
        }
      } catch (_) {}
      if (typeof v === 'string' && v.startsWith('http') && (v.includes('.jpg') || v.includes('.png') || v.includes('.jpeg') || v.includes('.webp'))) {
        allImages.push({ label: `${item.product_name} – ${k}`, url: v });
      }
    });
  });

  const imagesSection = allImages.length > 0 ? `
    <div style="margin-top:20px">
      <h3 style="color:#B68AD8">תמונות שהועלו (${allImages.length})</h3>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px">
        ${allImages.map(img => `
          <div style="text-align:center">
            <a href="${img.url}" target="_blank">
              <img src="${img.url}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #ddd" />
            </a>
            <div style="font-size:11px;color:#666;margin-top:4px">${img.label}</div>
            <a href="${img.url}" download style="font-size:11px;color:#B68AD8">הורדה</a>
          </div>`).join('')}
      </div>
    </div>` : '';

  const shippingMethod = order.shipping_method === 'delivery' ? 'משלוח עד הבית' :
    order.shipping_method === 'pickup_point' ? 'נקודת איסוף' : 'איסוף עצמי';

  const body = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222">
      <div style="background:linear-gradient(135deg,#B68AD8,#F5B731);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0">🎉 הזמנה חדשה התקבלה!</h1>
        <p style="color:white;margin:8px 0 0">מספר הזמנה: <strong>${order.order_number}</strong></p>
      </div>
      <div style="background:#fff;border:1px solid #eee;border-radius:0 0 12px 12px;padding:24px">
        
        <h3 style="color:#B68AD8">פרטי לקוח</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:4px 0;color:#555;width:120px">שם:</td><td><strong>${order.customer_name}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#555">טלפון:</td><td><strong>${order.customer_phone}</strong></td></tr>
          ${order.customer_email ? `<tr><td style="padding:4px 0;color:#555">אימייל:</td><td>${order.customer_email}</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#555">משלוח:</td><td>${shippingMethod}</td></tr>
          ${order.shipping_address ? `<tr><td style="padding:4px 0;color:#555">כתובת:</td><td>${order.shipping_address}, ${order.shipping_city || ''}</td></tr>` : ''}
          ${order.notes ? `<tr><td style="padding:4px 0;color:#555">הערות:</td><td><strong style="color:#e07b00">${order.notes}</strong></td></tr>` : ''}
        </table>

        <h3 style="color:#B68AD8;margin-top:20px">פריטים</h3>
        ${itemsHtml}

        <div style="background:#f9f6ff;border-radius:8px;padding:16px;margin-top:16px">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span>סכום ביניים</span><span>₪${order.subtotal?.toFixed(0)}</span>
          </div>
          ${order.discount_amount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:14px;color:green;margin-bottom:6px"><span>הנחה</span><span>-₪${order.discount_amount?.toFixed(0)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span>משלוח</span><span>₪${order.shipping_cost?.toFixed(0)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;border-top:1px solid #ddd;padding-top:10px;margin-top:6px">
            <span>סה"כ</span><span style="color:#B68AD8">₪${order.total?.toFixed(0)}</span>
          </div>
        </div>

        ${imagesSection}
      </div>
    </div>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: adminEmail,
    subject: `הזמנה חדשה #${order.order_number} – ${order.customer_name}`,
    body,
  });

  return Response.json({ success: true });
});