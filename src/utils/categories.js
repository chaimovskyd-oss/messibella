export function getRootCategories(categories = []) {
  return categories.filter(category => !category.parent_id);
}

export function getChildCategories(categories = [], parentId) {
  return categories.filter(category => category.parent_id === parentId);
}

export function getDescendantCategoryIds(categories = [], categoryId) {
  const descendants = new Set([categoryId]);
  const queue = [categoryId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = categories.filter(category => category.parent_id === currentId);
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return [...descendants];
}

export function getCategoryMap(categories = []) {
  return new Map(categories.map(category => [category.id, category]));
}

export function getCategoryLineage(categories = [], categoryId) {
  const categoryMap = getCategoryMap(categories);
  const lineage = [];
  let current = categoryMap.get(categoryId);

  while (current) {
    lineage.unshift(current);
    current = current.parent_id ? categoryMap.get(current.parent_id) : null;
  }

  return lineage;
}
