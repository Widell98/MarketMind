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
  userStats = {
    stockCasesCount: 0,
    analysesCount: 0,
    totalLikes: 0,
    totalViews: 0
  }
}) => {
  const {
    follows,
    followUser,
    unfollowUser,
    isFollowing
  } = useUserFollows();

  const getInitials = (name: string): string => {
    if (!name) return '??';
    if (name.includes('@')) {
      return name.split('@')[0].substring(0, 2).toUpperCase();
    }
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase().substring(0, 2);
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
    <>
      <div className="relative">
        {/* Cover Background */}
        <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 rounded-t-xl"></div>
        
        <Card className="border-none shadow-xl -mt-16 sm:-mt-20 md:-mt-24 mx-2 sm:mx-4 bg-white dark:bg-gray-900">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
              {/* Profile Picture */}
              <div className="relative -mt-12 sm:-mt-16 md:-mt-20">
                <div className="relative group">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 border-2 sm:border-4 border-white shadow-xl">
                    <AvatarImage src={profileData?.avatar_url} alt={profileData?.display_name || profileData?.username || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-xl sm:text-2xl md:text-3xl font-bold">
                      {getInitials(profileData?.display_name || profileData?.username || '')}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && onAvatarClick && <button onClick={onAvatarClick} className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                    </button>}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full text-center md:text-left mt-2 sm:mt-4 md:mt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-finance-navy dark:text-gray-200 mb-1 sm:mb-2 break-words">
                      {profileData?.display_name || profileData?.username || 'Anonymous'}
                    </h1>
                    {profileData?.username && profileData?.display_name && <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg break-words">
                        @{profileData.username}
                      </p>}
                  </div>
                  
                  {isOwnProfile ? <div className="flex gap-2 justify-center sm:justify-start">
                      <Button variant="outline" size="sm" onClick={onEditClick} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <PenLine className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Redigera profil</span>
                        <span className="xs:hidden">Redigera</span>
                      </Button>
                      <Button variant="outline" size="sm" className="px-2 sm:px-3">
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div> : <Button onClick={handleFollowToggle} variant={isFollowing(profileData?.id) ? "outline" : "default"} size="sm" className={`px-4 sm:px-6 text-xs sm:text-sm ${isFollowing(profileData?.id) ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : "bg-slate-700 hover:bg-slate-800"}`}>
                      {isFollowing(profileData?.id) ? 'Följer' : 'Följ'}
                    </Button>}
                </div>

                {/* Bio */}
                {profileData?.bio && <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                      {profileData.bio}
                    </p>
                  </div>}

                {/* Additional Info */}
                
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EnhancedProfileHeader;
