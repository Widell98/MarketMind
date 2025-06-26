
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Calendar, Star, TrendingUp, Trophy, MapPin } from 'lucide-react';

interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileSidebarProps {
  userId: string;
  userProfile?: UserProfile | UserProfile[] | null;
}

const UserProfileSidebar: React.FC<UserProfileSidebarProps> = ({ 
  userId, 
  userProfile 
}) => {
  // Handle the case where userProfile might be an array
  const profile = Array.isArray(userProfile) ? userProfile[0] : userProfile;

  if (!profile) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-3 sm:mb-4">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading user profile...</p>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile.display_name || profile.username || 'Anonymous';
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <Card className="shadow-lg sticky top-4">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center text-sm sm:text-base">
          <User className="w-4 h-4 mr-2 text-blue-600" />
          Analysis Author
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* User Avatar and Name */}
        <div className="text-center">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4">
            <AvatarImage src={profile.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="text-lg sm:text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {displayName}
          </h3>
          {profile.username && profile.display_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              @{profile.username}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Location */}
        {profile.location && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{profile.location}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Member Since
                </p>
                <p className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-300">
                  {joinDate}
                </p>
              </div>
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                  Active Trader
                </p>
                <p className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-300">
                  Verified
                </p>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Achievement Badge */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-3 sm:p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-full">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Community Contributor
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <Star className="w-3 h-3 text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileSidebar;
