
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Brain, Sparkles, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
    .regex(/^[a-z0-9_]+$/, { message: "Username can only contain lowercase letters, numbers, and underscores" }),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

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
    // If user is already logged in, redirect to home
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      const result = await signIn(data.email, data.password);
      if (result.data && !result.error) {
        // Navigation will happen automatically via the useEffect above
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      const result = await signUp(data.email, data.password, {
        username: data.username,
        displayName: data.displayName
      });
      if (result.data && !result.error) {
        setActiveTab('login');
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const onForgotPasswordSubmit = async (email: string) => {
    try {
      const result = await resetPassword(email);
      if (result.data && !result.error) {
        setShowForgotPassword(false);
      }
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  if (loading && user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/10">
      <div className="w-full max-w-md space-y-4">
        {/* Back to Home Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4 hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Button>

        <Card className="border-2 border-primary/10 shadow-xl bg-gradient-to-br from-background to-muted/5 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-8 h-8 text-primary animate-pulse" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Market Mentor
              </CardTitle>
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <CardDescription className="text-base">
              Logga in för att få tillgång till personliga marknadsinsikter och AI-driven investeringsrådgivning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Återställ lösenord</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ange din e-postadress för att få instruktioner för återställning
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
                      placeholder="din@email.com"
                      required
                      className="border-primary/20 focus:border-primary/40"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  >
                    Skicka återställningsmail
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Tillbaka till inloggning
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Logga in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Skapa konto
                  </TabsTrigger>
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
                              <Input 
                                placeholder="din@email.com" 
                                {...field} 
                                className="border-primary/20 focus:border-primary/40"
                              />
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
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="border-primary/20 focus:border-primary/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
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
                          className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                        >
                          Glömt lösenordet?
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
                              <Input 
                                placeholder="din@email.com" 
                                {...field} 
                                className="border-primary/20 focus:border-primary/40"
                              />
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
                              <Input 
                                placeholder="anvandare123" 
                                {...field} 
                                className="border-primary/20 focus:border-primary/40"
                              />
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
                              <Input 
                                placeholder="Ditt Namn" 
                                {...field} 
                                className="border-primary/20 focus:border-primary/40"
                              />
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
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="border-primary/20 focus:border-primary/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
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
          <CardFooter className="text-center text-sm text-muted-foreground">
            Genom att fortsätta godkänner du Market Mentors Användarvillkor och Integritetspolicy.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
