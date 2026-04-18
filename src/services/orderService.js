import { supabase } from '@/lib/supabaseClient';
import { finalizeOrderAssetReferences, isStorageAssetReference } from '@/services/uploadService';

const ORDERS_SCHEMA = 'public';
const ORDERS_TABLE = 'orders';
const ORDER_ITEMS_TABLE = 'order_items';
const ORDER_ITEM_ASSETS_TABLE = 'order_item_assets';
const ORDER_INSERT_FIELDS = [
  'customer_name',
  'phone',
  'email',
  'address_line1',
  'address_line2',
  'city',
  'postal_code',
  'delivery_type',
  'notes',
  'total_price',
  'status',
  'source',
];
const ORDER_SELECT = `
  *,
  order_items (
    *,
    order_item_assets (*)
  )
`;

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toInteger(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeSerializable(value) {
  if (value == null) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map(sanitizeSerializable)
      .filter(item => item !== undefined);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, itemValue]) => [key, sanitizeSerializable(itemValue)])
        .filter(([, itemValue]) => itemValue !== undefined)
    );
  }
  return undefined;
}

function logSupabaseOrderError(action, error, extra = {}) {
  console.error(`Supabase order flow ${action} failed`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    schema: ORDERS_SCHEMA,
    ordersTable: ORDERS_TABLE,
    orderItemsTable: ORDER_ITEMS_TABLE,
    orderItemAssetsTable: ORDER_ITEM_ASSETS_TABLE,
    ...extra,
  });
}

function ordersTable() {
  return supabase.schema(ORDERS_SCHEMA).from(ORDERS_TABLE);
}

function orderItemsTable() {
  return supabase.schema(ORDERS_SCHEMA).from(ORDER_ITEMS_TABLE);
}

function orderItemAssetsTable() {
  return supabase.schema(ORDERS_SCHEMA).from(ORDER_ITEM_ASSETS_TABLE);
}

function normalizeAsset(asset) {
  return {
    ...asset,
    sort_order: toInteger(asset?.sort_order),
  };
}

function normalizeOrderItem(item) {
  const customizationData = isPlainObject(item?.customization_data) ? item.customization_data : {};
  const assets = Array.isArray(item?.order_item_assets) ? item.order_item_assets.map(normalizeAsset) : [];

  return {
    ...item,
    product_name: item?.product_name_snapshot || '',
    unit_price: toNumber(item?.unit_price),
    line_total: toNumber(item?.line_total),
    total_price: toNumber(item?.line_total),
    quantity: toInteger(item?.quantity),
    customization_data: customizationData,
    customizations: customizationData,
    order_item_assets: assets,
  };
}

function normalizeOrder(order) {
  const items = Array.isArray(order?.order_items)
    ? order.order_items.map(normalizeOrderItem)
    : [];

  return {
    ...order,
    customer_phone: order?.phone || '',
    customer_email: order?.email || '',
    shipping_address: order?.address_line1 || '',
    shipping_address_2: order?.address_line2 || '',
    shipping_city: order?.city || '',
    postal_code: order?.postal_code || '',
    shipping_method: order?.delivery_type || '',
    total: toNumber(order?.total_price),
    created_date: order?.created_at,
    updated_date: order?.updated_at,
    items,
    order_items: items,
  };
}

function buildOrderPayload(orderInput) {
  const {
    customer_name,
    phone,
    email,
    address_line1,
    address_line2,
    city,
    postal_code,
    delivery_type,
    notes,
    total_price,
    status,
    source,
  } = orderInput || {};

  const payload = {
    customer_name: customer_name || '',
    phone: phone || '',
    email: email || '',
    address_line1: address_line1 || '',
    address_line2: address_line2 || '',
    city: city || '',
    postal_code: postal_code || '',
    delivery_type: delivery_type || '',
    notes: notes || '',
    total_price: toNumber(total_price),
    status: status || 'new',
    source: source || 'website',
  };

  return Object.fromEntries(
    ORDER_INSERT_FIELDS
      .filter(field => Object.hasOwn(payload, field))
      .map(field => [field, payload[field]])
  );
}

function buildOrderItemPayload(orderId, cartItem) {
  const customizationData = sanitizeSerializable(cartItem.customization_data ?? cartItem.customizations ?? {}) || {};

  return {
    order_id: orderId,
    product_id: cartItem.product_id || null,
    product_name_snapshot: cartItem.product_name_snapshot || cartItem.product_name || cartItem.name || '',
    sku: cartItem.sku || '',
    unit_price: toNumber(cartItem.unit_price ?? cartItem.price),
    quantity: Math.max(1, toInteger(cartItem.quantity)),
    line_total: toNumber(cartItem.line_total ?? cartItem.total_price),
    customization_data: customizationData,
  };
}

