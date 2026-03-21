// store/useCart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number | string) => void;
  clearCart: () => void;
  getSubTotal: () => number;
  getTax: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clearCart: () => set({ items: [] }),
      getSubTotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
      getTax: () => get().getSubTotal() * 0.16, // 16% VAT for Jordan (JD)
      getTotalPrice: () => get().getSubTotal() + get().getTax(),
    }),
    {
      name: 'xian-cart-storage', // Persist cart in local storage
    }
  )
);