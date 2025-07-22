
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, Eye, PenLine, Settings } from 'lucide-react';
import { useUserFollows } from '@/hooks/useUserFollows';

interface EnhancedProfileHeaderProps {
  profileData: any;
  isOwnProfile: boolean;
  onEditClick: () => void;
  userStats?: {
    stockCasesCount: number;
    analysesCount: number;
    totalLikes: number;
    totalViews: number;
  };
}

const EnhancedProfileHeader: React.FC<EnhancedProfileHeaderProps> = ({
  profileData,
  isOwnProfile,
  onEditClick,
  userStats = { stockCasesCount: 0, analysesCount: 0, totalLikes: 0, totalViews: 0 }
}) => {
  const { follows, followUser, unfollowUser, isFollowing } = useUserFollows();

  const getInitials = (name: string): string => {
    if (!name) return '??';
    if (name.includes('@')) {
      return name.split('@')[0].substring(0, 2).toUpperCase();
    }
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFollowToggle = () => {
    if (!profileData?.id) return;
    
    if (isFollowing(profileData.id)) {
      unfollowUser(profileData.id);
    } else {
      followUser(profileData.id);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
          {/* Profile Picture */}
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                {getInitials(profileData?.display_name || profileData?.username || '')}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-2xl font-bold text-finance-navy dark:text-gray-200">
                {profileData?.display_name || profileData?.username || 'Anonymous'}
              </h1>
              
              {isOwnProfile ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onEditClick}>
                    <PenLine className="h-4 w-4 mr-2" />
                    Redigera profil
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleFollowToggle}
                  variant={isFollowing(profileData?.id) ? "outline" : "default"}
                  size="sm"
                  className={isFollowing(profileData?.id) ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : ""}
                >
                  {isFollowing(profileData?.id) ? 'Följer' : 'Följ'}
                </Button>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-finance-navy dark:text-gray-200">
                  {userStats.stockCasesCount + userStats.analysesCount}
                </div>
                <div className="text-sm text-muted-foreground">inlägg</div>
              </div>
              
              <button className="text-center hover:opacity-80 transition-opacity">
                <div className="text-2xl font-bold text-finance-navy dark:text-gray-200">
                  {profileData?.follower_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">följare</div>
              </button>
              
              <button className="text-center hover:opacity-80 transition-opacity">
                <div className="text-2xl font-bold text-finance-navy dark:text-gray-200">
                  {profileData?.following_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">följer</div>
              </button>
            </div>

            {/* Engagement Stats */}
            <div className="flex justify-center md:justify-start gap-6 mb-4">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">{userStats.totalLikes}</span>
                <span className="text-sm text-muted-foreground">likes totalt</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{userStats.totalViews}</span>
                <span className="text-sm text-muted-foreground">visningar</span>
              </div>
            </div>

            {/* Bio */}
            {profileData?.bio && (
              <p className="text-sm text-gray-700 dark:text-gray-300 max-w-md">
                {profileData.bio}
              </p>
            )}

            {/* Badges */}
            <div className="flex justify-center md:justify-start gap-2 mt-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {profileData?.level || 'novice'}
              </Badge>
              {profileData?.investment_philosophy && (
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {profileData.investment_philosophy}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedProfileHeader;
