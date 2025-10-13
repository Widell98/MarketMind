
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not found");
      return new Response(JSON.stringify({ 
        error: "Stripe är inte konfigurerat. Kontakta support." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    logStep("Stripe secret key found");

    // Använd service role key för att autentisera användaren
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(JSON.stringify({ 
        error: "Du måste vara inloggad för att uppgradera" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      logStep("User authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ 
        error: "Autentisering misslyckades. Logga in igen." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { tier } = await req.json();
    if (!tier || !['premium', 'pro'].includes(tier)) {
      logStep("Invalid tier", { tier });
      return new Response(JSON.stringify({ 
        error: "Ogiltig prenumerationsplan" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Tier validated", { tier });

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16" 
    });

    logStep("Stripe initialized");

    // Kolla om kunden redan finns
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    const priceData = tier === 'premium' ? {
      currency: "sek",
      product_data: {
        name: "AI Portfolio Advisor Premium",
        description: "Obegränsad AI-analys och alla funktioner"
      },
      unit_amount: 6900, // 69 SEK
      recurring: { interval: "month" },
    } : {
      currency: "sek",
      product_data: {
        name: "AI Portfolio Advisor Pro",
        description: "Alla funktioner plus prioriterad support"
      },
      unit_amount: 14900, // 149 SEK
      recurring: { interval: "month" },
    };

    logStep("Creating checkout session", { tier, priceData });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/portfolio-advisor?success=true`,
      cancel_url: `${origin}/portfolio-advisor?cancelled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: "Kunde inte skapa checkout session. Försök igen senare." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
