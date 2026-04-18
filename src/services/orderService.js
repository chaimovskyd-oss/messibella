import { supabase } from '@/lib/supabaseClient';

const ORDERS_SCHEMA = 'public';
const ORDERS_TABLE = 'orders';

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

function ordersTable() {
  return supabase.schema(ORDERS_SCHEMA).from(ORDERS_TABLE);
}

function logSupabaseOrderError(action, error, extra = {}) {
  console.error(`Supabase orders ${action} failed`, {
    schema: ORDERS_SCHEMA,
    table: ORDERS_TABLE,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    ...extra,
  });
}

export async function createOrder(order) {
  const payload = {
    customer_name: order.customer_name,
    phone: order.phone,
    items: order.items,
    total_price: toNumber(order.total_price),
    status: order.status || 'new',
  };

  const { data, error } = await ordersTable()
    .insert([payload])
    .select()
    .single();

  if (error) {
    logSupabaseOrderError('insert', error, { payload });
    throw error;
  }

  return normalizeOrder(data);
}

export async function getOrders() {
  const { data, error } = await ordersTable()
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseOrderError('select', error);
    throw error;
  }

  return (data || []).map(normalizeOrder);
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await ordersTable()
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logSupabaseOrderError('update', error, { id, status });
    throw error;
  }

  return normalizeOrder(data);
}
