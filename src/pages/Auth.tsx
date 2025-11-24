import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Ange en giltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Ange en giltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
  username: z.string().min(3, { message: "Användarnamnet måste vara minst 3 tecken" })
    .regex(/^[a-z0-9_]+$/, { message: "Användarnamnet får endast innehålla små bokstäver, siffror och understreck" }),
  displayName: z.string().min(2, { message: "Visningsnamnet måste vara minst 2 tecken" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
      displayName: '',
    },
  });

  useEffect(() => {
    if (!user || loading) return;

    const shouldRedirectToProfile = sessionStorage.getItem('redirectToProfile') === 'true';
    const targetPath = shouldRedirectToProfile ? '/profile' : '/';
    const targetState = shouldRedirectToProfile ? { tab: 'riskprofile' } : undefined;

    if (shouldRedirectToProfile) {
      sessionStorage.removeItem('redirectToProfile');
    }

    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true, state: targetState });
    }
  }, [user, loading, navigate, location.pathname]);

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await signIn(data.email, data.password);
      // Navigation will happen automatically via the useEffect above
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      await signUp(data.email, data.password, {
        username: data.username,
        displayName: data.displayName
      });
      sessionStorage.setItem('redirectToProfile', 'true');
      navigate('/profile', { state: { tab: 'riskprofile' } });
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const onForgotPasswordSubmit = async (email: string) => {
    try {
      await resetPassword(email);
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  if (loading && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-finance-navy" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-finance-navy dark:text-gray-200">
            Market Mentor
          </CardTitle>
          <CardDescription>
            Logga in för att få tillgång till dina personliga marknadsinsikter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Återställ lösenord</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ange din e-post för att få instruktioner för återställning
                </p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const email = formData.get('email') as string;
                onForgotPasswordSubmit(email);
              }} className="space-y-4">
                <div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="din@epost.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-finance-navy hover:bg-finance-blue text-white">
                  Skicka återställningsmejl
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Tillbaka till inloggning
                </Button>
              </form>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Logga in</TabsTrigger>
                <TabsTrigger value="signup">Skapa konto</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-post</FormLabel>
                          <FormControl>
                            <Input placeholder="din@epost.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lösenord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-finance-navy hover:bg-finance-blue text-white"
                      disabled={loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Logga in
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-finance-navy hover:text-finance-blue underline"
                      >
                        Glömt ditt lösenord?
                      </button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-post</FormLabel>
                          <FormControl>
                            <Input placeholder="din@epost.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Användarnamn</FormLabel>
                          <FormControl>
                            <Input placeholder="användarnamn" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visningsnamn</FormLabel>
                          <FormControl>
                            <Input placeholder="Ditt namn" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lösenord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-finance-navy hover:bg-finance-blue text-white"
                      disabled={signupForm.formState.isSubmitting}
                    >
                      {signupForm.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Skapa konto
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground flex flex-col gap-1">
          <Link to="/terms">Användarvillkor</Link>
          <Link to="/privacy">Integritetspolicy</Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
