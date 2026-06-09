import { useEffect } from "react";

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
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    // Start initial timer
    resetTimer();

    // Listen to user interactions
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeoutMs, onTimeout, enabled]);
}
