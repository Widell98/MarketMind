
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders, getSafeRedirectBase } from "../_shared/cors.ts";
import { createScopedLogger, generateRequestId } from "../_shared/logger.ts";

serve(async (req) => {
  const requestId = generateRequestId();
  const { headers: corsHeaders, originAllowed, allowedOrigin } = buildCorsHeaders(req);
  const logger = createScopedLogger("CUSTOMER-PORTAL", requestId);

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
        error: "Du måste vara inloggad för att hantera din prenumeration"
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

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });

    logger.debug("Stripe client initialized");

    // Leta efter kund i Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logger.info("Creating Stripe customer for user");
      // Om ingen kund finns, skapa en ny
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      logger.info("Stripe customer created", { customerId: newCustomer.id });

      // Uppdatera subscribers tabellen med den nya customer ID
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: newCustomer.id,
        subscribed: false,
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    }

    const customerId = customers.data.length > 0 ? customers.data[0].id : (await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id }
    })).id;

    logger.info("Using Stripe customer", { customerId });

    const redirectBase = getSafeRedirectBase(allowedOrigin);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${redirectBase}/portfolio-advisor`,
    });

    logger.info("Portal session created", { sessionId: portalSession.id });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create portal session", { message: errorMessage });
    return new Response(JSON.stringify({
      error: "Kunde inte öppna kundportalen. Försök igen senare."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
