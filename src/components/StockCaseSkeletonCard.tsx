
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const StockCaseSkeletonCard: React.FC = () => {
  return (
    <Card className="w-full max-w-sm mx-auto">
      {/* Image skeleton */}
      <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-t-lg" />
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            {/* Title skeleton */}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5" />
            {/* Company name skeleton */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/5" />
          </div>
          {/* Status badge skeleton */}
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {/* Avatar skeleton */}
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            {/* Username skeleton */}
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          <div className="flex items-center gap-1">
            {/* Action buttons skeleton */}
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Category badge skeleton */}
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            {/* Performance skeleton */}
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Price info skeleton */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
          </div>

          {/* Description skeleton */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          </div>
          
          {/* Button skeleton */}
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCaseSkeletonCard;
