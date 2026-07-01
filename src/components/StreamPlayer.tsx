import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, ExternalLink, Copy, Check, Tv } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StreamPlayerProps {
  streamUrl: string;
  title: string;
  channelName?: string;
  onClose?: () => void;
}

export default function StreamPlayer({ streamUrl, title, channelName, onClose }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.src = streamUrl;
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay was blocked or failed:", err);
        setIsPlaying(false);
      });
    }
  }, [streamUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHls = streamUrl.toLowerCase().includes(".m3u8");
  const isEmbed = 
    streamUrl.toLowerCase().includes("embed") || 
    streamUrl.toLowerCase().includes("player") || 
    streamUrl.toLowerCase().includes(".html") ||
    (!streamUrl.toLowerCase().endsWith(".m3u8") && 
     !streamUrl.toLowerCase().endsWith(".mp4") && 
     !streamUrl.toLowerCase().endsWith(".ts") &&
     !streamUrl.toLowerCase().includes(".m3u8") && 
     !streamUrl.toLowerCase().includes(".mp4") && 
     !streamUrl.toLowerCase().includes(".ts"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl p-4 lg:p-6 mb-8 backdrop-blur-md relative z-20"
      id="stream-player-container"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/15">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
              {channelName || "Reproductor en Vivo"}
            </span>
            <h3 className="font-display font-semibold text-white text-lg lg:text-xl">
              {title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-input border border-white/[0.08] hover:bg-white/5 text-slate-300 text-sm transition-all cursor-pointer"
            title="Copiar URL de transmisión"
            id="copy-stream-btn"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-rose-500" />
                <span>Copiar Link</span>
              </>
            )}
          </button>
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-sm font-semibold transition-all shadow-md shadow-rose-950/10 cursor-pointer"
            id="open-external-stream-btn"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Externo</span>
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/[0.06] transition-all text-sm cursor-pointer"
              id="close-player-btn"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-white/[0.06] group">
        {isEmbed ? (
          <iframe
            src={streamUrl}
            className="w-full h-full border-0 rounded-xl"
            allow="encrypted-media; autoplay; picture-in-picture"
            allowFullScreen
            id="live-stream-iframe"
          />
        ) : (
          <>
            {/* HTML5 Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onClick={togglePlay}
              autoPlay
              controls={false}
              onError={() => {
                setError(
                  isHls 
                    ? "Este stream utiliza el formato HLS (.m3u8). La reproducción directa requiere navegadores con soporte nativo de HLS o un reproductor externo como VLC / IPTV Player."
                    : "No se pudo cargar este flujo de video. Comprueba tu conexión o utiliza la opción 'Abrir Externo'."
                );
              }}
              id="live-stream-video"
            />

            {/* Custom Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all cursor-pointer"
                    id="play-pause-toggle"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all cursor-pointer"
                    id="mute-toggle"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={handleFullscreen}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all cursor-pointer"
                  id="fullscreen-toggle"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Error Overlay / Info for HLS Streams */}
        {((error && !isEmbed) || (isHls && !error && !isEmbed)) && (
          <div className="absolute inset-0 bg-[#040815]/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-3 border border-rose-500/15">
              <Tv className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="font-semibold text-white mb-2">
              {isHls ? "Transmisión HLS de Alta Calidad" : "Error de reproducción"}
            </h4>
            <p className="text-slate-400 text-sm max-w-md mb-4 leading-relaxed">
              {error || "Este canal transmite en formato HLS (.m3u8), optimizado para dispositivos móviles y aplicaciones dedicadas de TV."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-rose-950/20 cursor-pointer"
                id="unsupported-hls-external-btn"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir en VLC / Navegador</span>
              </a>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 glass-input border border-white/[0.08] hover:bg-white/5 text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
                id="unsupported-hls-copy-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Enlace Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-rose-500" />
                    <span>Copiar Enlace IPTV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/[0.01] p-3 rounded-xl border border-white/[0.04] text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Flujo de transmisión en línea</span>
        </div>
        <div className="font-mono text-slate-500 truncate max-w-xs md:max-w-md" title={streamUrl}>
          URL: {streamUrl}
        </div>
      </div>
    </motion.div>
  );
}
