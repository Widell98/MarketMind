import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { PolymarketMarketDetail } from "@/types/polymarket";

type SortBy = 'volume' | 'endDate' | 'question' | 'odds';
type SortOrder = 'asc' | 'desc';

interface PredictionMarketsTableProps {
  markets: PolymarketMarketDetail[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  onSort?: (column: SortBy) => void;
}

export const PredictionMarketsTable = ({ 
  markets, 
  sortBy = 'volume', 
  sortOrder = 'desc',
  onSort 
}: PredictionMarketsTableProps) => {
  const navigate = useNavigate();

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('sv-SE', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSort = (column: SortBy) => {
    if (onSort) {
      onSort(column);
    }
  };

  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: SortBy; 
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortBy === column;
    return (
      <TableHead 
        className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{children}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="rounded-md border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="question" className="min-w-[200px]">
                Fråga
              </SortableHeader>
              <SortableHeader column="odds" className="min-w-[150px]">
                Odds
              </SortableHeader>
              <SortableHeader column="volume" className="text-right min-w-[100px]">
                Volym
              </SortableHeader>
              <SortableHeader column="endDate" className="min-w-[120px]">
                Slutdatum
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.map((market) => {
              const displayOutcomes = market.outcomes.slice(0, 2);

              return (
                <TableRow
                  key={market.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/predictions/${market.slug}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {market.imageUrl && (
                        <div className="w-10 h-10 shrink-0 rounded-md bg-muted border border-border/50 relative overflow-hidden">
                          <img
                            src={market.imageUrl}
                            alt={market.question}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <span className="font-medium line-clamp-2">{market.question}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      {displayOutcomes.map((outcome, idx) => {
                        const percent = Math.min(100, Math.max(0, Math.round((outcome.price || 0) * 100)));
                        const titleLower = outcome.title.toLowerCase();
                        
                        let barColorClass = "bg-secondary";
                        let textColorClass = "text-foreground";

                        if (titleLower === 'yes') {
                          barColorClass = "bg-green-600 dark:bg-green-500";
                          textColorClass = "text-green-950 dark:text-green-50";
                        } else if (titleLower === 'no') {
                          barColorClass = "bg-red-600 dark:bg-red-500";
                          textColorClass = "text-red-950 dark:text-red-50";
                        }

                        return (
                          <div
                            key={idx}
                            className="relative h-7 rounded-md overflow-hidden bg-secondary/20 border border-black/5 dark:border-white/5"
                          >
                            <div
                              className={cn(
                                "absolute left-0 top-0 h-full transition-all duration-500 ease-out opacity-25 dark:opacity-30",
                                barColorClass
                              )}
                              style={{ width: `${percent}%` }}
                            />
                            <div className={cn(
                              "relative z-10 flex items-center justify-between h-full px-2 text-xs font-medium",
                              textColorClass
                            )}>
                              <span className="truncate mr-2 font-semibold">
                                {outcome.title}
                              </span>
                              <span className="font-bold">{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatVolume(market.volume || market.volumeNum || 0)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {market.endDate ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(market.endDate)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

