<script lang="ts">
  // Svelte 5 Props
  let {
    activity = [],
  } = $props<{
    activity?: any[];
  }>();

  let feedElement = $state<HTMLDivElement | null>(null);

  // Auto scroll to bottom when new events arrive
  $effect(() => {
    if (activity.length && feedElement) {
      setTimeout(() => {
        feedElement!.scrollTo({
          top: feedElement!.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  });

  // Helper to format timestamp
  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
</script>

<div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative min-h-[460px] flex flex-col">
  <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-800 pb-4">
    Actividad de Conversación
  </h3>

  <!-- Chat & logs container scrollable -->
  <div
    bind:this={feedElement}
    class="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-1 scrollbar-thin"
  >
    {#if activity.length === 0}
      <div class="h-full flex flex-col items-center justify-center text-center p-8">
        <div class="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 text-slate-600 border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p class="text-sm font-semibold text-slate-300">Sin conversación activa</p>
        <p class="text-xs text-slate-500 max-w-[200px] mt-1">
          Las transcripciones del cliente y del agente aparecerán en tiempo real.
        </p>
      </div>
    {:else}
      {#each activity as item, index (index)}
        <!-- Render USER TURN -->
        {#if item.role === "user"}
          <div class="flex flex-col items-end space-y-1">
            <span class="text-[9px] text-slate-500 font-mono">{formatTime(item.timestamp)} • Cliente</span>
            <div class="max-w-[85%] bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs shadow-md">
              {item.text}
            </div>
          </div>

        <!-- Render ASSISTANT TURN -->
        {:else if item.role === "assistant"}
          <div class="flex flex-col items-start space-y-1">
            <span class="text-[9px] text-slate-500 font-mono">{formatTime(item.timestamp)} • Asistente</span>
            <div class="max-w-[85%] bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs shadow-md border border-slate-700/60">
              {item.text}
            </div>
          </div>

        <!-- Render TOOL CALL -->
        {:else if item.role === "tool_call"}
          <div class="flex flex-col items-start space-y-1 pl-2 border-l border-indigo-500/40">
            <span class="text-[9px] text-indigo-400 font-mono flex items-center space-x-1">
              <span>⚡</span>
              <span>Llamada de Herramienta</span>
            </span>
            <div class="bg-indigo-950/40 border border-indigo-900/40 rounded-xl p-3 w-full font-mono text-[10px] text-indigo-300">
              <span class="font-bold text-indigo-400">{item.name}</span>({JSON.stringify(item.args, null, 1)})
            </div>
          </div>

        <!-- Render TOOL RESULT -->
        {:else if item.role === "tool_result"}
          <div class="flex flex-col items-start space-y-1 pl-2 border-l border-emerald-500/40">
            <span class="text-[9px] text-emerald-400 font-mono flex items-center space-x-1">
              <span>✅</span>
              <span>Resultado de Herramienta</span>
            </span>
            <div class="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 w-full font-mono text-[10px] text-emerald-300 overflow-x-auto">
              {#if typeof item.result === 'object'}
                <div class="text-[9px]">
                  <span class="text-slate-400">tipo:</span> "{item.result.kind}" • 
                  <span class="text-slate-400">mensaje:</span> "{item.result.message}"
                </div>
              {:else}
                {item.result}
              {/if}
            </div>
          </div>

        <!-- Render SYSTEM UPDATE -->
        {:else if item.role === "system"}
          <div class="flex items-center justify-center py-2">
            <span class="px-3 py-1 bg-slate-950/80 border border-slate-800 text-slate-400 rounded-full font-mono text-[9px] uppercase tracking-wider animate-pulse">
              🎉 {item.text}
            </span>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>
