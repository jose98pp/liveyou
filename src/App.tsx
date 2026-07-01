import React, { useState, useEffect } from "react";
import { 
  Tv, 
  Calendar, 
  Film, 
  Heart, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  SlidersHorizontal,
  Wifi, 
  WifiOff, 
  ArrowUpRight,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Channel, LiveEvent, MediaItem, ApiResponse } from "./types";
import StreamPlayer from "./components/StreamPlayer";
import APIInspector from "./components/APIInspector";
import EventCard from "./components/EventCard";
import ChannelCard from "./components/ChannelCard";
import MediaCard from "./components/MediaCard";

export default function App() {
  // Application State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [rawPayload, setRawPayload] = useState<any>(null);

  // Search & Navigation
  const [activeTab, setActiveTab] = useState<"events" | "channels" | "media" | "favorites">("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("Todos");
  const [selectedChannelCat, setSelectedChannelCat] = useState("Todos");
  const [selectedMediaType, setSelectedMediaType] = useState("Todos");

  // Favorites
  const [favorites, setFavorites] = useState<{
    channels: string[];
    events: string[];
    media: string[];
  }>({
    channels: [],
    events: [],
    media: []
  });

  // Active Streaming Player State
  const [activeStream, setActiveStream] = useState<{
    url: string;
    title: string;
    channelName?: string;
  } | null>(null);

  // Load favorites from local storage
  useEffect(() => {
    const savedFavs = localStorage.getItem("tv_events_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (err) {
        console.error("Error parsing favorites", err);
      }
    }
  }, []);

  // Sync favorites to local storage
  const saveFavorites = (newFavs: typeof favorites) => {
    setFavorites(newFavs);
    localStorage.setItem("tv_events_favorites", JSON.stringify(newFavs));
  };

  const toggleFavorite = (type: "channels" | "events" | "media", id: string) => {
    const updated = { ...favorites };
    if (updated[type].includes(id)) {
      updated[type] = updated[type].filter(favId => favId !== id);
    } else {
      updated[type] = [...updated[type], id];
    }
    saveFavorites(updated);
  };

  // Main API Fetch function
  const fetchScheduleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule");
      const result: ApiResponse = await res.json();
      
      setRawPayload(result);
      setIsFallbackMode(!!result.isFallback);

      if (result.success && result.data) {
        normalizeAndSetData(result.data);
        if (result.isFallback && result.error) {
          setError(result.error);
        }
      } else {
        throw new Error(result.error || "Fallo al procesar respuesta");
      }
    } catch (err: any) {
      console.warn("Utilizando datos locales de respaldo debido a un error de conexión:", err.message);
      setError(err.message || "Error al conectar con la API");
      setIsFallbackMode(true);
    } finally {
      setLoading(false);
    }
  };

  // Normalization Engine
  // This takes the API structure and dynamically extracts lists of TV Channels, Sports Events, and Media.
  // It handles variations in JSON keys to prevent UI breakages.
  const normalizeAndSetData = (apiData: any) => {
    if (!apiData) return;

    // 1. Parse Channels
    let parsedChannels: Channel[] = [];
    const rawChannels = apiData.channels || apiData.canales || apiData.tv_list || [];
    if (Array.isArray(rawChannels)) {
      parsedChannels = rawChannels.map((ch: any, idx: number) => ({
        id: ch.id || ch.channel_id || `ch-${idx}`,
        name: ch.name || ch.title || ch.nombre || "Canal de TV",
        logo: ch.logo || ch.image || ch.img || "",
        category: ch.category || ch.categoria || ch.genre || "General",
        now_playing: ch.now_playing || ch.playing || ch.programa_actual || "",
        time: ch.time || ch.horario || "",
        stream_url: ch.stream_url || ch.stream || ch.url || ""
      }));
    }

    // Helper function for parsing single event items uniformly
    const parseEventItem = (item: any, idx: number): LiveEvent => {
      // Extraer hora si está disponible en la descripción
      let extractedTime = item.time || item.hora || "";
      if (!extractedTime && item.description) {
        const match = item.description.match(/a las\s+(\d{1,2}:\d{2})/i);
        if (match) {
          extractedTime = match[1];
        }
      }
      
      const players = item.play || item.players || null;
      const defaultStream = item.stream_url || item.stream || item.url || (players ? players["player-1"] || players["player-2"] : "");
      
      // Mapeo inteligente de canales/pantallas de reproducción
      let channelsList = Array.isArray(item.channels) ? item.channels : (item.channels ? [item.channels] : []);
      if (channelsList.length === 0 && players) {
        channelsList = Object.keys(players).map(k => k.replace("-", " "));
      }

      // Detalle de deporte inteligente
      let detectedSport = item.sport || item.deporte || "";
      if (!detectedSport) {
        const countryCode = (item["country-code"] || "").toUpperCase();
        if (countryCode === "FIFA" || countryCode === "CH") {
          detectedSport = "Fútbol";
        } else {
          detectedSport = "Deportes";
        }
      }

      const cleanId = item.id || item.event_id || item["ofutbol-link"]?.split("/").pop() || `ev-${idx}`;

      return {
        id: cleanId,
        title: item.title || item.name || item.titulo || "Evento Deportivo",
        tournament: item.tournament || item.league || item.torneo || item.type || "Programación",
        time: extractedTime || "Por Definir",
        status: item.status || item.estado || (players ? "LIVE" : "PROGRAMADO"),
        sport: detectedSport,
        channels: channelsList,
        stream_url: defaultStream,
        players: players || undefined,
        image: item.photo || item.image || item.banner || undefined,
        views: typeof item["ofutbol-view"] === "number" ? item["ofutbol-view"] : (item.views ? Number(item.views) : undefined)
      };
    };

    // 2. Parse Events (matches, sports programs)
    let parsedEvents: LiveEvent[] = [];
    if (Array.isArray(apiData)) {
      console.log("Detectado formato de API plano (Array). Autodirigiendo elementos...");
      parsedEvents = apiData.map((ev: any, idx: number) => parseEventItem(ev, idx));
    } else {
      const rawEvents = apiData.events || apiData.eventos || apiData.schedule || apiData.shedule || apiData.agenda || [];
      if (Array.isArray(rawEvents)) {
        parsedEvents = rawEvents.map((ev: any, idx: number) => parseEventItem(ev, idx));
      }
    }

    // 3. Parse Movies and Series
    let parsedMedia: MediaItem[] = [];
    
    // Extract Movies if nested inside object
    const rawMovies = apiData.movies || apiData.peliculas || apiData.films || [];
    if (Array.isArray(rawMovies)) {
      parsedMedia.push(...rawMovies.map((m: any, idx: number) => ({
        id: m.id || `m-${idx}`,
        title: m.title || m.titulo || "Película",
        genre: m.genre || m.genero || "",
        year: m.year || m.año || "",
        rating: m.rating || m.puntuacion || "",
        duration: m.duration || m.duracion || "",
        banner: m.banner || m.poster || m.image || "",
        description: m.description || m.descripcion || m.resumen || "",
        type: "movie" as const,
        stream_url: m.stream_url || m.url || ""
      })));
    }

    // Extract Series if nested inside object
    const rawSeries = apiData.series || apiData.shows || [];
    if (Array.isArray(rawSeries)) {
      parsedMedia.push(...rawSeries.map((s: any, idx: number) => ({
        id: s.id || `s-${idx}`,
        title: s.title || s.titulo || "Serie",
        genre: s.genre || s.genero || "",
        year: s.year || s.año || "",
        rating: s.rating || s.puntuacion || "",
        seasons: s.seasons || s.temporadas || "",
        banner: s.banner || s.poster || s.image || "",
        description: s.description || s.descripcion || s.resumen || "",
        type: "series" as const,
        stream_url: s.stream_url || s.url || ""
      })));
    }

    setChannels(parsedChannels);
    setEvents(parsedEvents);
    setMediaItems(parsedMedia);
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const handleTuneIn = (url: string, title: string, channelName?: string) => {
    setActiveStream({ url, title, channelName });
    // Scroll to player smoothly
    const playerEl = document.getElementById("stream-player-container");
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Get filter categories
  const sportsList = ["Todos", ...Array.from(new Set(events.map(e => e.sport || "Fútbol")))];
  const channelCats = ["Todos", ...Array.from(new Set(channels.map(c => c.category || "General")))];
  const mediaTypes = ["Todos", "Películas", "Series"];

  // Filtered lists based on states
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.tournament || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === "Todos" || e.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.now_playing || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedChannelCat === "Todos" || c.category === selectedChannelCat;
    return matchesSearch && matchesCat;
  });

  const filteredMedia = mediaItems.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.genre || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedMediaType === "Todos" || 
                        (selectedMediaType === "Películas" && m.type === "movie") || 
                        (selectedMediaType === "Series" && m.type === "series");
    return matchesSearch && matchesType;
  });

  // Calculate favorites collections
  const favoriteChannelsList = channels.filter(c => favorites.channels.includes(c.id));
  const favoriteEventsList = events.filter(e => favorites.events.includes(e.id));
  const favoriteMediaList = mediaItems.filter(m => favorites.media.includes(m.id));
  const hasAnyFavorite = favoriteChannelsList.length > 0 || favoriteEventsList.length > 0 || favoriteMediaList.length > 0;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden" id="main-applet-root">
      {/* Dynamic Frosted Ambient Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/10 blur-[130px] rounded-full animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-700/10 blur-[160px] rounded-full animate-blob-slow"></div>
        <div className="absolute top-[30%] right-[5%] w-[35%] h-[35%] bg-cyan-500/10 blur-[120px] rounded-full animate-blob"></div>
      </div>

      {/* Dynamic Status bar */}
      <div className="relative z-10 glass-panel py-2.5 px-4" id="status-top-bar">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFallbackMode ? "bg-amber-400" : "bg-emerald-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isFallbackMode ? "bg-amber-500" : "bg-emerald-500"}`}></span>
            </span>
            <span className="font-semibold text-slate-300 font-mono">
              {isFallbackMode 
                ? "Conexión Offline - Datos de Respaldo Cargados" 
                : "Conexión Estable con Servidor de Eventos"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span className="hidden sm:inline">API: ofutbol.jdoxx.com</span>
            <div className="h-3 w-px bg-white/10 hidden sm:block"></div>
            <span>Filtros Activos: {filteredEvents.length} Deportes / {filteredChannels.length} Canales</span>
          </div>
        </div>
      </div>

      {/* Hero Header Design */}
      <header className="relative z-10 bg-transparent py-8 px-4" id="app-header-hero">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            {/* Branding */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-tr from-red-500 via-rose-500 to-orange-500 text-white p-2.5 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                  <Tv className="w-6 h-6" />
                </div>
                <h1 className="font-display font-black tracking-tight text-white text-2xl lg:text-3xl">
                  TV <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">&</span> EVENTS <span className="text-slate-500 font-normal">GUIDE</span>
                </h1>
              </div>
              <p className="text-slate-400 text-sm max-w-xl">
                Agenda interactiva de eventos en vivo, canales de televisión, películas y series con tecnología de transmisión unificada.
              </p>
            </div>

            {/* Actions / Refresh */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchScheduleData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 glass-input hover:glass-input-focus hover:bg-white/[0.06] text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                id="header-refresh-btn"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
                <span>Actualizar Guía</span>
              </button>
              <a
                href="#api-inspector-widget"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold transition-all border border-rose-500/10 hover:border-rose-500/20"
              >
                <span>Ver Consola</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Core Navigation Tabs & Search Row */}
          <div className="glass-panel p-2.5 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl relative z-10">
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto" id="navigation-tabs-container">
              <button
                onClick={() => { setActiveTab("events"); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "events"
                    ? "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white shadow-md shadow-rose-950/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-btn-events"
              >
                <Calendar className="w-4 h-4" />
                <span>⚽ Deportes y Eventos</span>
              </button>

              <button
                onClick={() => { setActiveTab("channels"); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "channels"
                    ? "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white shadow-md shadow-rose-950/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-btn-channels"
              >
                <Tv className="w-4 h-4" />
                <span>📺 Canales de TV</span>
              </button>

              <button
                onClick={() => { setActiveTab("media"); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "media"
                    ? "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white shadow-md shadow-rose-950/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-btn-media"
              >
                <Film className="w-4 h-4" />
                <span>🎬 Películas y Series</span>
              </button>

              <button
                onClick={() => { setActiveTab("favorites"); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                  activeTab === "favorites"
                    ? "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white shadow-md shadow-rose-950/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                id="tab-btn-favorites"
              >
                <Heart className="w-4 h-4" />
                <span>⭐ Mis Favoritos</span>
                {(favorites.channels.length + favorites.events.length + favorites.media.length) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-md shadow-rose-950/50">
                    {favorites.channels.length + favorites.events.length + favorites.media.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 lg:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "events" 
                    ? "Buscar eventos o torneos..." 
                    : activeTab === "channels" 
                    ? "Buscar canales de TV..." 
                    : activeTab === "media" 
                    ? "Buscar películas o series..." 
                    : "Buscar en favoritos..."
                }
                className="w-full text-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none transition-all placeholder:text-slate-500 glass-input focus:glass-input-focus"
                id="global-search-input"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 relative z-10" id="main-content-layout">
        {/* Stream Player section (Renders when an active stream is playing) */}
        <AnimatePresence>
          {activeStream && (
            <StreamPlayer
              streamUrl={activeStream.url}
              title={activeStream.title}
              channelName={activeStream.channelName}
              onClose={() => setActiveStream(null)}
            />
          )}
        </AnimatePresence>

        {/* Featured Banner Alert for Offline backup mode */}
        {isFallbackMode && (
          <div className="bg-amber-500/5 border border-amber-500/20 text-amber-300 rounded-2xl p-5 mb-8 flex items-start gap-3.5 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h5 className="font-semibold text-sm text-white flex items-center gap-2">
                <span>Servidor de Respaldo Activo</span>
                {error && error.includes("origin") && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                    Error de Origen API
                  </span>
                )}
              </h5>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                {error ? (
                  <>
                    La API externa de programación retornó el siguiente mensaje: <strong className="text-amber-200 font-mono">"{error}"</strong>.
                  </>
                ) : (
                  <>
                    La API externa de programación (<span className="font-mono text-[11px] text-amber-400">https://ofutbol.jdoxx.com</span>) no se encuentra disponible temporalmente o retornó un error de red.
                  </>
                )}
                {" "}Para garantizar tu experiencia de navegación, se han cargado datos simulados detallados de transmisiones.
              </p>
              
              {error && error.includes("origin") && (
                <div className="mt-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[11px] text-slate-300 flex flex-col gap-2">
                  <span className="font-medium text-amber-200">💡 ¿Cómo solucionar este error de la API?</span>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Debes ingresar a tu panel de control de desarrollador en <a href="https://ofutbol.jdoxx.com" target="_blank" rel="noopener noreferrer" className="text-rose-400 font-semibold underline hover:text-rose-300">ofutbol.jdoxx.com</a>, ir a la sección de configuración de tu clave de API y definir el campo <strong>Origin</strong> (Origen/Dominio autorizado).
                  </p>
                  <div className="text-slate-400 mt-1">
                    <p className="font-semibold text-slate-300 mb-1">Opciones recomendadas para el Origen:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 font-mono text-[10px] text-slate-400">
                      <li>
                        <span className="text-white font-bold">*</span> (Usar asterisco para permitir todas las conexiones - recomendado para desarrollo)
                      </li>
                      <li>
                        <span className="text-slate-200">https://ais-pre-63mq3g4tj7ehgt64ubdlkx-51979947882.us-east1.run.app</span> (Tu dominio de vista previa pública)
                      </li>
                      <li>
                        <span className="text-slate-200">https://ais-dev-63mq3g4tj7ehgt64ubdlkx-51979947882.us-east1.run.app</span> (Tu dominio de desarrollo actual)
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Grids */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mb-4" />
            <h4 className="font-display font-medium text-lg text-white">Sincronizando con el servidor de TV...</h4>
            <p className="text-slate-400 text-xs mt-1">Obteniendo la agenda de eventos y programación actual.</p>
          </div>
        ) : (
          <div>
            {/* TAB: DEPORTES Y EVENTOS */}
            {activeTab === "events" && (
              <div>
                {/* Sports filters row */}
                <div className="flex flex-wrap gap-2 items-center mb-6 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mr-2 font-semibold">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                    <span>Filtrar por Deporte:</span>
                  </div>
                  {sportsList.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedSport === sport
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                          : "glass-input text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="glass-panel border-white/[0.06] rounded-2xl p-12 text-center text-slate-400">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-white font-medium">No se encontraron eventos coincidentes</h4>
                    <p className="text-xs text-slate-500 mt-1">Intenta ajustando tu consulta o el filtro de deporte.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="events-grid">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onPlay={handleTuneIn}
                        isFavorite={favorites.events.includes(event.id)}
                        onToggleFavorite={() => toggleFavorite("events", event.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CANALES DE TV */}
            {activeTab === "channels" && (
              <div>
                {/* Categories filters row */}
                <div className="flex flex-wrap gap-2 items-center mb-6 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mr-2 font-semibold">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                    <span>Filtrar Categoría:</span>
                  </div>
                  {channelCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedChannelCat(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedChannelCat === cat
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                          : "glass-input text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {filteredChannels.length === 0 ? (
                  <div className="glass-panel border-white/[0.06] rounded-2xl p-12 text-center text-slate-400">
                    <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-white font-medium">No se encontraron canales</h4>
                    <p className="text-xs text-slate-500 mt-1">Prueba con otra palabra clave o categoría.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="channels-grid">
                    {filteredChannels.map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        onPlay={handleTuneIn}
                        isFavorite={favorites.channels.includes(channel.id)}
                        onToggleFavorite={() => toggleFavorite("channels", channel.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PELÍCULAS Y SERIES */}
            {activeTab === "media" && (
              <div>
                {/* Type filters row */}
                <div className="flex flex-wrap gap-2 items-center mb-6 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mr-2 font-semibold">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                    <span>Filtrar Contenido:</span>
                  </div>
                  {mediaTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMediaType(type)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedMediaType === type
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                          : "glass-input text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {filteredMedia.length === 0 ? (
                  <div className="glass-panel border-white/[0.06] rounded-2xl p-12 text-center text-slate-400">
                    <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-white font-medium">No se encontraron películas o series</h4>
                    <p className="text-xs text-slate-500 mt-1">Prueba con otra palabra de búsqueda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="media-grid">
                    {filteredMedia.map((media) => (
                      <MediaCard
                        key={media.id}
                        media={media}
                        onPlay={handleTuneIn}
                        isFavorite={favorites.media.includes(media.id)}
                        onToggleFavorite={() => toggleFavorite("media", media.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FAVORITOS */}
            {activeTab === "favorites" && (
              <div>
                {!hasAnyFavorite ? (
                  <div className="glass-panel border-white/[0.06] rounded-2xl p-12 text-center text-slate-400">
                    <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                    <h4 className="text-white font-medium">Tu lista de favoritos está vacía</h4>
                    <p className="text-xs text-slate-500 mt-1">Haz clic en el icono de corazón en cualquier evento, canal o película para guardarlo aquí.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Favorite Events */}
                    {favoriteEventsList.length > 0 && (
                      <div>
                        <h4 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></span>
                          ⚽ Deportes y Eventos Guardados
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favoriteEventsList.map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              onPlay={handleTuneIn}
                              isFavorite={true}
                              onToggleFavorite={() => toggleFavorite("events", event.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Favorite Channels */}
                    {favoriteChannelsList.length > 0 && (
                      <div>
                        <h4 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></span>
                          📺 Canales de TV Guardados
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favoriteChannelsList.map((channel) => (
                            <ChannelCard
                              key={channel.id}
                              channel={channel}
                              onPlay={handleTuneIn}
                              isFavorite={true}
                              onToggleFavorite={() => toggleFavorite("channels", channel.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Favorite Movies & Series */}
                    {favoriteMediaList.length > 0 && (
                      <div>
                        <h4 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></span>
                          🎬 Películas y Series Guardadas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {favoriteMediaList.map((media) => (
                            <MediaCard
                              key={media.id}
                              media={media}
                              onPlay={handleTuneIn}
                              isFavorite={true}
                              onToggleFavorite={() => toggleFavorite("media", media.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Informative block about stream compatibility */}
        <div className="glass-panel border-white/[0.06] rounded-2xl p-5 lg:p-6 mt-12 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-sm text-slate-100">¿Cómo reproducir canales e IPTV?</h5>
              <p className="text-slate-400 text-xs mt-0.5">
                Muchas señales utilizan transmisiones HLS (.m3u8). Si tu navegador no los admite nativamente, puedes utilizar programas como <strong>VLC Media Player</strong> o <strong>IPTV Pro</strong> copiando la dirección de transmisión con el botón "Copiar Link" provisto en cada canal.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-slate-300 px-2.5 py-1 rounded-lg">VLC Player</span>
            <span className="text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-slate-300 px-2.5 py-1 rounded-lg">Kodi</span>
            <span className="text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-slate-300 px-2.5 py-1 rounded-lg">M3U List</span>
          </div>
        </div>

        {/* Live Diagnostics Tool */}
        <APIInspector
          apiUrl="https://ofutbol.jdoxx.com/api/shedule/YeBraQN6NLONadMf9W5NHYF4g8Dxdl"
          isFallback={isFallbackMode}
          rawResponse={rawPayload || { status: "Aún no sincronizado" }}
          onRefresh={fetchScheduleData}
          isLoading={loading}
        />
      </main>

      {/* Modern Compact Footer */}
      <footer className="bg-transparent border-t border-white/[0.04] py-8 px-4 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 TV & Events Guide. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <button onClick={() => setActiveTab("events")} className="hover:text-rose-400 transition-colors cursor-pointer">Eventos</button>
            <span>•</span>
            <button onClick={() => setActiveTab("channels")} className="hover:text-rose-400 transition-colors cursor-pointer">Canales</button>
            <span>•</span>
            <button onClick={() => setActiveTab("media")} className="hover:text-rose-400 transition-colors cursor-pointer">Cine</button>
            <span>•</span>
            <button onClick={() => setActiveTab("favorites")} className="hover:text-rose-400 transition-colors cursor-pointer">Favoritos</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
