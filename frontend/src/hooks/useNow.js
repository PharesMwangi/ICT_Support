import {useState, useEffect} from "react";

/* Re-renders once a minute so "2h 10m left" stays fresh. The server sends remainingMs at
 fetch time, so we remove the time that passed since then.*/
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}