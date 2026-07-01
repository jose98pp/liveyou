import React from "react";
import { Play, Heart, Radio, Tv } from "lucide-react";
import { Channel } from "../types";

interface ChannelCardProps {
  key?: any;
  channel: Channel;
  onPlay: (url: string, title: string, channelName?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function ChannelCard({ channel, onPlay, isFavorite, onToggleFavorite }: ChannelCardProps) {
  // Generate a random-looking color for channels without custom logo
  const letterCode = channel.name.charAt(0).toUpperCase();
  const getLogoFallbackColor = (name: string) => {
    const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "from-red-600 to-pink-600",
      "from-indigo-600 to-blue-600",
      "from-emerald-600 to-teal-600",
      "from-amber-600 to-orange-600",
      "from-purple-600 to-pink-600",
    ];
    return colors[charCodeSum % colors.length];
  };

  return (
    <div
      className="group relative glass-card hover:glass-card-hover rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      id={`channel-card-${channel.id}`}
    >
      {/* Background Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

      <div>
        {/* Card Header & Favorite Toggle */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={`${channel.name} logo`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = "none";
                  const fallback = document.getElementById(`fallback-logo-${channel.id}`);
                  if (fallback) fallback.style.display = "flex";
                }}
                className="w-12 h-12 rounded-xl object-cover bg-slate-950/80 border border-white/[0.08]"
              />
            ) : null}

            {/* Logo Fallback Container */}
            <div
              id={`fallback-logo-${channel.id}`}
              style={{ display: channel.logo ? "none" : "flex" }}
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLogoFallbackColor(channel.name)} text-white items-center justify-center font-display font-extrabold text-lg shadow-inner border border-white/10`}
            >
              {letterCode}
            </div>

            <div>
              <h3 className="font-display font-semibold text-white text-base leading-tight group-hover:text-rose-400 transition-colors">
                {channel.name}
              </h3>
              {channel.category && (
                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-mono border border-rose-500/15 mt-1 inline-block backdrop-blur-sm">
                  {channel.category}
                </span>
              )}
            </div>
          </div>

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
            id={`fav-btn-channel-${channel.id}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Current Show / "Now Playing" Block */}
        {channel.now_playing ? (
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06] mb-4 flex items-start gap-2.5 backdrop-blur-sm">
            <Radio className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 animate-pulse" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">
                Transmitiendo ahora
              </span>
              <p className="text-slate-200 text-xs font-semibold mt-0.5 truncate" title={channel.now_playing}>
                {channel.now_playing}
              </p>
              {channel.time && (
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  Horario: {channel.time}
                </span>
              )}
              {/* Progress bar simulation for realism */}
              <div className="w-full bg-white/[0.06] h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-rose-500 h-full w-2/3 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.01] rounded-xl p-3 border border-white/[0.03] mb-4 flex items-center gap-2.5 text-slate-500 text-xs font-medium">
            <Tv className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Programación no disponible</span>
          </div>
        )}
      </div>

      {/* Tuning / Play Trigger */}
      {channel.stream_url ? (
        <button
          onClick={() => onPlay(channel.stream_url!, channel.name)}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.12] text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all border border-white/[0.08] cursor-pointer"
          id={`play-channel-btn-${channel.id}`}
        >
          <Play className="w-4 h-4 text-rose-500 fill-current" />
          <span>Ver Señal en Vivo</span>
        </button>
      ) : (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 bg-white/[0.01] text-slate-600 border border-white/[0.03] py-2 px-4 rounded-xl text-sm cursor-not-allowed"
          id={`disabled-channel-btn-${channel.id}`}
        >
          <span>Sin emisión activa</span>
        </button>
      )}
    </div>
  );
}
