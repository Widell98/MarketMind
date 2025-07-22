
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
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

        setStockCases(stockCasesData || []);
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {profileData.display_name || profileData.username}
                </h1>
                
                {profileData.username && profileData.display_name && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    @{profileData.username}
                  </p>
                )}

                {profileData.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {profileData.bio}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{profileData.follower_count || 0} följare</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{profileData.following_count || 0} följer</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Medlem sedan {formatDistanceToNow(new Date(profileData.created_at), { 
                        addSuffix: false, 
                        locale: sv 
                      })}
                    </span>
                  </div>
                </div>

                {profileData.level && (
                  <div className="mt-3">
                    <Badge variant="outline">
                      Nivå: {profileData.level}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Follow Button - Only show if not own profile and user is logged in */}
              {!isOwnProfile && user && (
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing(userId!) ? "default" : "outline"}
                  className="min-w-[120px]"
                >
                  {isFollowing(userId!) ? 'Följer' : 'Följ'}
                </Button>
              )}

              {/* Edit Profile Button - Only show for own profile */}
              {isOwnProfile && (
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                >
                  Redigera profil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Innehåll</TabsTrigger>
            <TabsTrigger value="about">Om</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-6">
            <ProfileContentGrid
              stockCases={stockCases}
              analyses={analyses}
              isLoading={contentLoading}
            />
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Om {profileData.display_name || profileData.username}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.investment_philosophy && (
                  <div>
                    <h4 className="font-medium mb-2">Investeringsfilosofi</h4>
                    <p className="text-gray-700 dark:text-gray-300">{profileData.investment_philosophy}</p>
                  </div>
                )}

                {profileData.location && (
                  <div>
                    <h4 className="font-medium mb-2">Plats</h4>
                    <p className="text-gray-700 dark:text-gray-300">{profileData.location}</p>
                  </div>
                )}

                {profileData.website_url && (
                  <div>
                    <h4 className="font-medium mb-2">Webbsida</h4>
                    <a 
                      href={profileData.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profileData.website_url}
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Statistik</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Stock Cases:</span>
                      <span className="ml-2 font-medium">{stockCases.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Analyser:</span>
                      <span className="ml-2 font-medium">{analyses.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Inlägg:</span>
                      <span className="ml-2 font-medium">{profileData.post_count || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserProfile;
