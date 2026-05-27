<script lang="ts">
  // Svelte 5 Props
  let {
    status = "idle",
    activeTools = [],
  } = $props<{
    status?: "idle" | "connecting" | "listening" | "thinking" | "speaking";
    activeTools?: string[];
  }>();

  // Active status derivations
  let isListening = $derived(status === "listening");
  let isThinking = $derived(status === "thinking");
  let isSpeaking = $derived(status === "speaking");
  let isAnyActive = $derived(status !== "idle" && status !== "connecting");
</script>

<div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
  <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center justify-between">
    <span>Pipeline del Agente de Voz</span>
    {#if isAnyActive}
      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
        EN PROCESO
      </span>
    {:else}
      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700">
        EN ESPERA
      </span>
    {/if}
  </h3>

  <!-- Pipeline nodes flex container -->
  <div class="flex flex-col md:flex-row md:items-center justify-between relative space-y-6 md:space-y-0 md:space-x-4">
    
    <!-- 1. STT Node -->
    <div class="flex-1 flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 relative z-10
      {isListening ? 'bg-emerald-500/5 border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'bg-slate-950/40 border-slate-800/60 text-slate-500'}"
    >
      <div class="w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors duration-300
        {isListening ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' : 'bg-slate-800 text-slate-400'}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
      <span class="text-xs font-bold uppercase tracking-wide {isListening ? 'text-emerald-400' : 'text-slate-400'}">STT</span>
      <span class="text-[10px] font-mono mt-1 text-slate-400">AssemblyAI</span>
      <p class="text-[10px] text-center mt-2 font-medium">
        {#if isListening}
          Transcribiendo Audio...
        {:else}
          Canal Inactivo
        {/if}
      </p>
    </div>

    <!-- Connecting line 1 (STT -> LLM) -->
    <div class="hidden md:block w-8 h-[2px] bg-slate-800 relative">
      {#if isListening || isThinking}
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-indigo-500 animate-pulse"></div>
      {/if}
    </div>

    <!-- 2. AGENT (LLM) Node -->
    <div class="flex-1 flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 relative z-10
      {isThinking ? 'bg-indigo-500/5 border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'bg-slate-950/40 border-slate-800/60 text-slate-500'}"
    >
      <div class="w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors duration-300
        {isThinking ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-800 text-slate-400'}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <span class="text-xs font-bold uppercase tracking-wide {isThinking ? 'text-indigo-400' : 'text-slate-400'}">AGENT</span>
      <span class="text-[10px] font-mono mt-1 text-slate-400">LangGraph</span>
      
      <div class="mt-2 text-center w-full min-h-[20px] flex flex-col items-center">
        {#if isThinking}
          {#if activeTools.length > 0}
            <div class="flex flex-wrap gap-1 justify-center max-w-full">
              {#each activeTools as tool}
                <span class="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] rounded font-mono animate-pulse">
                  {tool}()
                </span>
              {/each}
            </div>
          {:else}
            <span class="text-[10px] text-indigo-400 animate-pulse font-medium">Razonando respuesta...</span>
          {/if}
        {:else}
          <span class="text-[10px] text-slate-500">En espera</span>
        {/if}
      </div>
    </div>

    <!-- Connecting line 2 (LLM -> TTS) -->
    <div class="hidden md:block w-8 h-[2px] bg-slate-800 relative">
      {#if isThinking || isSpeaking}
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 animate-pulse"></div>
      {/if}
    </div>

    <!-- 3. TTS Node -->
    <div class="flex-1 flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 relative z-10
      {isSpeaking ? 'bg-fuchsia-500/5 border-fuchsia-500/40 shadow-lg shadow-fuchsia-500/5' : 'bg-slate-950/40 border-slate-800/60 text-slate-500'}"
    >
      <div class="w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors duration-300
        {isSpeaking ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/30' : 'bg-slate-800 text-slate-400'}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </div>
      <span class="text-xs font-bold uppercase tracking-wide {isSpeaking ? 'text-fuchsia-400' : 'text-slate-400'}">TTS</span>
      <span class="text-[10px] font-mono mt-1 text-slate-400">Cartesia</span>
      <p class="text-[10px] text-center mt-2 font-medium">
        {#if isSpeaking}
          Transmitiendo Audio...
        {:else}
          En espera
        {/if}
      </p>
    </div>

  </div>
</div>
