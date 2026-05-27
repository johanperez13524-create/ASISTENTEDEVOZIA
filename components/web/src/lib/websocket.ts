export interface VoiceSessionCallbacks {
  onStateChange?: (state: "idle" | "connecting" | "listening" | "thinking" | "speaking") => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAgentResponse?: (text: string, isFinal: boolean) => void;
  onToolCall?: (id: string, name: string, args: any) => void;
  onToolResult?: (id: string, name: string, result: any) => void;
  onCartUpdate?: (cart: { lines: any[]; total_cents: number }) => void;
  onMenuUpdate?: (menu: any[]) => void;
  onOrderConfirm?: (order: { order_id: string; status: string; summary: string }) => void;
  onLog?: (log: { type: string; direction: "in" | "out"; timestamp: number; payload: any }) => void;
  onVolumeChange?: (volume: number) => void;
}

export function createVoiceSession(callbacks: VoiceSessionCallbacks = {}) {
  let ws: WebSocket | null = null;
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let outputAudioContext: AudioContext | null = null;
  
  // Audio Queue scheduling variables for smooth Cartesia playback
  let nextPlayTime = 0;
  let activeAudioSources: AudioBufferSourceNode[] = [];

  const safeEmit = <K extends keyof VoiceSessionCallbacks>(
    key: K,
    ...args: Parameters<NonNullable<VoiceSessionCallbacks[K]>>
  ) => {
    try {
      const cb = callbacks[key];
      if (cb) {
        (cb as any)(...args);
      }
    } catch (e) {
      console.error(`Error emitting callback ${key}:`, e);
    }
  };

  const emitLog = (type: string, direction: "in" | "out", payload: any) => {
    safeEmit("onLog", {
      type,
      direction,
      timestamp: Date.now(),
      payload,
    });
  };

  async function start() {
    console.log("Iniciando sesión de voz...");
    safeEmit("onStateChange", "connecting");
    emitLog("session_start", "out", { message: "Iniciando conexión..." });

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Vite proxy resolves '/ws' correctly during development, and main.py serves it in production
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = async () => {
      console.log("WebSocket conectado. Solicitando micrófono...");
      safeEmit("onStateChange", "listening");
      emitLog("ws_connected", "in", { message: "Conectado al servidor WebSocket" });

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const TARGET_SAMPLE_RATE = 16000;
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        const source = audioContext.createMediaStreamSource(stream);

        processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        // ScriptProcessor must connect to destination to run, but gain=0 = inaudible (no echo)
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        processor.connect(silentGain);
        silentGain.connect(audioContext.destination);

        const inputRate = audioContext.sampleRate;

        function downsampleTo16k(input: Float32Array): Float32Array {
          if (inputRate === TARGET_SAMPLE_RATE) return input;
          const ratio = inputRate / TARGET_SAMPLE_RATE;
          const outLen = Math.max(1, Math.floor(input.length / ratio));
          const out = new Float32Array(outLen);
          for (let i = 0; i < outLen; i++) {
            out[i] = input[Math.min(input.length - 1, Math.floor(i * ratio))];
          }
          return out;
        }

        let frameCount = 0;
        processor.onaudioprocess = (e) => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            const float32Array = downsampleTo16k(e.inputBuffer.getChannelData(0));

            let sum = 0;
            for (let i = 0; i < float32Array.length; i++) {
              sum += float32Array[i] * float32Array[i];
            }
            const rms = Math.sqrt(sum / float32Array.length);
            safeEmit("onVolumeChange", rms);

            const int16Array = new Int16Array(float32Array.length);
            for (let i = 0; i < float32Array.length; i++) {
              int16Array[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
            }

            ws.send(int16Array.buffer);
            
            if (frameCount % 100 === 0) {
              emitLog("audio_chunk_sent", "out", { frame: frameCount, length: int16Array.length });
            }
            frameCount++;
          }
        };
      } catch (err) {
        console.error("Error al acceder al micrófono:", err);
        emitLog("mic_error", "in", { error: String(err) });
        safeEmit("onStateChange", "idle");
      }
    };

    // Output context to play Cartesia audio at 24kHz
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    nextPlayTime = 0;
    activeAudioSources = [];

    ws.onmessage = async (e) => {
      if (typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          emitLog(msg.type || "unknown_event", "in", msg);

          switch (msg.type) {
            case "stt_chunk":
              safeEmit("onTranscript", msg.transcript, false);
              break;

            case "stt_output":
              safeEmit("onTranscript", msg.transcript, true);
              safeEmit("onStateChange", "thinking");
              break;

            case "agent_chunk":
              safeEmit("onAgentResponse", msg.text, false);
              break;

            case "agent_end":
              safeEmit("onAgentResponse", "", true);
              safeEmit("onStateChange", "speaking");
              break;

            case "tool_call":
              safeEmit("onToolCall", msg.id, msg.name, msg.args);
              break;

            case "tool_result":
              safeEmit("onToolResult", msg.toolCallId, msg.name, msg.result);
              
              // Try to parse the rich result JSON string from the backend
              try {
                const parsed = JSON.parse(msg.result);
                if (parsed && typeof parsed === "object") {
                  if (parsed.kind === "cart") {
                    safeEmit("onCartUpdate", {
                      lines: parsed.lines || [],
                      total_cents: parsed.total_cents || 0,
                    });
                  } else if (parsed.kind === "menu") {
                    safeEmit("onMenuUpdate", parsed.menu || []);
                  } else if (parsed.kind === "order" && parsed.order) {
                    safeEmit("onOrderConfirm", parsed.order);
                  }
                }
              } catch (_) {
                // Result was not JSON, ignore parsing
              }
              break;

            case "tts_chunk":
              if (msg.audio && outputAudioContext) {
                // Decode base64 PCM 24kHz
                const binaryString = window.atob(msg.audio);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                const int16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) {
                  float32[i] = int16[i] / 32768.0;
                }

                // Schedule audio playing to prevent overlapping chunks
                const now = outputAudioContext.currentTime;
                if (nextPlayTime < now) {
                  nextPlayTime = now;
                }

                const buffer = outputAudioContext.createBuffer(1, float32.length, 24000);
                buffer.copyToChannel(float32, 0);
                
                const source = outputAudioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(outputAudioContext.destination);
                
                // Track source to cancel it if stopped
                activeAudioSources.push(source);
                source.onended = () => {
                  activeAudioSources = activeAudioSources.filter(s => s !== source);
                  if (activeAudioSources.length === 0 && ws?.readyState === WebSocket.OPEN) {
                    // Reset to idle/listening if speaker finished and still open
                    safeEmit("onStateChange", "listening");
                  }
                };
                
                source.start(nextPlayTime);
                nextPlayTime += buffer.duration;
              }
              break;

            default:
              console.log("WebSocket event skipped:", msg.type);
          }
        } catch (err) {
          console.error("Error al parsear el mensaje del WebSocket:", err);
        }
      }
    };

    ws.onerror = (e) => {
      console.error("Error de WebSocket:", e);
      emitLog("ws_error", "in", { error: "Error en la conexión WebSocket" });
    };

    ws.onclose = () => {
      console.log("WebSocket cerrado.");
      emitLog("ws_closed", "in", { message: "WebSocket cerrado" });
      safeEmit("onStateChange", "idle");
    };
  }

  function stop() {
    console.log("Deteniendo sesión de voz...");
    
    // Stop and clear all playing Audio sources
    activeAudioSources.forEach(source => {
      try {
        source.stop();
      } catch (_) {}
    });
    activeAudioSources = [];
    nextPlayTime = 0;

    if (ws) {
      ws.close();
      ws = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (processor) {
      processor.disconnect();
      processor = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if (outputAudioContext) {
      outputAudioContext.close();
      outputAudioContext = null;
    }

    safeEmit("onStateChange", "idle");
    emitLog("session_stop", "out", { message: "Sesión de voz detenida" });
  }

  return { start, stop };
}
