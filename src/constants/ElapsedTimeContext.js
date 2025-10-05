/**
 * ElapsedTimeContext – lightweight, render-safe stopwatch state for tracking elapsed seconds.
 * Independent from GameContext. Used for timing game rounds and saving elapsed time.
 *
 * Provides:
 *  - useElapsedTime: hook for accessing elapsed time and controls
 *  - ElapsedTimeProvider: context provider
 *
 * @module ElapsedTimeContext
 * @author Sabata79
 * @since 2025-09-18
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
    // avoid redundant updates when value hasn't changed
    if (v === elapsedRef.current) return;
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
