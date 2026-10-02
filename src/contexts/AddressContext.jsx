import { createContext, useContext, useEffect, useState } from 'react';

const AddressContext = createContext();

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tm_addresses') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tm_addresses', JSON.stringify(addresses));
  }, [addresses]);

  const addAddress = (addr) => {
    setAddresses((list) => {
      const exists = list.some(
        (a) =>
          a.street === addr.street &&
          a.area === addr.area &&
          a.city === addr.city
      );
      if (exists) return list;
      return [...list, { ...addr, isDefault: list.length === 0 }];
    });
  };

  const updateAddress = (idx, addr) => {
    setAddresses((list) => {
      const next = [...list];
      next[idx] = addr;
      if (addr.isDefault) {
        next.forEach((a, i) => {
          if (i !== idx) a.isDefault = false;
        });
      }
      return next;
    });
  };

  const removeAddress = (idx) => {
    setAddresses((list) => {
      const next = list.filter((_, i) => i !== idx);
      if (next.length && !next.some((a) => a.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
  };

  const setDefault = (idx) => {
    setAddresses((list) =>
      list.map((a, i) => ({ ...a, isDefault: i === idx }))
    );
  };

  const defaultAddress =
    addresses.find((a) => a.isDefault) || addresses[0] || null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setDefault,
        defaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export const useAddresses = () => useContext(AddressContext);