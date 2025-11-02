import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (message: string, details?: Record<string, unknown>) => {
  const suffix = details ? ` | ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-PROFILE] ${message}${suffix}`);
};

const deleteUserContent = async (
  supabaseClient: SupabaseClient,
  userId: string,
  userEmail: string | null
) => {
  const deleteOperations: Array<{ table: string; column?: string; value?: string }> = [
    { table: "portfolio_chat_history" },
    { table: "portfolio_insights" },
    { table: "portfolio_performance_history" },
    { table: "portfolio_recommendations" },
    { table: "shared_portfolio_analyses" },
    { table: "analysis_comments" },
    { table: "analysis_likes" },
    { table: "saved_opportunities" },
    { table: "post_comments" },
    { table: "post_likes" },
    { table: "posts" },
    { table: "stock_case_comments" },
    { table: "stock_case_follows" },
    { table: "stock_case_likes" },
    { table: "stock_case_updates" },
    { table: "stock_case_image_history", column: "created_by" },
    { table: "stock_cases" },
    { table: "user_ai_memory" },
    { table: "user_ai_insights" },
    { table: "user_ai_usage" },
    { table: "ai_chat_sessions" },
    { table: "chat_folders" },
    { table: "ai_market_insights" },
    { table: "analyses" },
    { table: "user_badges" },
    { table: "user_completed_quizzes" },
    { table: "user_learning_modules" },
    { table: "user_quiz_categories" },
    { table: "user_quiz_progress" },
    { table: "user_follows", column: "follower_id" },
    { table: "user_follows", column: "following_id" },
    { table: "user_holdings" },
    { table: "user_portfolios" },
    { table: "user_risk_profiles" },
    { table: "user_roles" },
    { table: "user_role_audit" },
    { table: "user_sessions" },
    { table: "subscribers" },
  ];

  const runDelete = async (table: string, column: string, value: string) => {
    log("Deleting records", { table, column });
    const { error } = await supabaseClient.from(table).delete().eq(column, value);
    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to delete from ${table}: ${error.message}`);
    }
  };

  for (const operation of deleteOperations) {
    await runDelete(operation.table, operation.column ?? "user_id", operation.value ?? userId);
  }

  const { error: roleAuditActorError } = await supabaseClient
    .from("user_role_audit")
    .delete()
    .eq("performed_by", userId);

  if (roleAuditActorError && roleAuditActorError.code !== "PGRST116") {
    throw new Error(`Failed to delete actor entries from user_role_audit: ${roleAuditActorError.message}`);
  }

  if (userEmail) {
    log("Removing subscriber records by email");
    const { error: subscriberEmailError } = await supabaseClient
      .from("subscribers")
      .delete()
      .eq("email", userEmail);

    if (subscriberEmailError && subscriberEmailError.code !== "PGRST116") {
      throw new Error(`Failed to delete subscriber records by email: ${subscriberEmailError.message}`);
    }
  }

  const { error: auditUpdateError } = await supabaseClient
    .from("security_audit_log")
    .update({ user_id: null, user_agent: null, ip_address: null })
    .eq("user_id", userId);

  if (auditUpdateError && auditUpdateError.code !== "PGRST116") {
    throw new Error(`Failed to anonymize security audit log: ${auditUpdateError.message}`);
  }

  const { error: generationUpdateError } = await supabaseClient
    .from("ai_generation_runs")
    .update({ triggered_by: null })
    .eq("triggered_by", userId);

  if (generationUpdateError && generationUpdateError.code !== "PGRST116") {
    throw new Error(`Failed to anonymize AI generation runs: ${generationUpdateError.message}`);
  }

  log("User content deleted", { userId });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    log("Missing authorization header");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData?.user) {
      log("Failed to authenticate user", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? null;

    log("Deleting user content", { userId });
    await deleteUserContent(supabaseClient, userId, userEmail);

    log("Deleting profile", { userId });
    const { error: profileDeleteError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError && profileDeleteError.code !== "PGRST116") {
      log("Profile delete failed", { error: profileDeleteError.message });
      return new Response(JSON.stringify({ error: "Failed to delete profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      log("Auth delete failed", { error: authDeleteError.message });
      return new Response(JSON.stringify({ error: "Failed to delete user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Profile deleted", { userId });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("Unexpected error", { message });
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
