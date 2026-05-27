<script lang="ts">
  // Svelte 5 Props
  let { status = "idle" } = $props<{
    status?: "idle" | "connecting" | "listening" | "thinking" | "speaking";
  }>();

  // Derived status configuration
  let statusBadge = $derived.by(() => {
    switch (status) {
      case "connecting":
        return {
          text: "Conectando...",
          colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dotClass: "bg-amber-400 animate-pulse",
        };
      case "listening":
        return {
          text: "Escuchando Micrófono",
          colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          dotClass: "bg-emerald-400 animate-ping",
        };
      case "thinking":
        return {
          text: "Procesando Agente",
          colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          dotClass: "bg-indigo-400 animate-pulse",
        };
      case "speaking":
        return {
          text: "Sintetizando Voz",
          colorClass: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
          dotClass: "bg-fuchsia-400 animate-bounce",
        };
      default:
        return {
          text: "Sesión Inactiva",
          colorClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          dotClass: "bg-slate-500",
        };
    }
  });
</script>

<header class="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl">
  <!-- Brand Header -->
  <div class="flex items-center space-x-3">
    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    <div>
      <div class="flex items-center space-x-2">
        <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Voice Sandwich
        </h1>
        <span class="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono rounded">
          v1.0
        </span>
      </div>
      <p class="text-xs text-slate-400 font-medium">Panel de Monitoreo & Control</p>
    </div>
  </div>

  <!-- Status & Nav Actions -->
  <div class="flex items-center space-x-4">
    <!-- Live WebSocket Badging -->
    <div class="flex items-center space-x-2 border rounded-full px-3 py-1 text-xs font-medium font-sans transition-all duration-300 {statusBadge.colorClass}">
      <span class="w-2 h-2 rounded-full {statusBadge.dotClass}"></span>
      <span>{statusBadge.text}</span>
    </div>

    <!-- Dev Mode Toggle Action -->
    <a
      href="#/"
      class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition active:scale-95 shadow-md flex items-center space-x-1.5"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>Ver Cliente</span>
    </a>
  </div>
</header>
