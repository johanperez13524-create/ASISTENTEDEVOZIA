<script lang="ts">
  // Svelte 5 Props
  let {
    status = "idle",
    volume = 0,
    onStart = () => {},
    onStop = () => {},
  } = $props<{
    status?: "idle" | "connecting" | "listening" | "thinking" | "speaking";
    volume?: number;
    onStart?: () => void;
    onStop?: () => void;
  }>();

  // Active status checks
  let isIdle = $derived(status === "idle");
  let isConnecting = $derived(status === "connecting");
  let isListening = $derived(status === "listening");
  let isThinking = $derived(status === "thinking");
  let isSpeaking = $derived(status === "speaking");

  // Derive visual level for the dynamic meter (RMS mapped to percentage)
  let volPct = $derived(Math.min(100, Math.round(volume * 400)));

  function handleToggle() {
    if (isIdle) {
      onStart();
    } else {
      onStop();
    }
  }
</script>

<div class="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
  <!-- Dynamic Ambient Glow Background -->
  <div class="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500
    {isListening ? 'bg-emerald-500' : isThinking ? 'bg-indigo-500' : isSpeaking ? 'bg-fuchsia-500' : isConnecting ? 'bg-amber-500' : 'bg-blue-500'}">
  </div>

  <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">Controles de Voz</h3>

  <!-- Massive Mic Trigger with nested animations -->
  <div class="relative flex items-center justify-center mb-6">
    <!-- Pulse Ripple Ring 1 -->
    {#if isListening}
      <span class="absolute inline-flex h-28 w-28 rounded-full bg-emerald-500/20 animate-ping opacity-75"></span>
      <span class="absolute inline-flex h-24 w-24 rounded-full bg-emerald-500/10 animate-pulse"></span>
    {:else if isConnecting}
      <span class="absolute inline-flex h-24 w-24 rounded-full bg-amber-500/20 animate-ping"></span>
    {:else if isThinking}
      <span class="absolute inline-flex h-26 w-26 rounded-full border border-dashed border-indigo-500/40 animate-spin" style="animation-duration: 3s"></span>
    {:else if isSpeaking}
      <span class="absolute inline-flex h-28 w-28 rounded-full bg-fuchsia-500/10 animate-pulse"></span>
    {/if}

    <!-- Core Button -->
    <button
      onclick={handleToggle}
      class="relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 border-2 cursor-pointer
      {isListening ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-emerald-500/30' : 
       isThinking ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/30' :
       isSpeaking ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-fuchsia-500/30' :
       isConnecting ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-amber-500/30' : 
       'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100 shadow-slate-950/50'}"
    >
      {#if isListening}
        <!-- Mic Icon (Active) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 005.93 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
        </svg>
      {:else if isConnecting}
        <!-- Pulse Loader -->
        <svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else if isThinking}
        <!-- Brain/Thinking Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      {:else if isSpeaking}
        <!-- SoundWave Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 111.414 1.414A4.973 4.973 0 0114 10a4.973 4.973 0 01-1.414 3.828 1 1 0 11-1.414-1.414 2.973 2.973 0 00.828-2.414c0-.83-.337-1.58-.828-2.071a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      {:else}
        <!-- Mic Icon (Idle) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-slate-400 group-hover:text-slate-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      {/if}
    </button>
  </div>

  <!-- Instruction Text -->
  <div class="text-center mb-6">
    <p class="text-base font-semibold text-slate-200">
      {#if isIdle}
        Iniciar Canal de Voz
      {:else if isConnecting}
        Estableciendo Conexión...
      {:else if isListening}
        Micrófono Activo • Escuchando
      {:else if isThinking}
        Procesando tu Sandwich...
      {:else if isSpeaking}
        Asistente de Voz Hablando...
      {/if}
    </p>
    <p class="text-xs text-slate-400 mt-1">
      {#if isIdle}
        Presiona para hablar con tu asistente virtual
      {:else}
        Haz clic para colgar y detener la sesión
      {/if}
    </p>
  </div>

  <!-- Real-time dynamic volume feedback wave -->
  <div class="w-full flex flex-col space-y-2">
    <div class="flex justify-between items-center text-[10px] font-mono text-slate-400">
      <span>NIVEL MICRÓFONO</span>
      <span>{volPct}%</span>
    </div>
    
    <!-- Dynamic sound bar -->
    <div class="w-full h-3 bg-slate-950/80 border border-slate-800/80 rounded-full p-0.5 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(16,185,129,0.3)]
        {isListening ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-slate-700'}"
        style="width: {isListening ? volPct : 0}%"
      ></div>
    </div>
  </div>
</div>
