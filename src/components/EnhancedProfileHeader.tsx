
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, Eye, PenLine, Settings, Camera } from 'lucide-react';
import { useUserFollows } from '@/hooks/useUserFollows';

interface EnhancedProfileHeaderProps {
  profileData: any;
  isOwnProfile: boolean;
  onEditClick: () => void;
  onAvatarClick?: () => void;
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
  onAvatarClick,
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
    <div className="relative">
      {/* Cover Background */}
      <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-t-xl"></div>
      
      <Card className="border-none shadow-xl -mt-24 mx-4 bg-white dark:bg-gray-900">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="relative -mt-16 md:-mt-20">
              <div className="relative group">
                <Avatar className="h-36 w-36 border-4 border-white shadow-xl">
                  <AvatarImage 
                    src={profileData?.avatar_url} 
                    alt={profileData?.display_name || profileData?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                    {getInitials(profileData?.display_name || profileData?.username || '')}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && onAvatarClick && (
                  <button
                    onClick={onAvatarClick}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-finance-navy dark:text-gray-200 mb-2">
                    {profileData?.display_name || profileData?.username || 'Anonymous'}
                  </h1>
                  {profileData?.username && profileData?.display_name && (
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      @{profileData.username}
                    </p>
                  )}
                </div>
                
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onEditClick} className="flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
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
                    className={`px-6 ${isFollowing(profileData?.id) ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {isFollowing(profileData?.id) ? 'Följer' : 'Följ'}
                  </Button>
                )}
              </div>

              {/* Bio */}
              {profileData?.bio && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {profileData.bio}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {userStats.stockCasesCount + userStats.analysesCount}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Inlägg</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {profileData?.follower_count || 0}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Följare</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {profileData?.following_count || 0}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Följer</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {userStats.totalLikes}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Likes</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {profileData?.level && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200">
                    Nivå: {profileData.level}
                  </Badge>
                )}
                {profileData?.investment_philosophy && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200">
                    {profileData.investment_philosophy}
                  </Badge>
                )}
                {profileData?.location && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200">
                    📍 {profileData.location}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProfileHeader;
