import { useEffect, useRef, useState } from "react";

export function useWebSocket(path = "/api/realtime/ws") {
  const [last, setLast] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}${path}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        setLast(JSON.parse(ev.data));
      } catch {
        /* ignore */
      }
    };
    return () => ws.close();
  }, [path]);

  const send = (obj) => {
    if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(obj));
  };

  return { last, send };
}
