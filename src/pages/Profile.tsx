import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, PenLine, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  if (loading || profileLoading) {
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-finance-navy dark:text-gray-200 mb-6">
          Your Profile
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-finance-lightBlue text-finance-navy text-xl">
                  {getInitials(profileData?.display_name || user?.email || '')}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profileData?.display_name}</CardTitle>
              <div className="text-sm text-muted-foreground">@{profileData?.username}</div>
              
              <div className="mt-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {profileData?.level || 'novice'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" size="sm" className="mt-2">
                <PenLine className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Details Card */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{user?.email}</div>
              </div>
              
              <Separator />
              
              <div>
                <div className="text-sm text-muted-foreground">Created At</div>
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
                <div className="text-sm text-muted-foreground">Interests</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.isArray(profileData?.interests) && profileData?.interests.length > 0
                    ? profileData.interests.map((interest: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {interest}
                        </Badge>
                      ))
                    : 'No interests added yet'}
                </div>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  View Your Learning Progress
                </Button>
              </div>
            </CardContent>
          </Card>
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
