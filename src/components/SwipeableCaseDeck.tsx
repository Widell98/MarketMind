import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Info, Layers, RotateCw, Sparkles, X } from 'lucide-react';
import { StockCase } from '@/types/stockCase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SwipeableCaseDeckProps {
  cases: StockCase[];
  onLike?: (stockCase: StockCase) => Promise<void> | void;
  onSkip?: (stockCase: StockCase) => void;
  onEmpty?: () => void;
  onViewDetails?: (id: string) => void;
  onUndoSwipe?: (args: { stockCase: StockCase; direction: SwipeDirection }) => Promise<void> | void;
}

type SwipeDirection = 'left' | 'right';

type Point = {
  x: number;
  y: number;
};

const SWIPE_THRESHOLD = 120;

const SwipeableCaseDeck: React.FC<SwipeableCaseDeckProps> = ({
  cases,
  onLike,
  onSkip,
  onEmpty,
  onViewDetails,
  onUndoSwipe,
}) => {
  const [queue, setQueue] = useState<StockCase[]>(cases);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<{ stockCase: StockCase; direction: SwipeDirection }[]>([]);

  const startPointRef = useRef<Point | null>(null);

  useEffect(() => {
    setQueue(cases);
    setActiveIndex(0);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsAnimating(false);
    setHistory([]);
  }, [cases]);

  const activeCase = queue[activeIndex];
  const remainingCount = Math.max(queue.length - activeIndex - 1, 0);

  useEffect(() => {
    const hasDepletedQueue = queue.length === 0 || activeIndex >= queue.length;
    if (hasDepletedQueue && onEmpty) {
      onEmpty();
    }
  }, [activeIndex, onEmpty, queue.length]);

  const resetDragState = () => {
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    startPointRef.current = null;
  };

  const restartDeck = () => {
    setActiveIndex(0);
    setHistory([]);
    resetDragState();
    setIsAnimating(false);
  };

  const animateAndAdvance = async (direction: SwipeDirection) => {
    if (!activeCase || isAnimating) return;

    setIsAnimating(true);
    const exitX = direction === 'right' ? 900 : -900;
    setDragOffset({ x: exitX, y: 0 });

    setTimeout(async () => {
      if (direction === 'right') {
        await onLike?.(activeCase);
      } else {
        onSkip?.(activeCase);
      }

      setHistory((prev) => [...prev.slice(-9), { stockCase: activeCase, direction }]);
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      setDragOffset({ x: 0, y: 0 });
      setIsAnimating(false);
      resetDragState();
    }, 220);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeCase || isAnimating) return;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !startPointRef.current) return;

    const deltaX = event.clientX - startPointRef.current.x;
    const deltaY = event.clientY - startPointRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    const direction: SwipeDirection | null =
      dragOffset.x > SWIPE_THRESHOLD
        ? 'right'
        : dragOffset.x < -SWIPE_THRESHOLD
          ? 'left'
          : null;

    if (direction) {
      animateAndAdvance(direction);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }

    resetDragState();
  };

  const handleUndo = async () => {
    if (isAnimating || history.length === 0) return;

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setActiveIndex((prev) => Math.max(prev - 1, 0));
    setDragOffset({ x: 0, y: 0 });
    setIsAnimating(false);
    setIsDragging(false);
    await onUndoSwipe?.(last);
  };

  const cardStyle = useMemo(() => {
    const rotate = dragOffset.x / 18;
    const isActive = !!activeCase;
    return {
      transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`,
      transition: isDragging || isAnimating || !isActive ? 'none' : 'transform 0.25s ease, box-shadow 0.25s ease',
    } as React.CSSProperties;
  }, [activeCase, dragOffset, isAnimating, isDragging]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Upptäck nästa bolag</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs">
            {remainingCount > 0 ? `${remainingCount} kvar` : 'Sista kortet'}
          </Badge>
          <Badge className="rounded-full bg-primary/10 text-primary">{queue.length} case</Badge>
        </div>
      </div>

      {activeCase ? (
        <div className="relative h-[520px] w-full">
          <Card
            className="absolute inset-0 flex cursor-grab flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-background via-background/80 to-background shadow-xl"
            style={cardStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{activeCase.company_name}</p>
                    <h3 className="text-xl font-bold leading-tight text-foreground">{activeCase.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeCase.profiles?.display_name || activeCase.profiles?.username || 'Okänd analytiker'} ·{' '}
                      {new Date(activeCase.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
                <Badge variant={activeCase.ai_generated ? 'secondary' : 'outline'} className="rounded-full px-3 py-1 text-xs">
                  {activeCase.ai_generated ? 'AI-genererat' : 'Community'}
                </Badge>
              </div>

              <div className="h-[220px] overflow-hidden rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {activeCase.long_description || activeCase.description || 'Ingen beskrivning tillgänglig.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {activeCase.sector && <Badge variant="outline" className="rounded-full">{activeCase.sector}</Badge>}
                {typeof activeCase.performance_percentage === 'number' && (
                  <Badge
                    variant="outline"
                    className={`rounded-full ${activeCase.performance_percentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {activeCase.performance_percentage >= 0 ? '▲' : '▼'} {activeCase.performance_percentage.toFixed(2)}%
                  </Badge>
                )}
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  {activeCase.likes_count ?? 0} gillningar
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary/70" />
                  <span>Svajpa höger för att gilla, vänster för att hoppa över.</span>
                </div>
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onViewDetails(activeCase.id)}
                  >
                    <Info className="mr-2 h-4 w-4" /> Visa detaljer
                  </Button>
                )}
              </div>
            </CardContent>

            <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-6">
              <div
                className={`rounded-2xl border bg-background/80 px-4 py-2 text-lg font-semibold text-red-500 shadow-sm transition-all duration-200 ${
                  isDragging && dragOffset.x < -SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Hoppa över
              </div>
              <div
                className={`rounded-2xl border bg-background/80 px-4 py-2 text-lg font-semibold text-emerald-500 shadow-sm transition-all duration-200 ${
                  isDragging && dragOffset.x > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Gilla
              </div>
            </div>
          </Card>

          {queue[activeIndex + 1] && (
            <div className="absolute inset-0 translate-y-3 scale-[0.99] rounded-3xl border border-dashed border-border/50 bg-muted/40" />
          )}
        </div>
      ) : (
        <div className="flex h-[420px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/70 bg-muted/30 text-center shadow-inner">
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Inga fler case att visa</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Uppdatera dina filter eller starta om kortleken för att svajpa igen.
            </p>
          </div>
          <Button variant="secondary" className="rounded-full" onClick={restartDeck}>
            <RotateCw className="mr-2 h-4 w-4" />
            Starta om kortleken
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Heart className="h-4 w-4" />
          <span>Gilla bolaget för att spara det till fliken "Gillade företag".</span>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            className="w-full rounded-full sm:w-auto"
            onClick={() => animateAndAdvance('left')}
            disabled={!activeCase || isAnimating}
          >
            <X className="mr-2 h-4 w-4" /> Hoppa över
          </Button>
          <Button
            className="w-full rounded-full sm:w-auto"
            onClick={() => animateAndAdvance('right')}
            disabled={!activeCase || isAnimating}
          >
            <Heart className="mr-2 h-4 w-4" /> Gilla
          </Button>
          <Button
            variant="secondary"
            className="w-full rounded-full sm:w-auto"
            onClick={handleUndo}
            disabled={history.length === 0 || isAnimating}
          >
            <Sparkles className="mr-2 h-4 w-4" /> Ångra
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwipeableCaseDeck;
