// src/constants/ElapsedTimeContext.js
/**
 * ElapsedTimeContext — lightweight, render-safe stopwatch state.
 * Ei riipu GameContextista.
 */
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';

const ElapsedTimeContext = createContext(null);

export const useElapsedTime = () => {
  const ctx = useContext(ElapsedTimeContext);
  if (!ctx) {
    throw new Error('useElapsedTime must be used within an ElapsedTimeProvider');
  }
  return ctx;
};

export function ElapsedTimeProvider({ children }) {
  const [elapsedTime, _setElapsedTime] = useState(0);
  const elapsedRef = useRef(0);

  const setElapsedTime = useCallback((next) => {
    const v = typeof next === 'function' ? next(elapsedRef.current) : next;
    elapsedRef.current = v;
    _setElapsedTime(v);
  }, []);

  const getElapsedTime = useCallback(() => elapsedRef.current, []);

  const value = useMemo(
    () => ({ elapsedTime, setElapsedTime, getElapsedTime }),
    [elapsedTime, setElapsedTime, getElapsedTime]
  );

  return (
    <ElapsedTimeContext.Provider value={value}>
      {children}
    </ElapsedTimeContext.Provider>
  );
}

export default ElapsedTimeContext;
