import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POLYMARKET_API_BASE = "https://gamma-api.polymarket.com";
const CLOB_API_BASE = "https://clob.polymarket.com";

serve(async (req) => {
  // Hantera CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let { endpoint, params, apiType = 'gamma' } = body;

    console.log(`[Proxy] Request: ${endpoint} | Type: ${apiType}`, JSON.stringify(params));

    // 1. Välj API-bas
    const baseUrl = apiType === 'clob' ? CLOB_API_BASE : POLYMARKET_API_BASE;

    // 2. Validering för historik-anrop (CLOB)
    // Detta hjälper dig se om frontend skickar tomt ID vilket orsakar tom graf
    if (apiType === 'clob' && endpoint === '/prices-history') {
        if (!params?.market) {
            console.error("[Proxy Error] 'market' (token_id) saknas för historik-anrop!");
            return new Response(JSON.stringify({ error: "Missing market ID for history" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    // 3. Hantera defaults för "Trending" (Gamma)
    if (apiType === 'gamma' && (!endpoint || endpoint === "/events")) {
        endpoint = "/events";
        // Applicera bara defaults om vi inte fått specifika filter
        if (!params || Object.keys(params).length === 0) {
            params = {
                closed: false,
                active: true,
                order: "volume24hr",
                ascending: false,
                limit: 20,
                ...params
            };
            console.log("[Proxy] Applying trending defaults");
        }
    }

    // 4. Bygg query string
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, String(v)));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    const apiUrl = `${baseUrl}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log(`[Proxy] Fetching: ${apiUrl}`);

    // 5. Gör anropet
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy API Error] ${response.status}:`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Polymarket API error: ${response.status}`,
          details: errorText 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    
    // 6. Logga svarstyp för debugging
    if (data.history && Array.isArray(data.history)) {
        console.log(`[Proxy] Mottog historik: ${data.history.length} datapunkter.`);
    } else if (Array.isArray(data)) {
        console.log(`[Proxy] Mottog lista: ${data.length} objekt.`);
    } else {
        console.log("[Proxy] Mottog objekt:", JSON.stringify(data).substring(0, 50) + "...");
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("[Proxy Internal Error]:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
