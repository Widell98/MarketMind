
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, PenLine, Plus, TrendingUp, Crown, Settings, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import EditProfileDialog from "@/components/EditProfileDialog";
import UserAnalysesSection from '@/components/UserAnalysesSection';
import UserStockCasesSection from '@/components/UserStockCasesSection';
import MembershipSection from '@/components/MembershipSection';
import AccountSettings from '@/components/AccountSettings';
import ActivitySection from '@/components/ActivitySection';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          setProfileData(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to load profile data',
            variant: 'destructive',
          });
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Handle name change locally and show success feedback
  const handleNameChange = (newName: string) => {
    setProfileData((old: any) => ({ ...old, display_name: newName }));
    toast({
      title: 'Name Updated',
      description: `Your display name has been changed to "${newName}"`,
      variant: 'default',
    });
  };

  if (loading || profileLoading || roleLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-finance-navy dark:text-gray-200 mb-6">
          Din profil
        </h1>
        
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentName={profileData?.display_name || ""}
          userId={user?.id}
          onSaved={handleNameChange}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-finance-lightBlue text-finance-navy text-xl">
                  {getInitials(profileData?.display_name || user?.email || '')}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profileData?.display_name}</CardTitle>
              <div className="text-sm text-muted-foreground">@{profileData?.username}</div>
              <div className="mt-3 space-y-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {profileData?.level || 'novice'}
                </Badge>
                {isAdmin && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Admin
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setEditOpen(true)}
              >
                <PenLine className="h-4 w-4 mr-2" />
                Ändra namn
              </Button>
              {isAdmin && (
                <Button 
                  onClick={() => navigate('/admin/stock-cases')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Admin: Hantera Cases
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/stock-cases')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Visa alla aktiecases
              </Button>
            </CardContent>
          </Card>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Översikt</TabsTrigger>
                <TabsTrigger value="analyses">Analyser</TabsTrigger>
                <TabsTrigger value="stock-cases">Aktiecases</TabsTrigger>
                <TabsTrigger value="membership">Medlemskap</TabsTrigger>
                <TabsTrigger value="settings">Inställningar</TabsTrigger>
                <TabsTrigger value="activity">Aktivitet</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kontoinformation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">E-post</div>
                      <div>{user?.email}</div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Skapad</div>
                      <div>
                        {profileData?.created_at
                          ? new Date(profileData.created_at).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Intressen</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Array.isArray(profileData?.interests) && profileData?.interests.length > 0
                          ? profileData.interests.map((interest: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {interest}
                              </Badge>
                            ))
                          : 'Inga intressen tillagda än'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analyses">
                <UserAnalysesSection />
              </TabsContent>
              
              <TabsContent value="stock-cases">
                <UserStockCasesSection />
              </TabsContent>

              <TabsContent value="membership">
                <MembershipSection />
              </TabsContent>

              <TabsContent value="settings">
                <AccountSettings />
              </TabsContent>

              <TabsContent value="activity">
                <ActivitySection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper to get initials from name or email
const getInitials = (name: string): string => {
  if (!name) return '??';
  
  // If it's an email, use first two characters of the local part
  if (name.includes('@')) {
    return name.split('@')[0].substring(0, 2).toUpperCase();
  }
  
  // Otherwise use first characters of each word
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export default ProfilePage;
