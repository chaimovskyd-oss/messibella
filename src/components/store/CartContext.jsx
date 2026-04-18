import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('masibala_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('masibala_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity, customizations) => {
    setCart(prev => {
      const key = `${product.id}_${JSON.stringify(customizations)}`;
      const existing = prev.find(item => item.key === key);
      if (existing) {
        return prev.map(item =>
          item.key === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        key,
        product_id: product.id,
        product_name: product.name,
        main_image: product.main_image,
        base_price: product.base_price,
        quantity_discounts: product.quantity_discounts || [],
        quantity,
        customizations
      }];
    });
  };

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setCart(prev => prev.map(item =>
      item.key === key ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (key) => {
    setCart(prev => prev.filter(item => item.key !== key));
  };

  const clearCart = () => setCart([]);

  const getDiscountedPrice = (item) => {
    const discounts = item.quantity_discounts || [];
    let discount = 0;
    for (const d of discounts) {
      if (item.quantity >= d.min_qty && (!d.max_qty || item.quantity <= d.max_qty)) {
        discount = d.discount_percent;
      }
    }
    return item.base_price * (1 - discount / 100);
  };

  const getItemTotal = (item) => {
    return getDiscountedPrice(item) * item.quantity;
  };

  const cartTotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateQuantity, removeFromCart, clearCart,
      getDiscountedPrice, getItemTotal, cartTotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}