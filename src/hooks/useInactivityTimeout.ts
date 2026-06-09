import { useEffect, useRef } from "react";

interface UseInactivityTimeoutProps {
  timeoutMs?: number;
  onTimeout: () => void;
  enabled?: boolean;
}

export function useInactivityTimeout({
  timeoutMs = 120000,
  onTimeout,
  enabled = true,
}: UseInactivityTimeoutProps) {
  // Keep a stable ref to always call the latest version of onTimeout
  // without re-registering event listeners on every render
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onTimeoutRef.current();
      }, timeoutMs);
    };

    // Start initial timer
    resetTimer();

    // Listen to user interactions
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeoutMs, enabled]); // onTimeout intentionally omitted — tracked via ref
}
