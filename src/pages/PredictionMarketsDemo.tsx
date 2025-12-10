import React from "react";
import { PredictionMarketCard } from "@/components/PredictionMarketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

// MOCK DATA
const MOCK_MARKETS = [
  {
    id: "1",
    title: "Presidential Election Winner 2024",
    imageUrl: "https://polymarket.com/images/collections/us-election.png", 
    volume: "$3.2B",
    category: "Politics",
    outcomes: [
      { id: "o1", name: "Trump", price: 0.61 },
      { id: "o2", name: "Harris", price: 0.39 },
    ],
  },
  {
    id: "2",
    title: "Fed Interest Rate Cut in December?",
    imageUrl: "https://polymarket-upload.s3.us-east-2.amazonaws.com/fed-logo.png",
    volume: "$45m",
    category: "Economics",
    outcomes: [
      { id: "o3", name: "Yes", price: 0.82 },
      { id: "o4", name: "No", price: 0.18 },
    ],
  },
  {
    id: "3",
    title: "Bitcoin above $100k before 2025?",
    imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    volume: "$128m",
    category: "Crypto",
    outcomes: [
      { id: "o5", name: "Yes", price: 0.45 },
      { id: "o6", name: "No", price: 0.55 },
    ],
  },
];

const PredictionMarketsDemo = () => {
  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marknadsprognoser</h1>
          <p className="text-muted-foreground mt-1">
            Realtidsodds från världens största prediktionsmarknad.
          </p>
        </div>
        
        {/* Search / Filter Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Sök marknad..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_MARKETS.map((market) => (
          <PredictionMarketCard
            key={market.id}
            id={market.id}
            title={market.title}
            imageUrl={market.imageUrl}
            volume={market.volume}
            outcomes={market.outcomes}
            category={market.category}
          />
        ))}
      </div>

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-600 dark:text-blue-400">
        <p className="font-semibold mb-1">Demo Mode</p>
        <p>Visar just nu testdata. Integration med Polymarket API kommer härnäst.</p>
      </div>
    </div>
  );
};

export default PredictionMarketsDemo;
