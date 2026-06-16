'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [products, setProducts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cat_driver_products');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [cart, setCart] = useState({}); // { product_id: quantity }
  const [loading, setLoading] = useState(true);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [unitTranslations, setUnitTranslations] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cat_driver_units');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return {};
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cat_driver_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
    }
    setIsCartLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem('cat_driver_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart, isCartLoaded]);

  // Fetch actual products and unit translations from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) {
        setProducts(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cat_driver_products', JSON.stringify(data));
        }
      }
      setLoading(false);
    };

    const fetchUnits = async () => {
      const { data, error } = await supabase.from('product_units').select('*');
      if (data) {
        const trans = {};
        data.forEach(u => {
          trans[u.code] = u.name_ar;
        });
        setUnitTranslations(trans);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cat_driver_units', JSON.stringify(trans));
        }
      }
    };
    
    fetchProducts();
    fetchUnits();

    // Listen to changes on the products table to update prices instantly
    const channel = supabase
      .channel('realtime_prices')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setProducts(currentProducts => 
          currentProducts.map(p => {
            if (p.id === payload.new.id) {
              return { 
                ...p, 
                current_price: payload.new.current_price,
                is_offer: payload.new.is_offer,
                offer_label: payload.new.offer_label,
                offer_color: payload.new.offer_color
              };
            }
            return p;
          })
        );
      })
      .subscribe();

    // Listen to changes on product_units table
    const unitsChannel = supabase
      .channel('realtime_units')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_units' }, (payload) => {
        fetchUnits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(unitsChannel);
    };
  }, []);

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      
      if (newQty === 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = newQty;
      }
      
      return newCart;
    });
  };

  const removeItem = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  
  // Create an array of cart items enriched with product details
  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return {
      product_id: productId,
      quantity,
      price: product ? product.current_price : 0,
      name: product ? product.name : 'Unknown',
      unit_type: product ? product.unit_type : '',
      is_offer: product ? product.is_offer : false,
      offer_label: product ? product.offer_label : '',
      offer_color: product ? product.offer_color : ''
    };
  }).filter(item => item.name !== 'Unknown');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      products,
      cart,
      cartItems,
      loading,
      updateQuantity,
      removeItem,
      clearCart,
      cartItemsCount,
      subtotal,
      unitTranslations
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
