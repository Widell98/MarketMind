
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
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
        error: "Du måste vara inloggad för att hantera din prenumeration" 
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

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });

    logStep("Stripe initialized");

    const { data: subscriber, error: subscriberError } = await supabaseClient
      .from("subscribers")
      .select("stripe_customer_id, subscribed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriberError) {
      logStep("Failed to load subscriber record", { error: subscriberError.message });
    }

    let customerId = subscriber?.stripe_customer_id ?? null;

    if (!customerId) {
      logStep("Stripe customer id missing, attempting lookup by email");
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    if (!customerId) {
      logStep("No existing customer found");
      return new Response(JSON.stringify({
        error: "Ingen prenumeration hittades för ditt konto. Starta en prenumeration innan du försöker hantera den."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: subscriber?.subscribed ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const portalConfigurationId = Deno.env.get("STRIPE_PORTAL_CONFIGURATION_ID") ?? undefined;

    try {
      const sessionPayload: Stripe.BillingPortal.SessionCreateParams = {
        customer: customerId,
        return_url: `${origin}/portfolio-advisor`,
      };

      if (portalConfigurationId) {
        sessionPayload.configuration = portalConfigurationId;
      }

      const portalSession = await stripe.billingPortal.sessions.create(sessionPayload);

      logStep("Portal session created", { sessionId: portalSession.id, url: portalSession.url });

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      const message = stripeError instanceof Error ? stripeError.message : String(stripeError);
      logStep("Failed to create billing portal session", { message, customerId, configuration: portalConfigurationId });

      const configurationErrorMessage = "No configuration provided";
      const userMessage = message.includes(configurationErrorMessage)
        ? "Stripe-portalen saknar en konfiguration i live-läge. Spara inställningarna för kundportalen i Stripe och försök igen."
        : "Kunde inte öppna Stripe-portalen. Kontakta support om problemet kvarstår.";

      return new Response(JSON.stringify({
        error: userMessage
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: "Kunde inte öppna kundportalen. Försök igen senare." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