function extractAssetReferences(value) {
  if (Array.isArray(value)) {
    return value.filter(isStorageAssetReference);
  }

  if (isStorageAssetReference(value)) {
    return [value];
  }

  return [];
}

function buildOrderItemAssetsPayload(orderItemId, cartItem) {
  const customizationData = sanitizeSerializable(cartItem.customization_data ?? cartItem.customizations ?? {}) || {};

  return Object.values(customizationData)
    .flatMap(extractAssetReferences)
    .map((asset, index) => ({
      order_item_id: orderItemId,
      file_url: asset.file_url,
      file_path: asset.file_path || '',
      file_type: asset.file_type || 'application/octet-stream',
      original_filename: asset.original_filename || `asset-${index + 1}`,
      sort_order: toInteger(asset.sort_order ?? index),
    }));
}

export async function createOrderWithItems(orderInput, cartItems) {
  const orderPayload = buildOrderPayload(orderInput);
  const {
    items,
    order_items,
    customizations,
    customization_data,
    uploaded_files,
    files,
    assets,
  } = orderInput || {};

  console.log('Supabase orders insert payload', orderPayload);
  console.log('Supabase orders excluded header fields', {
    hasItems: items !== undefined,
    hasOrderItems: order_items !== undefined,
    hasCustomizations: customizations !== undefined,
    hasCustomizationData: customization_data !== undefined,
    hasUploadedFiles: uploaded_files !== undefined || files !== undefined,
    hasAssets: assets !== undefined,
  });

  const { data: orderData, error: orderError } = await ordersTable()
    .insert([orderPayload])
    .select('*')
    .single();

  if (orderError) {
    logSupabaseOrderError('insert-order', orderError, { payload: orderPayload });
    throw orderError;
  }

  const finalizedCartItems = await Promise.all((cartItems || []).map(async (item, index) => {
    const originalCustomizationData = sanitizeSerializable(item.customization_data ?? item.customizations ?? {}) || {};
    try {
      const finalizedCustomizationData = await finalizeOrderAssetReferences(originalCustomizationData, {
        orderNumber: orderData.order_number,
        phone: orderPayload.phone,
      });

      return {
        ...item,
        customization_data: finalizedCustomizationData,
      };
    } catch (assetError) {
      logSupabaseOrderError('finalize-order-item-assets', assetError, {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        phone: orderPayload.phone,
        itemIndex: index,
        payload: originalCustomizationData,
      });
      throw assetError;
    }
  }));

  const orderItemsPayload = finalizedCartItems.map(item => buildOrderItemPayload(orderData.id, item));

  if (orderItemsPayload.length > 0) {
    const { data: insertedItems, error: itemsError } = await orderItemsTable()
      .insert(orderItemsPayload)
      .select('*');

    if (itemsError) {
      logSupabaseOrderError('insert-order-items', itemsError, {
        orderId: orderData.id,
        payload: orderItemsPayload,
      });
      throw itemsError;
    }

    const orderItemAssetsPayload = (insertedItems || []).flatMap((insertedItem, index) =>
      buildOrderItemAssetsPayload(insertedItem.id, finalizedCartItems[index] || {})
    );

    if (orderItemAssetsPayload.length > 0) {
      const { error: assetsError } = await orderItemAssetsTable().insert(orderItemAssetsPayload);

      if (assetsError) {
        logSupabaseOrderError('insert-order-item-assets', assetsError, {
          orderId: orderData.id,
          payload: orderItemAssetsPayload,
        });
        throw assetsError;
      }
    }
  }

  return getOrderById(orderData.id);
}

export async function getOrders() {
  const { data, error } = await ordersTable()
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseOrderError('select-orders', error, { payload: { select: ORDER_SELECT } });
    throw error;
  }

  return (data || []).map(normalizeOrder);
}

export async function getOrderById(orderId) {
  const { data, error } = await ordersTable()
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single();

  if (error) {
    logSupabaseOrderError('select-order-by-id', error, {
      payload: { orderId, select: ORDER_SELECT },
    });
    throw error;
  }

  return normalizeOrder(data);
}

export async function updateOrderStatus(id, status) {
  const payload = { status };
  const { data, error } = await ordersTable()
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logSupabaseOrderError('update-order-status', error, { payload: { id, ...payload } });
    throw error;
  }

  return normalizeOrder(data);
}
