
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import AnalysisVisualCard from './AnalysisVisualCard';
import { Analysis } from '@/types/analysis';
import { useNavigate } from 'react-router-dom';

interface AnalysisCarouselProps {
  analyses: Analysis[];
  title: string;
  className?: string;
}

const AnalysisCarousel: React.FC<AnalysisCarouselProps> = ({
  analyses,
  title,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleDiscussWithAI = (analysis: Analysis) => {
    const contextData = {
      type: 'analysis' as const,
      id: analysis.id,
      title: analysis.title,
      data: analysis
    };
    navigate('/ai-chatt', { state: { contextData } });
  };

  if (!analyses || analyses.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {analyses.map((analysis) => (
            <CarouselItem 
              key={analysis.id} 
              className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <AnalysisVisualCard
                analysis={analysis}
                onDiscussWithAI={handleDiscussWithAI}
                size="large"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

export default AnalysisCarousel;
