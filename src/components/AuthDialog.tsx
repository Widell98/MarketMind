import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Brain } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Ange en giltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Ange en giltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
  confirmPassword: z.string().min(6, { message: "Lösenordet måste vara minst 6 tecken" }),
  username: z.string().min(3, { message: "Användarnamnet måste vara minst 3 tecken" })
    .regex(/^[a-z0-9_]+$/, { message: "Användarnamnet får endast innehålla små bokstäver, siffror och understreck" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const AuthDialog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const authParam = searchParams.get('auth');
  const isOpen = authParam === 'login' || authParam === 'signup';
  const initialTab = authParam === 'signup' ? 'signup' : 'login';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
      confirmPassword: '',
      username: '',
    },
  });

  // Uppdatera activeTab när dialog öppnas
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Stäng dialog om användaren loggar in
  useEffect(() => {
    if (user && !loading && isOpen) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('auth');
      setSearchParams(newSearchParams, { replace: true });
      setShowForgotPassword(false);
      loginForm.reset();
      signupForm.reset();
    }
  }, [user, loading, isOpen, searchParams, setSearchParams]);

  const handleClose = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('auth');
    setSearchParams(newSearchParams, { replace: true });
    setShowForgotPassword(false);
    loginForm.reset();
    signupForm.reset();
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await signIn(data.email, data.password);
      // Dialog stängs automatiskt via useEffect ovan
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      await signUp(data.email, data.password, {
        username: data.username,
        displayName: data.username // Använd samma värde för både username och displayName
      });
      setActiveTab('login');
      toast({
        title: "Konto skapat",
        description: "Du kan nu logga in med dina uppgifter.",
        variant: "default",
      });
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const onForgotPasswordSubmit = async (email: string) => {
    try {
      await resetPassword(email);
      setShowForgotPassword(false);
      toast({
        title: "E-post skickad",
        description: "Kontrollera din e-post för instruktioner.",
        variant: "default",
      });
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Market Mind
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {activeTab === 'login' 
              ? 'Logga in för att få tillgång till dina personliga marknadsinsikter'
              : 'Skapa ditt konto för att börja'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2">
          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold">Återställ lösenord</h3>
                <p className="text-xs text-muted-foreground mt-1">
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
                  <label className="text-sm font-medium mb-2 block">
                    E-post
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="din@epost.com"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                >
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
              <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
                <TabsTrigger value="login" className="text-sm">Logga in</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Skapa konto</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">E-post</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="din@epost.com" 
                              {...field} 
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
                          <FormLabel className="text-sm font-medium">Lösenord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
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
                        className="text-sm text-primary hover:underline"
                      >
                        Glömt ditt lösenord?
                      </button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-3">
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">E-post</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="din@epost.com" 
                              {...field} 
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
                          <FormLabel className="text-sm font-medium">Användarnamn</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="användarnamn" 
                              className="lowercase"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck="false"
                              {...field} 
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
                          <FormLabel className="text-sm font-medium">Lösenord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Bekräfta lösenord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
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
        </div>
        
        <DialogFooter className="text-center text-xs text-muted-foreground flex flex-col gap-1 pt-3 mt-2 border-t sm:justify-center">
          <div className="flex items-center justify-center gap-2">
            <Link 
              to="/terms" 
              className="hover:text-primary transition-colors"
              onClick={handleClose}
            >
              Användarvillkor
            </Link>
            <span>•</span>
            <Link 
              to="/privacy" 
              className="hover:text-primary transition-colors"
              onClick={handleClose}
            >
              Integritetspolicy
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;

