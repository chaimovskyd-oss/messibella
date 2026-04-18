import {
  getBanners,
  getCategories,
  getCoupons,
  getNavMenuItems,
  getProducts,
  getReviews,
  getShippingOptions,
} from '@/data/store';

const storagePrefix = 'masibala_local_';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function seedMap() {
  return {
    Product: getProducts(),
    Category: getCategories(),
    Banner: getBanners(),
    Review: getReviews(),
    ShippingOption: getShippingOptions(),
    Coupon: getCoupons(),
    NavMenuItem: getNavMenuItems(),
  };
}

function loadCollection(entityName) {
  const storage = getStorage();
  const defaults = clone(seedMap()[entityName] || []);

  if (!storage) return defaults;

  const existing = storage.getItem(`${storagePrefix}${entityName}`);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      storage.removeItem(`${storagePrefix}${entityName}`);
    }
  }

  storage.setItem(`${storagePrefix}${entityName}`, JSON.stringify(defaults));
  return defaults;
}

function saveCollection(entityName, items) {
  const storage = getStorage();
  if (storage) {
    storage.setItem(`${storagePrefix}${entityName}`, JSON.stringify(items));
  }
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
      return sortItems(loadCollection(entityName), sortKey);
    },
    async filter(filters, sortKey) {
      return sortItems(filterItems(loadCollection(entityName), filters), sortKey);
    },
    async create(data) {
      const items = loadCollection(entityName);
      const nextItem = {
        id: data.id || generateId(entityName),
        created_date: data.created_date || new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      };
      items.push(nextItem);
      saveCollection(entityName, items);
      return clone(nextItem);
    },
    async update(id, data) {
      const items = loadCollection(entityName);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`${entityName} ${id} not found`);
      items[index] = {
        ...items[index],
        ...data,
        updated_date: new Date().toISOString(),
      };
      saveCollection(entityName, items);
      return clone(items[index]);
    },
    async delete(id) {
      const items = loadCollection(entityName).filter(item => item.id !== id);
      saveCollection(entityName, items);
      return { success: true };
    },
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const demoUser = {
  id: 'local-user',
  full_name: 'משתמש מקומי',
  email: 'local@example.com',
  role: 'admin',
};

export const localClient = {
  entities: {
    Product: createEntityApi('Product'),
    Category: createEntityApi('Category'),
    Banner: createEntityApi('Banner'),
    Review: createEntityApi('Review'),
    ShippingOption: createEntityApi('ShippingOption'),
    Coupon: createEntityApi('Coupon'),
    NavMenuItem: createEntityApi('NavMenuItem'),
  },
  auth: {
    async me() {
      return demoUser;
    },
    redirectToLogin() {
      window.location.href = '/';
    },
    logout() {
      return Promise.resolve();
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: await fileToDataUrl(file) };
      },
    },
  },
  functions: {
    async invoke() {
      return { success: true };
    },
  },
};

export const base44 = localClient;
