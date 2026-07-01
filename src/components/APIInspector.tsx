import React, { useState } from "react";
import { Terminal, Database, Server, RefreshCw, ChevronDown, ChevronUp, Copy, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface APIInspectorProps {
  apiUrl: string;
  isFallback: boolean;
  rawResponse: any;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function APIInspector({ apiUrl, isFallback, rawResponse, onRefresh, isLoading }: APIInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRawJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel border-white/[0.06] rounded-2xl overflow-hidden mb-8" id="api-inspector-widget">
      {/* Accordion Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.04] transition-all text-left cursor-pointer"
        id="api-inspector-toggle-btn"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-rose-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-white text-sm">
                Consola e Inspector de API en Vivo
              </h4>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase backdrop-blur-sm ${
                  isFallback
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                }`}
              >
                {isFallback ? "Modo Respaldo (Local)" : "Conexión en Vivo (API)"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 font-mono truncate max-w-md lg:max-w-xl">
              {apiUrl}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Refrescar datos del servidor"
            id="inspector-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rose-500" : ""}`} />
          </button>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06]"
            id="api-inspector-panel-content"
          >
            <div className="p-4 lg:p-6 bg-transparent font-mono text-xs text-slate-300">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-3.5 flex items-start gap-3 backdrop-blur-sm">
                  <Database className="w-5 h-5 text-rose-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                      Endpoint API
                    </span>
                    <span className="text-white font-semibold block text-xs mt-0.5">
                      ofutbol.jdoxx.com
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-3.5 flex items-start gap-3 backdrop-blur-sm">
                  <Server className="w-5 h-5 text-rose-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                      Proxy Node.js
                    </span>
                    <span className="text-white font-semibold block text-xs mt-0.5">
                      Activo (/api/schedule)
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-3.5 flex items-start gap-3 backdrop-blur-sm">
                  <Info className="w-5 h-5 text-rose-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                      CURLOPT Equivalente
                    </span>
                    <span className="text-emerald-400 font-semibold block text-xs mt-0.5">
                      SSL Bypass & UA Activo
                    </span>
                  </div>
                </div>
              </div>

              {/* PHP Script curl equivalents for reference */}
              <div className="mb-4 bg-white/[0.01] rounded-xl p-4 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Equivalente de Consulta (PHP Curl)</span>
                  <span className="text-[10px] text-slate-500 font-sans font-semibold">Basado en tu código</span>
                </div>
                <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre p-2 bg-slate-950/80 rounded-lg border border-white/[0.06]">
{`$ch = curl_init();
curl_setopt_array($ch, [
  CURLOPT_URL => "https://ofutbol.jdoxx.com/api/shedule/YeBraQN6NLONadMf9W5NHYF4g8Dxdl",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_HTTPHEADER => ["Accept: application/json", "User-Agent: Mozilla/5.0"]
]);`}
                </pre>
              </div>

              {/* JSON Output Viewer */}
              <div className="bg-white/[0.01] rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-200 font-sans">
                      Respuesta JSON del Servidor ({isFallback ? "Fallback" : "Live"})
                    </span>
                  </div>
                  <button
                    onClick={copyRawJSON}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded glass-input border border-white/[0.08] hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                    id="copy-json-payload-btn"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px] font-semibold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[10px]">Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-950/80 overflow-y-auto max-h-72">
                  <pre className="text-[11px] text-rose-300 whitespace-pre font-mono">
                    {JSON.stringify(rawResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
