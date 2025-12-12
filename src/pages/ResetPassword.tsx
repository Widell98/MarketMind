import { useEffect, useMemo, useState, useRef } from "react";
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
  
  // Förhindra dubbla anrop i React Strict Mode
  const codeProcessed = useRef(false);

  const authParams = useMemo(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(location.search);

    return {
      code: searchParams.get("code"),
      accessToken: hashParams.get("access_token") ?? searchParams.get("access_token"),
      refreshToken: hashParams.get("refresh_token") ?? searchParams.get("refresh_token"),
      error: searchParams.get("error") || hashParams.get("error"),
      errorDescription: searchParams.get("error_description") || hashParams.get("error_description")
    };
  }, [location.hash, location.search]);

  useEffect(() => {
    let isMounted = true;

    const establishSession = async () => {
      // Om Supabase redan rapporterar fel i URL:en
      if (authParams.error) {
        setErrorMessage(decodeURIComponent(authParams.errorDescription || "Länken är ogiltig eller har gått ut."));
        setInitializing(false);
        return;
      }

      // Om vi redan har en aktiv session OCH inga auth-parametrar finns,
      // betyder det att användaren redan är inloggad och försöker komma åt sidan direkt
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession && !authParams.code && !authParams.accessToken) {
        setInitializing(false);
        return;
      }

      try {
        setInitializing(true);
        setErrorMessage(null);

        // Scenario 1: PKCE Flow (code)
        if (authParams.code) {
          // VIKTIGT: Kontrollera om vi redan har försökt byta denna kod
          if (codeProcessed.current) {
            setInitializing(false);
            return;
          }
          codeProcessed.current = true;

          const { error } = await supabase.auth.exchangeCodeForSession(authParams.code);
          if (error) {
            // Om koden redan är använd (t.ex. vid hot reload), kolla om vi faktiskt är inloggade ändå
            const { data: { session: checkSession } } = await supabase.auth.getSession();
            if (!checkSession) throw error;
          }
          // VIKTIGT: Efter att sessionen är etablerad, sätt initializing till false
          // så att formuläret visas. Användaren är nu inloggad men behöver fortfarande sätta nytt lösenord.
          if (isMounted) {
            setInitializing(false);
          }
          return;
        }

        // Scenario 2: Implicit Flow (access_token i hash)
        if (authParams.accessToken && authParams.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: authParams.accessToken,
            refresh_token: authParams.refreshToken,
          });

          if (error) throw error;
          // VIKTIGT: Efter att sessionen är etablerad, sätt initializing till false
          if (isMounted) {
            setInitializing(false);
          }
          return;
        }

        // Om inga parametrar finns
        throw new Error("Länken saknar nödvändig information. Vänligen begär ett nytt lösenord.");
      } catch (error) {
        if (!isMounted) return;

        console.error("Reset password error:", error);
        const message = error instanceof Error
          ? error.message
          : "Vi kunde inte verifiera din länk.";

        // Specialhantering för "expired" så användaren förstår
        if (message.includes("expired") || message.includes("invalid")) {
           setErrorMessage("Länken har gått ut eller redan använts. Begär ett nytt lösenord.");
        } else {
           setErrorMessage(message);
        }
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
      const timeout = setTimeout(() => {
        // Skickar med state så att Auth.tsx kan visa en toast
        navigate("/login", { state: { passwordReset: true } });
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      setErrorMessage("Vänligen ange ett nytt lösenord.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Lösenordet måste vara minst 6 tecken.");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage(null);

      // 1. Uppdatera lösenordet
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // 2. Logga ut användaren direkt för säkerhets skull och för att tvinga ny inloggning
      await supabase.auth.signOut();

      setStatus("success");
    } catch (error) {
      setStatus("idle");
      const message = error instanceof Error
        ? error.message
        : "Vi kunde inte uppdatera ditt lösenord. Försök igen.";
      setErrorMessage(message);
    }
  };

  const isDisabled = status === "loading" || initializing;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-finance-navy dark:text-gray-100">
            Återställ ditt lösenord
          </CardTitle>
          <CardDescription>
            Välj ett nytt lösenord för att återställa ditt konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initializing && (
            <div className="flex justify-center py-4">
               <p className="text-sm text-muted-foreground">Verifierar din länk...</p>
            </div>
          )}
          
          {!initializing && errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/40 dark:text-red-200">
              {errorMessage}
              <Button 
                variant="link" 
                className="pl-1 text-red-700 underline dark:text-red-100" 
                onClick={() => navigate("/login")}
              >
                Gå till inloggning
              </Button>
            </div>
          )}

          {status === "success" ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              Lösenordet uppdaterat! Du loggas nu ut och omdirigeras till inloggningen för att logga in med ditt nya lösenord.
            </p>
          ) : (
            !initializing && !errorMessage && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="password">
                    Nytt lösenord
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ange nytt lösenord"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isDisabled}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isDisabled}>
                  {status === "loading" ? "Sparar..." : "Spara lösenord"}
                </Button>
              </form>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
