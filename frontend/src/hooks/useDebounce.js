import { useState, useEffect } from 'react';

/**
 * Debounce a value change.
 * Returns the debounced value after the specified delay.
 *
 * @param {*} value - The value to debounce.
 * @param {number} [delay=400] - Debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
