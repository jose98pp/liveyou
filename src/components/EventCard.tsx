import React, { useState } from "react";
import { Calendar, Play, Clock, Heart, Award, Bell, BellOff } from "lucide-react";
import { LiveEvent } from "../types";

interface EventCardProps {
  key?: any;
  event: LiveEvent;
  onPlay: (url: string, title: string, channelName?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function EventCard({ event, onPlay, isFavorite, onToggleFavorite }: EventCardProps) {
  const [hasReminder, setHasReminder] = useState(false);

  // Normalize sport status
  const statusLower = (event.status || "").toLowerCase();
  const isLive = statusLower.includes("live") || statusLower.includes("vivo") || statusLower.includes("jugando");
  const isScheduled = statusLower.includes("programado") || statusLower.includes("proximo") || statusLower.includes("mañana");
  const isFinished = statusLower.includes("final") || statusLower.includes("terminado");

  const getSportColor = (sport?: string) => {
    switch ((sport || "").toLowerCase()) {
      case "fútbol":
      case "futbol":
      case "soccer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "baloncesto":
      case "basketball":
      case "nba":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "tenis":
      case "tennis":
        return "bg-lime-500/10 text-lime-400 border-lime-500/20";
      case "automovilismo":
      case "f1":
      case "fórmula 1":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700/50";
    }
  };

  return (
    <div
      className="group relative glass-card hover:glass-card-hover rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      id={`event-card-${event.id}`}
    >
      {/* Background Gradient Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

      <div>
        {/* Card Header Info */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${getSportColor(event.sport)}`}>
            {event.sport || "Evento"}
          </span>

          <div className="flex items-center gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                En Vivo
              </span>
            )}
            {isScheduled && (
              <span className="bg-white/[0.04] text-slate-400 border border-white/[0.06] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase backdrop-blur-sm">
                Programado
              </span>
            )}
            {isFinished && (
              <span className="bg-white/[0.01] text-slate-500 border border-white/[0.02] text-[10px] font-medium px-2 py-0.5 rounded-full uppercase">
                Finalizado
              </span>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isFavorite
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              id={`fav-btn-event-${event.id}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tournament Name */}
        {event.tournament && (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1.5">
            <Award className="w-3.5 h-3.5 text-rose-400/80" />
            <span className="truncate">{event.tournament}</span>
          </div>
        )}

        {/* Main Title */}
        <h3 className="font-display font-semibold text-white text-base lg:text-lg tracking-tight leading-tight group-hover:text-rose-400 transition-colors line-clamp-2 min-h-[2.75rem] mb-4">
          {event.title}
        </h3>
      </div>

      <div>
        {/* Time and Broadcast Channels */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.06] mb-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-medium">{event.time || "Hora por definir"}</span>
          </div>

          {event.channels && event.channels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-500 font-semibold mr-0.5">Pantallas:</span>
              {event.channels.map((ch, idx) => (
                <span
                  key={idx}
                  className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-white/[0.08] transition-colors"
                >
                  {ch}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        {isLive && event.players && Object.keys(event.players).length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-semibold mb-0.5">Opciones de reproducción:</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(event.players).map(([key, url]) => (
                <button
                  key={key}
                  onClick={() => onPlay(url, `${event.title} (${key.replace('-', ' ')})`)}
                  className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-red-500/20 hover:to-rose-600/20 hover:border-rose-500/30 border border-white/[0.06] text-white hover:text-rose-300 font-semibold py-1.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
                  id={`watch-event-btn-${event.id}-${key}`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="capitalize">{key.replace("-", " ")}</span>
                </button>
              ))}
            </div>
          </div>
        ) : isLive && event.stream_url ? (
          <button
            onClick={() => onPlay(event.stream_url!, event.title)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-md shadow-rose-950/20 cursor-pointer"
            id={`watch-event-btn-${event.id}`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Sintonizar Señal</span>
          </button>
        ) : isScheduled ? (
          <button
            onClick={() => setHasReminder(!hasReminder)}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-xl text-sm transition-all border cursor-pointer ${
              hasReminder
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 backdrop-blur-sm"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300"
            }`}
            id={`reminder-event-btn-${event.id}`}
          >
            {hasReminder ? (
              <>
                <BellOff className="w-4 h-4" />
                <span>Alerta Activada</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-slate-400 group-hover:animate-bounce" />
                <span>Recordarme</span>
              </>
            )}
          </button>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 bg-white/[0.01] text-slate-600 border border-white/[0.04] py-2 px-4 rounded-xl text-sm cursor-not-allowed"
            id={`disabled-event-btn-${event.id}`}
          >
            <span>Transmisión Finalizada</span>
          </button>
        )}
      </div>
    </div>
  );
}
