<script lang="ts">
  // Svelte 5 Props
  let {
    status = "idle",
    transcript = "",
    response = "",
    cartLines = [],
    cartTotal = 0,
    volume = 0,
    order = null,
    onStart = () => {},
    onStop = () => {},
  } = $props<{
    status?: "idle" | "connecting" | "listening" | "thinking" | "speaking";
    transcript?: string;
    response?: string;
    cartLines?: any[];
    cartTotal?: number;
    volume?: number;
    order?: { order_id: string; status: string; summary: string } | null;
    onStart?: () => void;
    onStop?: () => void;
  }>();

  // Active state conditions
  let isIdle = $derived(status === "idle");
  let isConnecting = $derived(status === "connecting");
  let isListening = $derived(status === "listening");
  let isThinking = $derived(status === "thinking");
  let isSpeaking = $derived(status === "speaking");

  // Dynamic style calculations based on microphone volume (RMS level)
  let orbScale = $derived(isListening ? 1 + volume * 2.2 : 1);
  let orbGlow = $derived(isListening ? 30 + volume * 200 : 25);

  function formatEuros(cents: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  }

  function handleTrigger() {
    if (isIdle) {
      onStart();
    } else {
      onStop();
    }
  }
</script>

<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between items-center p-6 relative overflow-hidden font-sans select-none transition-all duration-300">
  
  <!-- Subtle ambient radial grid backdrop -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(203,213,225,0.4),transparent_70%)] pointer-events-none z-0"></div>
  <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

  <!-- Ambient Glow Blobs -->
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 pointer-events-none z-0 transition-all duration-500
    {isListening ? 'bg-emerald-400' : isThinking ? 'bg-indigo-400' : isSpeaking ? 'bg-fuchsia-400' : isConnecting ? 'bg-amber-400' : 'bg-violet-400'}">
  </div>

  <!-- Header Bar -->
  <header class="w-full max-w-4xl flex justify-between items-center z-10 relative">
    <div class="flex items-center space-x-2">
      <span class="text-xl">🥪</span>
      <span class="font-black text-lg tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent uppercase font-sans">
        Voice Sandwich Shop
      </span>
    </div>
    <a
      href="#/dev"
      class="px-4 py-2 bg-white/80 hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-650 hover:text-slate-900 rounded-xl backdrop-blur shadow-sm transition active:scale-95 flex items-center space-x-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>Panel Dev</span>
    </a>
  </header>

  <!-- Main Ambient 3D Voice Assistant Orb -->
  <main class="flex-1 flex flex-col justify-center items-center max-w-2xl w-full z-10 space-y-12">
    
    <div class="relative flex items-center justify-center">
      <!-- Outer glowing sound ring -->
      {#if isListening}
        <div class="absolute w-56 h-56 rounded-full border border-emerald-500/25 animate-ping opacity-60"></div>
        <div class="absolute w-44 h-44 rounded-full border-2 border-dashed border-emerald-500/40 animate-spin" style="animation-duration: 6s"></div>
      {:else if isSpeaking}
        <div class="absolute w-56 h-56 rounded-full border border-fuchsia-500/20 animate-ping"></div>
        <!-- Active Equalizer Bar Graphic -->
        <div class="absolute flex items-end space-x-1.5 -bottom-8">
          <span class="w-1.5 h-6 bg-fuchsia-500 rounded animate-bounce" style="animation-delay: 0.1s"></span>
          <span class="w-1.5 h-10 bg-indigo-500 rounded animate-bounce" style="animation-delay: 0.3s"></span>
          <span class="w-1.5 h-14 bg-fuchsia-400 rounded animate-bounce" style="animation-delay: 0.5s"></span>
          <span class="w-1.5 h-10 bg-indigo-500 rounded animate-bounce" style="animation-delay: 0.2s"></span>
          <span class="w-1.5 h-6 bg-fuchsia-500 rounded animate-bounce" style="animation-delay: 0.4s"></span>
        </div>
      {/if}

      <!-- Center Morphing Orb -->
      <button
        onclick={handleTrigger}
        class="w-36 h-36 rounded-full flex items-center justify-center shadow-3xl border border-slate-200/40 transition-all duration-300 active:scale-95 cursor-pointer relative overflow-hidden outline-none"
        style="
          transform: scale({orbScale});
          box-shadow: 0 0 {orbGlow}px rgba(
            {isListening ? '16, 185, 129' : 
             isThinking ? '99, 102, 241' : 
             isSpeaking ? '217, 70, 239' : 
             isConnecting ? '245, 158, 11' : 
             '139, 92, 246'}, 0.45
          );
          background: {
            isListening ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' :
            isThinking ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' :
            isSpeaking ? 'linear-gradient(135deg, #d946ef 0%, #6366f1 100%)' :
            isConnecting ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
            'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
          };
        "
      >
        <!-- Center Icon / Orb Animation overlay -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]"></div>
        {#if isListening}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 text-slate-950 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
          </svg>
        {:else if isThinking}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 text-white animate-spin" style="animation-duration: 2.5s" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        {:else if isSpeaking}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 112 0v5a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
          </svg>
        {:else if isConnecting}
          <svg class="animate-spin h-10 w-10 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          <!-- Tap to Order (Idle) -->
          <div class="flex flex-col items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span class="text-[9px] font-bold uppercase tracking-wider mt-1.5">PEDIR</span>
          </div>
        {/if}
      </button>
    </div>

    <!-- Active Text/Dialogue box -->
    <div class="w-full text-center min-h-[90px] px-6 flex flex-col justify-center items-center">
      {#if isIdle}
        <p class="text-slate-600 text-lg font-medium leading-relaxed">
          Presiona el círculo para iniciar tu pedido por voz 🎙️
        </p>
        <p class="text-xs text-slate-500 mt-2">
          "Me gustaría un pan ciabatta con pavo y lechuga"
        </p>
      {:else if isConnecting}
        <p class="text-amber-600 text-lg font-bold animate-pulse">
          Llamando a la Cocina...
        </p>
      {:else if isListening}
        <p class="text-slate-800 text-lg font-semibold max-w-xl italic leading-relaxed">
          {#if transcript}
            "{transcript}"
          {:else}
            Te escucho... habla ahora
          {/if}
        </p>
      {:else if isThinking}
        <p class="text-slate-500 text-lg font-medium leading-relaxed">
          El chef está pensando...
        </p>
      {:else if isSpeaking}
        <p class="text-indigo-800 text-lg font-semibold max-w-xl leading-relaxed">
          {response}
        </p>
      {/if}
    </div>

  </main>

  <!-- Floating slide-up cart panel drawer -->
  {#if cartLines.length > 0 && !order}
    <div class="w-full max-w-md bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-xl z-20 transition-all duration-300 translate-y-0 transform flex flex-col space-y-4 mb-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <span class="text-base">🛒</span>
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Tu Sandwich Actual</span>
        </div>
        <span class="px-2.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 border border-slate-200 rounded-full font-mono font-bold">
          {cartLines.length} ingredientes
        </span>
      </div>

      <!-- Ingredient Chips Horizontal scroll -->
      <div class="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {#each cartLines as item (item.product_id)}
          <div class="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-55 border border-slate-150 rounded-xl flex-shrink-0 text-xs text-slate-750 font-medium">
            <span class="font-bold text-amber-600 font-mono">{item.quantity}x</span>
            <span>{item.name}</span>
          </div>
        {/each}
      </div>

      <div class="flex justify-between items-center border-t border-slate-150 pt-3">
        <span class="text-xs font-semibold text-slate-500">Total acumulado</span>
        <span class="text-base font-black text-amber-600 font-mono">
          {formatEuros(cartTotal)}
        </span>
      </div>
    </div>
  {/if}

  <!-- ORDER SUCCESS CELEBRATION MODAL OVERLAY -->
  {#if order}
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
      <div class="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
        
        <!-- Big green glowing success circle -->
        <div class="w-20 h-20 bg-emerald-50 text-emerald-650 border border-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl font-black text-slate-800 uppercase tracking-wide">¡Orden Realizada! 🥪</h2>
          <p class="text-xs text-slate-400 font-mono">ID: {order.order_id}</p>
        </div>

        <div class="bg-slate-50 border border-slate-150 rounded-2xl p-4 w-full text-left font-sans text-xs">
          <span class="font-bold text-slate-450 uppercase text-[10px] tracking-wider font-mono">Resumen de Sandwich</span>
          <p class="text-slate-700 mt-1.5 text-sm leading-relaxed">{order.summary}</p>
        </div>

        <p class="text-xs text-slate-500 italic">
          El pan ciabatta está calentándose en la parrilla. ¡Que aproveche!
        </p>

        <!-- Tap to reset and start a new order -->
        <button
          onclick={handleTrigger}
          class="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold uppercase rounded-xl transition active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          Iniciar Nueva Orden
        </button>
      </div>
    </div>
  {/if}

  <!-- Footer bar -->
  <footer class="w-full text-center text-slate-400 text-[10px] z-10 relative">
    <p>Haz clic en el orbe o presiona el micrófono para alternar la sesión</p>
    <p class="mt-1">© 2026 Voice Sandwich Shop • AssemblyAI • LangGraph • Cartesia</p>
  </footer>

</div>
