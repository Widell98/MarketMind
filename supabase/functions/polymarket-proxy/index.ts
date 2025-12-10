import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POLYMARKET_API_BASE = "https://gamma-api.polymarket.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    
    console.log("Inkommande request body:", JSON.stringify(body, null, 2)); 

    // Vi hämtar endpoint och params, men använder 'let' så vi kan ändra dem
    let { endpoint, params } = body;

    // --- FIX: Tvinga fram "Trending" data om endpoint saknas eller är /events ---
    if (!endpoint || endpoint === "/events") {
        endpoint = "/events"; // Default endpoint
        
        // Här sätter vi hårda defaults så vi slipper 2020-data
        params = {
            closed: false,       // Dölj gamla marknader
            active: true,        // Visa bara aktiva
            order: "volume24hr", // Sortera på volym
            ascending: false,    // Högst volym först
            limit: 20,           // Hämta 20 st
            ...params            // Om frontend skickar egna params, skriv över defaults
        };
        console.log("Applying default filters for trending markets.");
    }
    // --------------------------------------------------------------------------

    // Build query string from params
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

    const queryString = queryParams.toString();
    const apiUrl = `${POLYMARKET_API_BASE}${endpoint}${queryString ? `?${queryString}` : ''}`;

    console.log(`Proxying request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Polymarket API error: ${response.status} ${errorText}`);
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
    
    // Logga lite info om vad vi fick
    if (Array.isArray(data)) {
        console.log(`Fick svar från Polymarket: ${data.length} objekt.`);
        // Logga titeln på första eventet för att se att det är nytt
        if (data.length > 0) {
            console.log("Första eventet:", data[0].title, "| Volym:", data[0].volume);
        }
    } else {
        console.log("Fick svar (ej array):", JSON.stringify(data).substring(0, 100));
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error proxying Polymarket API:", error);
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