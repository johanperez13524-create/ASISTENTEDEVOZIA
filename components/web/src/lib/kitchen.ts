export interface KDSOrder {
  order_id: string;
  short_id: string;
  status: "new" | "preparing" | "ready";
  created_at: string;
  summary: string;
  total_cents: number;
  lines: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price_cents: number;
  }>;
}

export interface KDSCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onOrderList?: (orders: KDSOrder[]) => void;
  onOrderNew?: (order: KDSOrder) => void;
  onStatusUpdate?: (order_id: string, status: KDSOrder["status"]) => void;
}

export function createKDSSession(callbacks: KDSCallbacks = {}) {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 1000;
  let stopped = false;

  function connect() {
    if (stopped) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/kitchen`);

    ws.onopen = () => {
      reconnectDelay = 1000;
      callbacks.onConnected?.();
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "order_list":
            callbacks.onOrderList?.(msg.orders);
            break;
          case "order_new":
            callbacks.onOrderNew?.(msg.order);
            break;
          case "status_update":
            callbacks.onStatusUpdate?.(msg.order_id, msg.status);
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      callbacks.onDisconnected?.();
      if (!stopped) {
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 10000);
          connect();
        }, reconnectDelay);
      }
    };

    ws.onerror = () => ws?.close();
  }

  function disconnect() {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
  }

  return { connect, disconnect };
}

export async function updateOrderStatus(
  order_id: string,
  status: KDSOrder["status"]
): Promise<boolean> {
  try {
    const res = await fetch(`/api/orders/${order_id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
