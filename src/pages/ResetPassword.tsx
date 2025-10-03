
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const authParams = useMemo(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(location.search);

    return {
      code: searchParams.get("code"),
      accessToken: hashParams.get("access_token") ?? searchParams.get("access_token"),
      refreshToken: hashParams.get("refresh_token") ?? searchParams.get("refresh_token"),
    };
  }, [location.hash, location.search]);

  useEffect(() => {
    let isMounted = true;

    const establishSession = async () => {
      try {
        setInitializing(true);
        setErrorMessage(null);

        if (authParams.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(authParams.code);
          if (error) throw error;
          return;
        }

        if (authParams.accessToken && authParams.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: authParams.accessToken,
            refresh_token: authParams.refreshToken,
          });

          if (error) throw error;
          return;
        }

        throw new Error("This password reset link is invalid or has expired. Request a new reset email.");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : "We couldn't validate your password reset link.";

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    establishSession();

    return () => {
      isMounted = false;
    };
  }, [authParams]);

  useEffect(() => {
    if (status === "success") {
      const timeout = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(timeout);
    }
  }, [status, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      setErrorMessage("Please enter a new password.");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage(null);

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("success");
    } catch (error) {
      setStatus("idle");
      const message = error instanceof Error
        ? error.message
        : "We couldn't update your password. Please try again.";
      setErrorMessage(message);
    }
  };

  const isDisabled = status === "loading" || initializing;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-finance-navy dark:text-gray-100">
            Reset your password
          </CardTitle>
          <CardDescription>
            Choose a new password to finish resetting your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initializing && (
            <p className="mb-4 text-sm text-muted-foreground">Checking your reset link…</p>
          )}
          {errorMessage && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/40 dark:text-red-200">
              {errorMessage}
            </p>
          )}
          {status === "success" ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              Password updated! You will be redirected to the login page in a moment.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="password">
                  New password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isDisabled}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isDisabled}>
                {status === "loading" ? "Saving…" : "Save password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
