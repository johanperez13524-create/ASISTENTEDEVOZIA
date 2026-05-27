<script lang="ts">
  // Svelte 5 Props
  let {
    logs = [],
    onClear = () => {},
  } = $props<{
    logs?: any[];
    onClear?: () => void;
  }>();

  let consoleElement = $state<HTMLDivElement | null>(null);

  // Auto scroll console to bottom on new logs
  $effect(() => {
    if (logs.length && consoleElement) {
      setTimeout(() => {
        consoleElement!.scrollTo({
          top: consoleElement!.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  });

  // Clean raw payloads for clean printing
  function cleanPayload(log: any): string {
    const p = log.payload;
    if (!p || typeof p !== "object") return String(p);

    // Deep clone to prevent mutating original
    const cloned = JSON.parse(JSON.stringify(p));

    // Hide huge binary raw audio chunks
    if (cloned.audio && typeof cloned.audio === "string") {
      cloned.audio = `[base64 audio bytes... ${Math.round(cloned.audio.length / 1024)} KB]`;
    }

    return JSON.stringify(cloned);
  }
</script>

<div class="bg-slate-950 border border-slate-800/80 rounded-3xl p-5 shadow-2xl relative flex flex-col h-[280px] overflow-hidden font-mono text-[10px]">
  
  <!-- Console Header with Clear Button -->
  <div class="flex justify-between items-center border-b border-slate-800 pb-3 mb-3 flex-shrink-0">
    <div class="flex items-center space-x-2">
      <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
      <span class="text-slate-400 font-bold text-xs uppercase ml-2 tracking-wider">// SYSTEM CONSOLE</span>
    </div>
    
    <button
      onclick={onClear}
      class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 rounded-lg transition active:scale-95 cursor-pointer flex items-center space-x-1"
      title="Limpiar Consola"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span>Limpiar</span>
    </button>
  </div>

  <!-- Terminal scrolling console body -->
  <div
    bind:this={consoleElement}
    class="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin text-slate-300"
  >
    {#if logs.length === 0}
      <div class="text-slate-600 italic">// Consola lista. Esperando transmisiones del servidor...</div>
    {:else}
      <!-- Show in reverse chronological order for terminal flow (new at bottom) -->
      {#each [...logs].reverse() as log, index (index)}
        <div class="leading-relaxed hover:bg-slate-900/50 rounded px-1 transition duration-75">
          <span class="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
          
          {#if log.direction === "in"}
            <span class="text-cyan-400 font-bold">➔ [IN]</span>
          {:else}
            <span class="text-fuchsia-400 font-bold">⬅ [OUT]</span>
          {/if}

          <span class="text-slate-400 font-medium">{log.type}:</span>
          <span class="text-slate-300 break-all">{cleanPayload(log)}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
