<script lang="ts">
  import { onMount } from "svelte";
  import {
    Header,
    Controls,
    PipelineCard,
    CartPanel,
    ActivityFeed,
    Console,
    VoiceExperience,
    KitchenDisplay,
  } from "./lib/components";
  import { createVoiceSession } from "./lib/websocket";

  // Svelte 5 Reactive States
  let kitchenMode = $state(
    typeof window !== "undefined" && (window.location.hash === "#/kitchen" || window.location.pathname === "/kitchen"),
  );
  let devMode = $state(
    typeof window !== "undefined" && window.location.hash === "#/dev",
  );

  let status = $state<"idle" | "connecting" | "listening" | "thinking" | "speaking">("idle");
  let transcript = $state("");
  let response = $state("");
  let cartLines = $state<any[]>([]);
  let cartTotal = $state(0);
  let menuItems = $state<any[]>([]);
  let activeTools = $state<string[]>([]);
  let logs = $state<any[]>([]);
  let activity = $state<any[]>([]);
  let order = $state<any>(null);
  let volume = $state(0);

  // Fetch menu from backend database
  async function fetchMenu() {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        menuItems = await res.json();
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  }

  // Adjust stock endpoint callback
  async function adjustStock(
    productId: string,
    action: "increment" | "decrement" | "zero",
    amount: number = 1
  ) {
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount }),
      });
      if (res.ok) {
        await fetchMenu();
      } else {
        const errData = await res.json();
        console.error("Error adjusting stock:", errData.detail);
      }
    } catch (err) {
      console.error("Error calling stock adjustment api:", err);
    }
  }

  // Initialize Voice Session with callbacks
  const voiceSession = createVoiceSession({
    onStateChange: (newStatus) => {
      status = newStatus;
      if (newStatus === "listening") {
        transcript = "";
        response = "";
        order = null; // Clear previous order state when starting new order session
      }
    },
    onTranscript: (text, isFinal) => {
      transcript = text;
      if (isFinal && text.trim()) {
        activity = [...activity, { role: "user", text, timestamp: Date.now() }];
      }
    },
    onAgentResponse: (text, isFinal) => {
      if (isFinal) {
        if (response.trim()) {
          activity = [...activity, { role: "assistant", text: response, timestamp: Date.now() }];
        }
      } else {
        response = (response + text).replace(/<\/?spell>/g, "");
      }
    },
    onToolCall: (id, name, args) => {
      activeTools = [...activeTools, name];
      activity = [
        ...activity,
        { role: "tool_call", id, name, args, timestamp: Date.now() },
      ];
    },
    onToolResult: (id, name, result) => {
      activeTools = activeTools.filter((t) => t !== name);
      let parsed = result;
      try {
        const obj = JSON.parse(result);
        if (obj && typeof obj === "object") {
          parsed = obj;
        }
      } catch (_) {}
      activity = [
        ...activity,
        { role: "tool_result", id, name, result: parsed, timestamp: Date.now() },
      ];
    },
    onCartUpdate: (cart) => {
      cartLines = cart.lines;
      cartTotal = cart.total_cents;
    },
    onMenuUpdate: (menu) => {
      menuItems = menu;
    },
    onOrderConfirm: (confirmedOrder) => {
      order = confirmedOrder;
      cartLines = [];
      cartTotal = 0;
      activity = [
        ...activity,
        { role: "system", text: `Pedido confirmado: ${confirmedOrder.order_id}`, timestamp: Date.now() },
      ];
    },
    onLog: (log) => {
      logs = [log, ...logs].slice(0, 200);
    },
    onVolumeChange: (vol) => {
      volume = vol;
    },
  });

  onMount(() => {
    const sync = (): void => {
      kitchenMode = window.location.hash === "#/kitchen" || window.location.pathname === "/kitchen";
      devMode = window.location.hash === "#/dev";
    };
    sync();
    window.addEventListener("hashchange", sync);

    // Initial stock load
    fetchMenu();

    return () => {
      window.removeEventListener("hashchange", sync);
      voiceSession.stop();
    };
  });
</script>

{#if kitchenMode}
  <!-- Kitchen Display System -->
  <KitchenDisplay />
{:else if devMode}
  <!-- Developer Mode Grid Layout -->
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-300">
    <div class="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col space-y-6">
      <Header {status} />
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        <!-- Left Panel: Pipeline, Audio Controls, Console Logs -->
        <div class="lg:col-span-5 space-y-6">
          <Controls
            {status}
            {volume}
            onStart={() => voiceSession.start()}
            onStop={() => voiceSession.stop()}
          />
          <PipelineCard {status} {activeTools} />
          <Console {logs} onClear={() => (logs = [])} />
        </div>

        <!-- Right Panel: Menu, Cart, Activity Feed -->
        <div class="lg:col-span-7 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CartPanel {cartLines} {cartTotal} {menuItems} onAdjustStock={adjustStock} />
            <ActivityFeed {activity} />
          </div>
        </div>
      </div>
      
      <p class="text-center text-sm py-4">
        <a
          class="text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-slate-400 underline-offset-4 transition"
          href="#/"
        >
          ← Regresar a la experiencia de usuario de voz
        </a>
      </p>
    </div>
  </div>
{:else}
  <!-- Customer Voice Experience Screen -->
  <VoiceExperience
    {status}
    {transcript}
    {response}
    {cartLines}
    {cartTotal}
    {volume}
    {order}
    onStart={() => voiceSession.start()}
    onStop={() => voiceSession.stop()}
  />
{/if}
