import { supabase } from '@/lib/supabaseClient';

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function buildOrderNumber(order) {
  if (!order?.id) return '';
  return `MSB-${String(order.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
}

function normalizeOrder(order) {
  return {
    ...order,
    customer_phone: order.phone || '',
    total: toNumber(order.total_price),
    created_date: order.created_at,
    order_number: buildOrderNumber(order),
    items: Array.isArray(order.items) ? order.items : [],
  };
}

export async function createOrder(order) {
  const payload = {
    customer_name: order.customer_name,
    phone: order.phone,
    items: order.items,
    total_price: toNumber(order.total_price),
    status: order.status || 'new',
  };

  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating order in Supabase:', error);
    throw error;
  }

  return normalizeOrder(data);
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders from Supabase:', error);
    throw error;
  }

  return (data || []).map(normalizeOrder);
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating order ${id} in Supabase:`, error);
    throw error;
  }

  return normalizeOrder(data);
}
