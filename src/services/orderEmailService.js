import { supabase } from '@/lib/supabaseClient';
import { ADMIN_EMAIL, SITE_EMAIL, SITE_PHONE_DISPLAY } from '@/data/defaultContent';

function formatCurrency(value) {
  return `₪${Number(value || 0).toFixed(0)}`;
}

function normalizeAssets(order) {
  return (order?.items || order?.order_items || []).flatMap(item =>
    (item.order_item_assets || []).map(asset => ({
      product_name: item.product_name || item.product_name_snapshot,
      original_filename: asset.original_filename,
      file_path: asset.file_path,
      file_url: asset.file_url,
    }))
  );
}

function buildPayload(order) {
  return {
    customerEmail: order.customer_email || order.email,
    customerName: order.customer_name,
    adminEmail: ADMIN_EMAIL,
    orderNumber: order.order_number,
    phone: order.customer_phone || order.phone,
    total: order.total || order.total_price,
    notes: order.notes || '',
    shippingMethod: order.shipping_method || order.delivery_type,
    address: [
      order.shipping_address || order.address_line1,
      order.shipping_address_2 || order.address_line2,
      order.shipping_city || order.city,
      order.postal_code,
    ].filter(Boolean).join(', '),
    items: (order.items || order.order_items || []).map(item => ({
      product_name: item.product_name || item.product_name_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      sku: item.sku || '',
    })),
    assets: normalizeAssets(order),
    siteEmail: SITE_EMAIL,
    sitePhone: SITE_PHONE_DISPLAY,
  };
}

export async function sendOrderEmails(order) {
  const payload = buildPayload(order);
  console.log('Sending order emails payload', payload);

  try {
    const { data, error } = await supabase.functions.invoke('send-order-emails', {
      body: payload,
    });

    if (error) {
      console.error('Order email function failed', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Order email request crashed', {
      message: error?.message,
      payload: {
        ...payload,
        total: formatCurrency(payload.total),
      },
    });
    return null;
  }
}
