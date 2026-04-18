import { ADMIN_EMAIL } from '@/data/defaultContent';
import { getCollection, saveCollection, uploadSiteAsset } from '@/services/siteContentService';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compareValues(left, right, descending) {
  if (left == null && right == null) return 0;
  if (left == null) return descending ? 1 : -1;
  if (right == null) return descending ? -1 : 1;

  if (typeof left === 'number' && typeof right === 'number') {
    return descending ? right - left : left - right;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);
  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return descending ? rightDate - leftDate : leftDate - rightDate;
  }

  return descending
    ? String(right).localeCompare(String(left), 'he')
    : String(left).localeCompare(String(right), 'he');
}

function sortItems(items, sortKey) {
  if (!sortKey) return [...items];
  const descending = String(sortKey).startsWith('-');
  const key = descending ? String(sortKey).slice(1) : String(sortKey);
  return [...items].sort((a, b) => compareValues(a[key], b[key], descending));
}

function filterItems(items, filters = {}) {
  return items.filter(item =>
    Object.entries(filters).every(([key, expected]) => {
      if (expected == null || expected === '') return true;
      return item[key] === expected;
    })
  );
}

function generateId(entityName) {
  return `${entityName.toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEntityApi(entityName) {
  return {
    async list(sortKey) {
      return sortItems(await getCollection(entityName), sortKey);
    },
    async filter(filters, sortKey) {
      return sortItems(filterItems(await getCollection(entityName), filters), sortKey);
    },
    async create(data) {
      const items = await getCollection(entityName);
      const nextItem = {
        id: data.id || generateId(entityName),
        created_date: data.created_date || new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      };
      const nextItems = [...items, nextItem];
      await saveCollection(entityName, nextItems);
      return clone(nextItem);
    },
    async update(id, data) {
      const items = await getCollection(entityName);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`${entityName} ${id} not found`);

      const nextItems = [...items];
      nextItems[index] = {
        ...nextItems[index],
        ...data,
        updated_date: new Date().toISOString(),
      };

      await saveCollection(entityName, nextItems);
      return clone(nextItems[index]);
    },
    async delete(id) {
      const nextItems = (await getCollection(entityName)).filter(item => item.id !== id);
      await saveCollection(entityName, nextItems);
      return { success: true };
    },
  };
}

export const localClient = {
  entities: {
    Product: createEntityApi('Product'),
    Category: createEntityApi('Category'),
    Banner: createEntityApi('Banner'),
    Review: createEntityApi('Review'),
    ShippingOption: createEntityApi('ShippingOption'),
    Coupon: createEntityApi('Coupon'),
    NavMenuItem: createEntityApi('NavMenuItem'),
    BlogPost: createEntityApi('BlogPost'),
    GalleryItem: createEntityApi('GalleryItem'),
  },
  auth: {
    async me() {
      return {
        id: 'local-admin',
        full_name: 'מסיבלה',
        email: ADMIN_EMAIL,
        role: 'admin',
      };
    },
    redirectToLogin() {
      window.location.href = '/AdminLogin';
    },
    logout() {
      return Promise.resolve();
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file, folder }) {
        const asset = await uploadSiteAsset(file, folder);
        return { file_url: asset.file_url, ...asset };
      },
    },
  },
  functions: {
    async invoke(functionName, { body } = {}) {
      console.warn(`Legacy function invoke called for ${functionName}.`, body);
      return { success: true };
    },
  },
};

export const base44 = localClient;
