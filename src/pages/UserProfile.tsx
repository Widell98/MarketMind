import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import EnhancedProfileHeader from '@/components/EnhancedProfileHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useUserFollows } from '@/hooks/useUserFollows';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar, ArrowLeft, Heart, Eye, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import ProfileContentGrid from '@/components/ProfileContentGrid';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stockCases, setStockCases] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const { followUser, unfollowUser, isFollowing } = useUserFollows();

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Fel',
          description: 'Kunde inte ladda profil',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  useEffect(() => {
    const fetchUserContent = async () => {
      if (!userId) return;

      try {
        setContentLoading(true);

        // Fetch user's stock cases
        const { data: stockCasesData } = await supabase
          .from('stock_cases')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        // Fetch user's analyses
        const { data: analysesData } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        const sanitizedStockCases = (stockCasesData || []).map((stockCase) => ({
          ...stockCase,
          title: normalizeStockCaseTitle(stockCase.title, stockCase.company_name),
        }));

        setStockCases(sanitizedStockCases);
        setAnalyses(analysesData || []);

      } catch (error) {
        console.error('Error fetching user content:', error);
        toast({
          title: 'Fel',
          description: 'Kunde inte ladda innehåll',
          variant: 'destructive',
        });
      } finally {
        setContentLoading(false);
      }
    };

    if (userId) {
      fetchUserContent();
    }
  }, [userId]);

  const handleFollowToggle = () => {
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att följa användare",
        variant: "destructive",
      });
      return;
    }

    if (!userId) return;

    if (isFollowing(userId)) {
      unfollowUser(userId);
    } else {
      followUser(userId);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Profil hittades inte
          </h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Back Button */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-6 bg-white dark:bg-gray-900 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Profile Header */}
        <div className="pb-8">
          <EnhancedProfileHeader 
            profileData={profileData}
            isOwnProfile={isOwnProfile}
            onEditClick={() => navigate('/profile')}
            userStats={{
              stockCasesCount: stockCases.length,
              analysesCount: analyses.length,
              totalLikes: 0,
              totalViews: 0
            }}
          />
        </div>

        {/* Content Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-background border">
              <TabsTrigger value="content">
                Innehåll
              </TabsTrigger>
              <TabsTrigger value="about">
                Om
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-6">
              <ProfileContentGrid
                stockCases={stockCases}
                analyses={analyses}
                isLoading={contentLoading}
              />
            </TabsContent>
            
            <TabsContent value="about" className="mt-6">
              <Card className="border">
                <CardHeader>
                  <CardTitle>Om {profileData?.display_name || profileData?.username}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileData?.bio && (
                    <div>
                      <h4 className="font-medium mb-2 text-foreground">Biografi</h4>
                      <p className="text-muted-foreground leading-relaxed">{profileData.bio}</p>
                    </div>
                  )}

                  {profileData?.investment_philosophy && (
                    <div>
                      <h4 className="font-medium mb-2 text-foreground">Investeringsfilosofi</h4>
                      <p className="text-muted-foreground">{profileData.investment_philosophy}</p>
                    </div>
                  )}

                  {profileData?.location && (
                    <div>
                      <h4 className="font-medium mb-2 text-foreground">Plats</h4>
                      <p className="text-muted-foreground">{profileData.location}</p>
                    </div>
                  )}

                  {profileData?.website_url && (
                    <div>
                      <h4 className="font-medium mb-2 text-foreground">Webbsida</h4>
                      <a 
                        href={profileData.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profileData.website_url}
                      </a>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-4 text-foreground">Statistik</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-foreground">{stockCases.length}</div>
                        <div className="text-sm text-muted-foreground">Stock Cases</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-foreground">{analyses.length}</div>
                        <div className="text-sm text-muted-foreground">Analyser</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-foreground">{profileData?.post_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Inlägg</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Medlem sedan</h4>
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(new Date(profileData?.created_at), { 
                        addSuffix: false, 
                        locale: sv 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
