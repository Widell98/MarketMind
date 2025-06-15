
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
import { Loader2, User, PenLine, Award, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import EditProfileDialog from "@/components/EditProfileDialog";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [canCreateCases, setCanCreateCases] = useState(false);
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
          
          // Check if user can create cases (for now, all logged in users can)
          // You can modify this logic to check for specific permissions
          setCanCreateCases(true);
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-finance-navy dark:text-gray-200 mb-6">
          Your Profile
        </h1>
        
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentName={profileData?.display_name || ""}
          userId={user?.id}
          onSaved={handleNameChange}
        />

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
                Change Name
              </Button>
              {canCreateCases && (
                <Button 
                  onClick={() => navigate('/admin/stock-cases')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Stock Case
                </Button>
              )}
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
              
              <div className="pt-2 space-y-2">
                <Button variant="outline" className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  View Your Learning Progress
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/stock-cases')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Stock Cases
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
