
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
      <div className="h-48 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 rounded-t-xl"></div>
      
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
                  <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-3xl font-bold">
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
                    className={`px-6 ${isFollowing(profileData?.id) ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : "bg-slate-700 hover:bg-slate-800"}`}
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
                <div className="text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {userStats.stockCasesCount + userStats.analysesCount}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Inlägg</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {profileData?.follower_count || 0}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Följare</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg border border-violet-200/50 dark:border-violet-700/50">
                  <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {profileData?.following_count || 0}
                  </div>
                  <div className="text-sm text-violet-600 dark:text-violet-400 font-medium">Följer</div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-lg border border-rose-200/50 dark:border-rose-700/50">
                  <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {userStats.totalLikes}
                  </div>
                  <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">Likes</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {profileData?.level && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200">
                    Nivå: {profileData.level}
                  </Badge>
                )}
                {profileData?.investment_philosophy && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200">
                    {profileData.investment_philosophy}
                  </Badge>
                )}
                {profileData?.location && (
                  <Badge variant="outline" className="bg-violet-50 text-violet-700 dark:bg-violet-900 dark:text-violet-300 border-violet-200">
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
