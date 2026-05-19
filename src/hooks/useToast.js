import { useState, useCallback, useEffect } from 'react';
import { _setDispatch } from '../utils/toast.js';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  // Register singleton so toast() utility works anywhere in the tree
  useEffect(() => {
    _setDispatch(add);
    return () => _setDispatch(null);
  }, [add]);

  return { toasts };
}
