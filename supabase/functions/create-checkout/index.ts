
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders, getSafeRedirectBase } from "../_shared/cors.ts";
import { createScopedLogger, generateRequestId } from "../_shared/logger.ts";

serve(async (req) => {
  const requestId = generateRequestId();
  const { headers: corsHeaders, originAllowed, allowedOrigin } = buildCorsHeaders(req);
  const logger = createScopedLogger("CREATE-CHECKOUT", requestId);

  if (req.method === "OPTIONS") {
    if (!originAllowed) {
      logger.warn("Rejected preflight due to disallowed origin");
      return new Response("Origin not allowed", { status: 403, headers: corsHeaders });
    }

    return new Response(null, { headers: corsHeaders });
  }

  if (!originAllowed) {
    logger.warn("Blocked request due to disallowed origin");
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    logger.info("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logger.error("Stripe secret key missing");
      return new Response(JSON.stringify({
        error: "Stripe är inte konfigurerat. Kontakta support."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Använd service role key för att autentisera användaren
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn("Missing authorization header");
      return new Response(JSON.stringify({
        error: "Du måste vara inloggad för att uppgradera"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    logger.debug("Authenticating user token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      logger.warn("User authentication failed", { reason: userError?.message ?? "missing_email" });
      return new Response(JSON.stringify({
        error: "Autentisering misslyckades. Logga in igen."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    const { tier } = await req.json();
    if (!tier || !['premium', 'pro'].includes(tier)) {
      logger.warn("Invalid tier received", { tier: tier ?? "missing" });
      return new Response(JSON.stringify({
        error: "Ogiltig prenumerationsplan"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logger.info("Tier validated", { tier });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });

    logger.debug("Stripe client initialized");

    // Kolla om kunden redan finns
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logger.info("Found existing Stripe customer", { customerId });
    } else {
      logger.info("No existing Stripe customer found; using email lookup");
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

    logger.info("Creating checkout session", { tier });

    const redirectBase = getSafeRedirectBase(allowedOrigin);

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
      success_url: `${redirectBase}/portfolio-advisor?success=true`,
      cancel_url: `${redirectBase}/portfolio-advisor?cancelled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    });

    logger.info("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create checkout session", { message: errorMessage });
    return new Response(JSON.stringify({
      error: "Kunde inte skapa checkout session. Försök igen senare."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
