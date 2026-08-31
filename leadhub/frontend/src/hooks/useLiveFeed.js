import { useEffect, useRef, useState } from 'react';
import { BASE } from '../api';

export default function useLiveFeed(onEvent) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('leadhub_token');
    if (!token) return;

    const source = new EventSource(`${BASE}/sse?token=${token}`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'connected') return;
        setEvents((prev) => [{ ...payload, ts: Date.now() }, ...prev].slice(0, 50));
        handlerRef.current?.(payload);
      } catch (err) {
        // ignore malformed events
      }
    };

    return () => source.close();
  }, []);

  return { connected, events };
}
