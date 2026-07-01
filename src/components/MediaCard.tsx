import React from "react";
import { Play, Star, Calendar, Clock, Film, Tv, Heart } from "lucide-react";
import { MediaItem } from "../types";

interface MediaCardProps {
  key?: any;
  media: MediaItem;
  onPlay: (url: string, title: string, channelName?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function MediaCard({ media, onPlay, isFavorite, onToggleFavorite }: MediaCardProps) {
  return (
    <div
      className="group relative glass-card hover:glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full justify-between"
      id={`media-card-${media.id}`}
    >
      {/* Banner/Image with overlay */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-white/[0.06]">
        {media.banner ? (
          <img
            src={media.banner}
            alt={media.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0c1122] to-[#040815] flex flex-col items-center justify-center gap-2">
            {media.type === "movie" ? (
              <Film className="w-10 h-10 text-slate-600" />
            ) : (
              <Tv className="w-10 h-10 text-slate-600" />
            )}
          </div>
        )}

        {/* Media type overlay badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
          {media.type === "movie" ? (
            <>
              <Film className="w-3 h-3 text-rose-500" />
              <span>Película</span>
            </>
          ) : (
            <>
              <Tv className="w-3 h-3 text-rose-500" />
              <span>Serie</span>
            </>
          )}
        </div>

        {/* Ratings overlay badge */}
        {media.rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/10">
            <Star className="w-3 h-3 fill-current" />
            <span>{media.rating}</span>
          </div>
        )}

        {/* Play overlay on image hover */}
        {media.stream_url && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <button
              onClick={() => onPlay(media.stream_url!, media.title)}
              className="p-3.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white transform scale-90 group-hover:scale-100 transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
              title="Reproducir ahora"
              id={`play-overlay-btn-${media.id}`}
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Grid */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold mb-2 font-mono">
            {media.year && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{media.year}</span>
              </div>
            )}
            {media.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{media.duration}</span>
              </div>
            )}
            {media.seasons && (
              <div className="flex items-center gap-1">
                <Tv className="w-3 h-3 text-slate-500" />
                <span>{media.seasons}</span>
              </div>
            )}
          </div>

          {/* Title & Favorite Block */}
          <div className="flex items-start justify-between gap-2.5 mb-2">
            <h3 className="font-display font-semibold text-white text-base lg:text-lg leading-snug group-hover:text-rose-400 transition-colors line-clamp-1">
              {media.title}
            </h3>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 rounded-lg border shrink-0 transition-all cursor-pointer ${
                isFavorite
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              id={`fav-btn-media-${media.id}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Genre Tag */}
          {media.genre && (
            <p className="text-[11px] text-rose-400 font-bold mb-2.5 font-sans">
              {media.genre}
            </p>
          )}

          {/* Description */}
          {media.description && (
            <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
              {media.description}
            </p>
          )}
        </div>

        {/* Action button */}
        {media.stream_url ? (
          <button
            onClick={() => onPlay(media.stream_url!, media.title)}
            className="w-full flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all mt-auto cursor-pointer"
            id={`watch-media-btn-${media.id}`}
          >
            <Play className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>Reproducir Contenido</span>
          </button>
        ) : (
          <div className="w-full text-center bg-white/[0.01] border border-white/[0.03] py-2 rounded-xl text-[11px] text-slate-500 font-medium">
            Próximamente disponible
          </div>
        )}
      </div>
    </div>
  );
}
