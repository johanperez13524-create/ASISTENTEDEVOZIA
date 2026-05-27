<script lang="ts">
  // Svelte 5 Props
  let {
    cartLines = [],
    cartTotal = 0,
    menuItems = [],
    onAdjustStock = () => {},
  } = $props<{
    cartLines?: any[];
    cartTotal?: number;
    menuItems?: any[];
    onAdjustStock?: (productId: string, action: "increment" | "decrement" | "zero", amount?: number) => void;
  }>();

  // Tab State
  let activeTab = $state<"cart" | "inventory">("cart");

  // Format currency helper
  function formatEuros(cents: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  }

  // Capitalize helper
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
</script>

<div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative min-h-[460px] flex flex-col">
  <!-- Tab navigation headers -->
  <div class="flex border-b border-slate-800 pb-4 mb-4 justify-between items-center">
    <div class="flex space-x-2">
      <button
        onclick={() => (activeTab = "cart")}
        class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer
        {activeTab === 'cart' ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}"
      >
        🛒 Carrito ({cartLines.length})
      </button>
      <button
        onclick={() => (activeTab = "inventory")}
        class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer
        {activeTab === 'inventory' ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}"
      >
        📦 Stock del Menú ({menuItems.length})
      </button>
    </div>
  </div>

  <!-- TAB CONTENT: SHOPPING CART -->
  {#if activeTab === "cart"}
    <div class="flex-1 flex flex-col">
      {#if cartLines.length === 0}
        <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div class="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 text-slate-600 border border-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p class="text-sm font-semibold text-slate-300">Carrito vacío</p>
          <p class="text-xs text-slate-500 max-w-[200px] mt-1">
            Los artículos se añadirán aquí automáticamente cuando los solicites por voz.
          </p>
        </div>
      {:else}
        <!-- Cart list -->
        <div class="flex-1 space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {#each cartLines as item (item.product_id)}
            <div class="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
              <div class="flex items-center space-x-3">
                <img
                  src={item.image_url}
                  alt={item.name}
                  class="w-10 h-10 rounded-lg object-cover border border-slate-800"
                />
                <div>
                  <h4 class="text-xs font-semibold text-slate-200">{item.name}</h4>
                  <p class="text-[10px] text-slate-400 font-mono">
                    {item.quantity} x {formatEuros(item.unit_price_cents)}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-slate-100 font-mono">
                  {formatEuros(item.line_total_cents)}
                </span>
              </div>
            </div>
          {/each}
        </div>

        <!-- Total sum panel -->
        <div class="border-t border-slate-800 pt-4 mt-auto">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-medium text-slate-400">Total del Sandwich</span>
            <span class="text-lg font-bold text-gradient bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-mono">
              {formatEuros(cartTotal)}
            </span>
          </div>
          <p class="text-[10px] text-slate-500 text-right">
            Precios aproximados • IVA incluido
          </p>
        </div>
      {/if}
    </div>

  <!-- TAB CONTENT: STOCK INVENTORY EDITOR -->
  {:else if activeTab === "inventory"}
    <div class="flex-1 flex flex-col">
      <div class="flex-1 space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {#each menuItems as item (item.id)}
          <div class="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <div class="flex items-center space-x-2.5 min-w-0">
              <img
                src={item.image_url}
                alt={item.name}
                class="w-9 h-9 rounded-lg object-cover border border-slate-800 flex-shrink-0"
              />
              <div class="min-w-0">
                <div class="flex items-center space-x-1.5">
                  <h4 class="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                  <span class="text-[8px] uppercase px-1 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded font-mono flex-shrink-0">
                    {item.category}
                  </span>
                </div>
                <div class="flex items-center space-x-2 mt-0.5">
                  <span class="text-[10px] font-mono font-medium {item.stock === 0 ? 'text-red-400' : 'text-slate-400'}">
                    Stock: {item.stock}
                  </span>
                  <span class="text-[10px] font-mono text-slate-500">
                    {formatEuros(item.price_cents)}
                  </span>
                </div>
              </div>
            </div>

            <!-- Developer stock control buttons -->
            <div class="flex items-center space-x-1 flex-shrink-0">
              <button
                onclick={() => onAdjustStock(item.id, "decrement", 5)}
                disabled={item.stock === 0}
                class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Restar 5 de stock"
              >
                -5
              </button>
              <button
                onclick={() => onAdjustStock(item.id, "increment", 5)}
                class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                title="Sumar 5 de stock"
              >
                +5
              </button>
              <button
                onclick={() => onAdjustStock(item.id, "zero")}
                disabled={item.stock === 0}
                class="px-1.5 h-6 rounded bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 text-[9px] font-bold flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Agotar stock (0)"
              >
                Agotar
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
