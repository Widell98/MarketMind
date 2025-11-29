import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flag, Award, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Milestone {
  percentage: number;
  label: string;
  icon: React.ElementType;
  color: string;
  achieved: boolean;
}

interface MilestonesProps {
  progress: number;
}

export const Milestones = ({ progress }: MilestonesProps) => {
  const [celebrated, setCelebrated] = useState<number[]>([]);

  const milestones: Milestone[] = [
    { percentage: 25, label: 'Första steget! 🏃', icon: Flag, color: 'text-blue-500', achieved: progress >= 25 },
    { percentage: 50, label: 'Halvvägs! ⭐', icon: Award, color: 'text-yellow-500', achieved: progress >= 50 },
    { percentage: 75, label: 'Snart där! 🚀', icon: Trophy, color: 'text-orange-500', achieved: progress >= 75 },
    { percentage: 100, label: 'MÅLGÅNG! 🏆', icon: Trophy, color: 'text-green-500', achieved: progress >= 100 },
  ];

  useEffect(() => {
    // Check for newly achieved milestones to celebrate
    const newMilestone = milestones.find(m => m.achieved && !celebrated.includes(m.percentage));
    
    if (newMilestone) {
      // Only celebrate if it's a significant jump (e.g. not on initial load of 0->50)
      // For now, let's just trigger it if it's 100%
      if (newMilestone.percentage === 100) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      setCelebrated(prev => [...prev, newMilestone.percentage]);
    }
  }, [progress, celebrated]);

  return (
    <div className="relative h-2 w-full mt-2">
      {milestones.map((milestone) => {
        // Adjust position so 100% doesn't overflow container
        const leftPos = Math.min(milestone.percentage, 96); 
        
        return (
          <div 
            key={milestone.percentage}
            className="absolute top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-10"
            style={{ left: `${leftPos}%` }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300
                    ${milestone.achieved 
                      ? `border-primary scale-110 ${milestone.color}` 
                      : 'border-muted text-muted-foreground opacity-50 grayscale'}
                  `}>
                    <milestone.icon className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold">
                  <p>{milestone.label}</p>
                  <p className="text-[10px] text-muted-foreground font-normal">{milestone.percentage}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      })}
    </div>
  );
};


