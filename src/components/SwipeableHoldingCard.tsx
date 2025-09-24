
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import HoldingCard from './HoldingCard';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';

interface SwipeableHoldingCardProps {
  holding: any;
  portfolioPercentage: number;
  holdingPerformance?: HoldingPerformance;
  onDiscuss: (name: string, symbol?: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isMobile?: boolean;
  onRefreshPrice?: (symbol: string) => void;
  isUpdatingPrice?: boolean;
  refreshingTicker?: string | null;
}

const SwipeableHoldingCard: React.FC<SwipeableHoldingCardProps> = ({
  holding,
  portfolioPercentage,
  holdingPerformance,
  onDiscuss,
  onEdit,
  onDelete,
  isMobile = false,
  onRefreshPrice,
  isUpdatingPrice,
  refreshingTicker
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const isCash = holding.holding_type === 'cash';

  const actions = [
    ...(isCash && onEdit ? [{
      id: 'edit',
      label: 'Redigera',
      icon: Edit2,
      color: 'bg-blue-600',
      action: () => onEdit(holding.id)
    }] : []),
    ...(!isCash && onEdit ? [{
      id: 'edit',
      label: 'Redigera',
      icon: Edit2,
      color: 'bg-blue-600',
      action: () => onEdit(holding.id)
    }] : []),
    ...(!isCash ? [{
      id: 'discuss',
      label: 'Diskutera',
      icon: MessageSquare,
      color: 'bg-green-600',
      action: () => onDiscuss(holding.name, holding.symbol)
    }] : []),
    {
      id: 'delete',
      label: 'Ta bort',
      icon: Trash2,
      color: 'bg-red-600',
      action: () => onDelete(holding.id, holding.name)
    }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setStartX(e.touches[0].clientX);
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isSwipeActive) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Only allow left swipe (positive diff)
    if (diff > 0) {
      const maxSwipe = 180; // Max swipe distance
      setSwipeOffset(Math.min(diff, maxSwipe));
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsSwipeActive(false);
    
    // Snap to position
    if (swipeOffset > 60) {
      setSwipeOffset(180); // Snap to open
    } else {
      setSwipeOffset(0); // Snap to closed
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setStartX(e.clientX);
    setIsSwipeActive(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !isSwipeActive) return;
    
    const currentX = e.clientX;
    const diff = startX - currentX;
    
    if (diff > 0) {
      const maxSwipe = 180;
      setSwipeOffset(Math.min(diff, maxSwipe));
    }
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    setIsSwipeActive(false);
    
    if (swipeOffset > 60) {
      setSwipeOffset(180);
    } else {
      setSwipeOffset(0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setSwipeOffset(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative overflow-hidden rounded-lg"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Action Buttons Background */}
      <div className="absolute right-0 top-0 h-full flex items-center">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              className={cn(
                "h-full w-16 rounded-none border-0",
                action.color,
                "text-white hover:opacity-90"
              )}
              onClick={action.action}
              style={{
                transform: `translateX(${Math.max(0, 180 - swipeOffset)}px)`,
                transition: isSwipeActive ? 'none' : 'transform 0.3s ease-out'
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{action.label}</span>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Main Card */}
      <div
        className="relative bg-background"
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isSwipeActive ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <HoldingCard
          holding={holding}
          portfolioPercentage={portfolioPercentage}
          performance={holdingPerformance}
          onDiscuss={onDiscuss}
          onEdit={onEdit}
          onDelete={onDelete}
          onRefreshPrice={onRefreshPrice}
          isUpdatingPrice={isUpdatingPrice}
          refreshingTicker={refreshingTicker}
        />
      </div>
    </div>
  );
};

export default SwipeableHoldingCard;
