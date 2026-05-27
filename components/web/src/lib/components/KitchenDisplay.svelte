<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createKDSSession, updateOrderStatus, type KDSOrder } from "../kitchen";

  // ── Reactive State ─────────────────────────────────────────────────────────
  let orders = $state<KDSOrder[]>([]);
  let connected = $state(false);
  let flashIds = $state<Set<string>>(new Set());

  // ── Derived columns ────────────────────────────────────────────────────────
  let newOrders       = $derived(orders.filter((o) => o.status === "new"));
  let preparingOrders = $derived(orders.filter((o) => o.status === "preparing"));
  let readyOrders     = $derived(orders.filter((o) => o.status === "ready"));

  // ── Helpers ────────────────────────────────────────────────────────────────
  function timeAgo(iso: string): string {
    if (!iso) return "ahora";
    const parsed = new Date(iso);
    if (isNaN(parsed.getTime())) return "ahora";
    const diff = Math.floor((Date.now() - parsed.getTime()) / 1000);
    if (diff < 60)   return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    return parsed.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  function euros(cents: number): string {
    if (cents == null || isNaN(cents)) return "0,00 €";
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
  }

  async function advance(order: KDSOrder) {
    const next = order.status === "new" ? "preparing" : "ready";
    const ok = await updateOrderStatus(order.order_id, next as KDSOrder["status"]);
    if (ok) {
      orders = orders.map((o) =>
        o.order_id === order.order_id ? { ...o, status: next as KDSOrder["status"] } : o
      );
    }
  }

  function flash(id: string) {
    flashIds = new Set([...flashIds, id]);
    setTimeout(() => {
      flashIds = new Set([...flashIds].filter((x) => x !== id));
    }, 2500);
  }

  // ── KDS WebSocket session ──────────────────────────────────────────────────
  const session = createKDSSession({
    onConnected:    () => { connected = true; },
    onDisconnected: () => { connected = false; },
    onOrderList:    (list) => { orders = list; },
    onOrderNew:     (order) => { orders = [...orders, order]; flash(order.order_id); },
    onStatusUpdate: (order_id, status) => {
      orders = orders.map((o) => o.order_id === order_id ? { ...o, status } : o);
    },
  });

  onMount(() => session.connect());
  onDestroy(() => session.disconnect());
</script>

<!-- ─────────────────────────────────────────────────────────────────────────── -->
<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col">

  <!-- Header -->
  <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <div>
        <h1 class="text-lg font-bold tracking-tight text-slate-800">Kitchen Display System</h1>
        <p class="text-xs text-slate-500">Voice Sandwich · Tiempo real</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="hidden sm:flex items-center gap-2 text-xs font-mono">
        <span class="px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-semibold">{newOrders.length} Nuevos</span>
        <span class="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-semibold">{preparingOrders.length} En prep.</span>
        <span class="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">{readyOrders.length} Listos</span>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium
        {connected
          ? 'bg-emerald-50 border-emerald-200 text-emerald-750'
          : 'bg-slate-105 border-slate-200 text-slate-500 animate-pulse'}">
        <span class="w-2 h-2 rounded-full {connected ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
        {connected ? "En vivo" : "Reconectando…"}
      </div>
      <a href="#/" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl shadow-sm transition">
        ← Demo
      </a>
    </div>
  </header>

  <!-- Kanban board -->
  <main class="flex-1 p-6 grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">

    <!-- ── Column: NUEVOS ──────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 px-1">
        <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Nuevos</h2>
        <span class="ml-auto text-xs font-mono bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-bold">{newOrders.length}</span>
      </div>

      {#each newOrders as order (order.order_id)}
        <div class="kds-card border-orange-200/80 max-w-md mx-auto w-full {flashIds.has(order.order_id) ? 'ring-2 ring-orange-400/60' : ''}">
          <!-- Card header -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="text-2xl font-black font-mono text-orange-600">#{order.short_id}</span>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">hace {timeAgo(order.created_at)}</p>
            </div>
            <span class="text-xs font-bold font-mono text-slate-500 bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-1">{euros(order.total_cents)}</span>
          </div>
          <!-- Lines -->
          <ul class="space-y-1.5 mb-4">
            {#each order.lines || [] as line}
              <li class="flex items-center gap-2 text-xs">
                <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded bg-slate-50 border border-slate-200/60 font-bold font-mono text-slate-600">{line.quantity}</span>
                <span class="text-slate-700 font-medium">{line.product_name}</span>
              </li>
            {/each}
          </ul>
          <!-- Action -->
          <button
            onclick={() => advance(order)}
            class="w-full py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 shadow-sm">
            ▶ Comenzar preparación
          </button>
        </div>
      {/each}

      {#if newOrders.length === 0}
        <div class="kds-empty">
          <span class="text-3xl mb-1">🟠</span>
          <p class="text-xs text-slate-400">Sin pedidos nuevos</p>
        </div>
      {/if}
    </div>

    <!-- ── Column: EN PREPARACIÓN ─────────────────────────────────────────── -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 px-1">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-450 animate-pulse"></span>
        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">En Preparación</h2>
        <span class="ml-auto text-xs font-mono bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold">{preparingOrders.length}</span>
      </div>

      {#each preparingOrders as order (order.order_id)}
        <div class="kds-card border-amber-200/80 max-w-md mx-auto w-full">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="text-2xl font-black font-mono text-amber-600">#{order.short_id}</span>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">hace {timeAgo(order.created_at)}</p>
            </div>
            <span class="text-xs font-bold font-mono text-slate-500 bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-1">{euros(order.total_cents)}</span>
          </div>
          <ul class="space-y-1.5 mb-4">
            {#each order.lines || [] as line}
              <li class="flex items-center gap-2 text-xs">
                <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded bg-slate-50 border border-slate-200/60 font-bold font-mono text-slate-600">{line.quantity}</span>
                <span class="text-slate-700 font-medium">{line.product_name}</span>
              </li>
            {/each}
          </ul>
          <button
            onclick={() => advance(order)}
            class="w-full py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 shadow-sm">
            ✓ Marcar como listo
          </button>
        </div>
      {/each}

      {#if preparingOrders.length === 0}
        <div class="kds-empty">
          <span class="text-3xl mb-1">🟡</span>
          <p class="text-xs text-slate-400">Nada en preparación</p>
        </div>
      {/if}
    </div>

    <!-- ── Column: LISTOS ──────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 px-1">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Listos</h2>
        <span class="ml-auto text-xs font-mono bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">{readyOrders.length}</span>
      </div>

      {#each readyOrders as order (order.order_id)}
        <div class="kds-card border-emerald-200/80 opacity-70 max-w-md mx-auto w-full">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="text-2xl font-black font-mono text-emerald-600">#{order.short_id}</span>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">hace {timeAgo(order.created_at)}</p>
            </div>
            <span class="text-xs font-bold font-mono text-slate-500 bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-1">{euros(order.total_cents)}</span>
          </div>
          <ul class="space-y-1.5 mb-4">
            {#each order.lines || [] as line}
              <li class="flex items-center gap-2 text-xs">
                <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded bg-slate-50 border border-slate-200/60 font-bold font-mono text-slate-600">{line.quantity}</span>
                <span class="text-slate-700 font-medium">{line.product_name}</span>
              </li>
            {/each}
          </ul>
          <div class="w-full py-2 rounded-xl text-xs font-bold text-center text-emerald-700 border border-emerald-200 bg-emerald-50/50">
            ✓ Entregado
          </div>
        </div>
      {/each}

      {#if readyOrders.length === 0}
        <div class="kds-empty">
          <span class="text-3xl mb-1">🟢</span>
          <p class="text-xs text-slate-400">Ninguno listo aún</p>
        </div>
      {/if}
    </div>

  </main>
</div>

<style>
  .kds-card {
    background: white;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    border-width: 1px;
    border-style: solid;
    border-radius: 1.25rem;
    padding: 1.25rem;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .kds-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  }
  .kds-empty {
    border: 1px dashed rgb(226 232 240);
    border-radius: 1rem;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    opacity: 0.8;
    background: white;
  }
</style>
