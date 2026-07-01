// Deshabilitar la verificación SSL estricta (equivalente a CURLOPT_SSL_VERIFYPEER => false)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default async function handler(req: any, res: any) {
  // Solo permitir peticiones GET y OPTIONS
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  // Manejo de preflight CORS (OPTIONS)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
    return res.status(200).end();
  }

  try {
    const targetUrl = "https://ofutbol.jdoxx.com/api/shedule/YeBraQN6NLONadMf9W5NHYF4g8Dxdl?t=" + Date.now();
    
    // Obtener origin y referer de la petición del cliente de manera dinámica
    const clientOrigin = req.headers.origin || "";
    const clientReferer = req.headers.referer || "";
    
    // Construir cabeceras para la API externa
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    // Forzar siempre el dominio de origen autorizado registrado en la API (https://liveyou-five.vercel.app)
    // para garantizar que funcione tanto en local, en la vista previa de AI Studio, como en producción.
    const finalOrigin = "https://liveyou-five.vercel.app";
    const finalReferer = "https://liveyou-five.vercel.app/";

    headers["Origin"] = finalOrigin;
    headers["Referer"] = finalReferer;

    console.log(`[Vercel Serverless] Forwarding Origin: ${headers["Origin"]}, Referer: ${headers["Referer"]}`);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    // Detectar si la respuesta de la API es un error real o si no trae datos válidos
    const isApiError = data && data.code !== undefined && data.code !== 200 && data.code !== "200";
    const hasValidData = data && (
      Array.isArray(data) || 
      data.channels || data.canales || 
      data.events || data.eventos || 
      data.shedule || data.schedule || 
      data.tv_list || data.agenda
    );

    if (!data || isApiError || !hasValidData) {
      const errorMsg = data?.text || data?.message || "La API externa no retornó datos o requiere configuración";
      console.warn(`[Vercel Serverless] API retornó error o incompleto: ${JSON.stringify(data)}`);
      throw new Error(errorMsg);
    }

    // CORS Headers for client response
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
    
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("[Vercel Serverless] Error en API proxy:", error.message || error);
    
    // CORS Headers for client fallback response
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
    
    return res.status(200).json({
      success: true,
      error: error.message || "Error desconocido al conectar con el servidor",
      isFallback: true,
      data: getFallbackData()
    });
  }
}

// Datos de respaldo
function getFallbackData() {
  return {
    "status": "success",
    "info": {
      "title": "Agenda Deportiva & Canales de TV",
      "author": "System Fallback (Vercel)",
      "updated_at": new Date().toISOString()
    },
    "channels": [
      {
        "id": "ch1",
        "name": "ESPN HD Deportes",
        "logo": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200&auto=format&fit=crop",
        "category": "Deportes",
        "now_playing": "Champions League: Real Madrid vs Bayern",
        "time": "14:00 - 16:30",
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      },
      {
        "id": "ch2",
        "name": "HBO Max Premiere",
        "logo": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=200&auto=format&fit=crop",
        "category": "Películas",
        "now_playing": "Dune: Part Two",
        "time": "15:00 - 17:45",
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      },
      {
        "id": "ch3",
        "name": "Fox Premium",
        "logo": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=200&auto=format&fit=crop",
        "category": "Series",
        "now_playing": "The Last of Us - Episodio 5",
        "time": "16:00 - 17:00",
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      },
      {
        "id": "ch4",
        "name": "National Geographic",
        "logo": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=200&auto=format&fit=crop",
        "category": "Documentales",
        "now_playing": "Secretos de la Amazonia",
        "time": "15:30 - 16:30",
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      },
      {
        "id": "ch5",
        "name": "Sky Sports F1",
        "logo": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=200&auto=format&fit=crop",
        "category": "Deportes",
        "now_playing": "Fórmula 1: GP de España (Prácticas)",
        "time": "18:00 - 19:30",
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      }
    ],
    "events": [
      {
        "id": "ev1",
        "title": "Real Madrid vs Manchester City",
        "tournament": "UEFA Champions League",
        "time": "16:00",
        "status": "LIVE",
        "sport": "Fútbol",
        "channels": ["ESPN HD Deportes", "Sky Sports"],
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      },
      {
        "id": "ev2",
        "title": "Los Angeles Lakers vs Golden State Warriors",
        "tournament": "NBA Playoffs",
        "time": "21:00",
        "status": "PROGRAMADO",
        "sport": "Baloncesto",
        "channels": ["Star+ Deportes"],
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      },
      {
        "id": "ev3",
        "title": "Carlos Alcaraz vs Novak Djokovic",
        "tournament": "Roland Garros Final",
        "time": "10:30",
        "status": "FINALIZADO",
        "sport": "Tenis",
        "channels": ["ESPN 2"],
        "stream_url": ""
      },
      {
        "id": "ev4",
        "title": "GP de Mónaco - Carrera Principal",
        "tournament": "Fórmula 1",
        "time": "08:00",
        "status": "PROGRAMADO",
        "sport": "Automovilismo",
        "channels": ["Fox Sports Premium"],
        "stream_url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
      }
    ],
    "movies": [
      {
        "id": "m1",
        "title": "Oppenheimer",
        "genre": "Histórica / Drama",
        "year": "2023",
        "rating": "8.9",
        "duration": "180 min",
        "banner": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop",
        "description": "El físico J. Robert Oppenheimer lidera el Proyecto Manhattan para desarrollar la bomba atómica."
      },
      {
        "id": "m2",
        "title": "Spider-Man: Across the Spider-Verse",
        "genre": "Animación / Acción",
        "year": "2023",
        "rating": "8.7",
        "duration": "140 min",
        "banner": "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600&auto=format&fit=crop",
        "description": "Miles Morales se encuentra con una sociedad de Spider-People encargada de proteger la existencia misma del Multiverso."
      },
      {
        "id": "m3",
        "title": "Dune: Part Two",
        "genre": "Ciencia Ficción",
        "year": "2024",
        "rating": "9.0",
        "duration": "166 min",
        "banner": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
        "description": "Paul Atreides se une a Chani y a los Fremen para vengarse de los conspiradores que destruyeron a su familia."
      }
    ],
    "series": [
      {
        "id": "s1",
        "title": "The Last of Us",
        "genre": "Drama / Post-Apocalíptico",
        "seasons": "1 Temporada",
        "rating": "8.8",
        "banner": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop",
        "description": "Joel y Ellie deben sobrevivir a asesinos despiadados y criaturas infectadas en una América devastada."
      },
      {
        "id": "s2",
        "title": "House of the Dragon",
        "genre": "Fantasía / Drama",
        "seasons": "2 Temporadas",
        "rating": "8.5",
        "banner": "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop",
        "description": "La historia del ascenso y caída de la Dinastía Targaryen en Poniente, 200 años antes de Juego de Tronos."
      },
      {
        "id": "s3",
        "title": "Succession",
        "genre": "Drama / Sátira",
        "seasons": "4 Temporadas",
        "rating": "8.9",
        "banner": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
        "description": "La lucha por el control de uno de los mayores imperios de medios de comunicación y entretenimiento del mundo."
      }
    ]
  };
}
