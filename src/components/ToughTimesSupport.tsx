
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Shield, 
  TrendingDown, 
  Coffee,
  Lightbulb,
  Target,
  Calendar,
  MessageCircle
} from 'lucide-react';

interface ToughTimesSupportProps {
  marketVolatility: 'low' | 'medium' | 'high';
  portfolioChange: number; // Percentage change
  onSupportChat: (message: string) => void;
}

const ToughTimesSupport: React.FC<ToughTimesSupportProps> = ({
  marketVolatility,
  portfolioChange,
  onSupportChat
}) => {
  const [showSupport, setShowSupport] = useState(false);
  const [supportLevel, setSupportLevel] = useState<'calm' | 'gentle' | 'crisis'>('calm');

  useEffect(() => {
    // Determine if we should show support based on market conditions
    const shouldShowSupport = 
      marketVolatility === 'high' || 
      portfolioChange < -5 || 
      (marketVolatility === 'medium' && portfolioChange < -3);
    
    setShowSupport(shouldShowSupport);
    
    // Set support level
    if (portfolioChange < -10 || marketVolatility === 'high') {
      setSupportLevel('crisis');
    } else if (portfolioChange < -5 || marketVolatility === 'medium') {
      setSupportLevel('gentle');
    } else {
      setSupportLevel('calm');
    }
  }, [marketVolatility, portfolioChange]);

  const supportMessages = {
    crisis: {
      title: "Håll huvudet högt! 💪",
      description: "Tuffa tider på marknaden är tillfälliga. Din AI-rådgivare finns här för dig.",
      color: "border-red-200 bg-red-50",
      icon: Shield,
      quotes: [
        "Marknader går upp och ner, men långsiktigt tänkande vinner alltid.",
        "De bästa investerarna håller fast vid sin strategi i svåra tider.",
        "Denna volatilitet är tillfällig - dina mål är långsiktiga."
      ]
    },
    gentle: {
      title: "Vi navigerar detta tillsammans 🧭",
      description: "Lite marknadsoro är normalt. Låt oss prata igenom det.",
      color: "border-yellow-200 bg-yellow-50",
      icon: Heart,
      quotes: [
        "Små dips är helt normala i en hälsosam marknad.",
        "Du har en bra långsiktig strategi - håll fast vid den.",
        "Perfekt tid att tänka på dina ursprungliga investeringsmål."
      ]
    },
    calm: {
      title: "Allt ser bra ut! ✨",
      description: "Marknaderna är stabila och din portfölj utvecklas som förväntat.",
      color: "border-green-200 bg-green-50",
      icon: Target,
      quotes: [
        "Bra jobbat med att hålla fast vid din strategi!",
        "Stabil utveckling är ofta bättre än dramatiska svängningar.",
        "Du är på rätt väg mot dina investeringsmål."
      ]
    }
  };

  const currentSupport = supportMessages[supportLevel];
  const Icon = currentSupport.icon;

  const supportActions = [
    {
      text: "Hjälp mig förstå vad som händer",
      message: "Kan du förklara vad som händer på marknaden just nu och hur det påverkar min portfölj? Jag känner mig lite orolig."
    },
    {
      text: "Påminn mig om mina mål",
      message: "Kan du påminna mig om varför jag investerar och vad mina långsiktiga mål är? Jag behöver lite perspektiv."
    },
    {
      text: "Vad ska jag göra nu?",
      message: "Baserat på nuvarande marknadsläge, vad rekommenderar du att jag gör eller inte gör med min portfölj?"
    },
    {
      text: "Berätta om liknande situationer",
      message: "Kan du berätta om tidigare marknadsperioder som liknar denna och hur det gick för långsiktiga investerare?"
    }
  ];

  if (!showSupport && supportLevel === 'calm') {
    return null; // Don't show component when everything is calm
  }

  return (
    <Card className={`${currentSupport.color} border-l-4`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {currentSupport.title}
        </CardTitle>
        <CardDescription>
          {currentSupport.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Market Context */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Marknadsläge:</span>
            <Badge variant={
              marketVolatility === 'high' ? 'destructive' : 
              marketVolatility === 'medium' ? 'default' : 'secondary'
            }>
              {marketVolatility === 'high' ? 'Volatilt' : 
               marketVolatility === 'medium' ? 'Måttligt' : 'Stabilt'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Portföljförändring:</span>
            <span className={portfolioChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {portfolioChange > 0 ? '+' : ''}{portfolioChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Inspirational Quote */}
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="italic">
            "{currentSupport.quotes[Math.floor(Math.random() * currentSupport.quotes.length)]}"
          </AlertDescription>
        </Alert>

        {/* Support Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Jag kan hjälpa dig med:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {supportActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto p-2 whitespace-normal"
                onClick={() => onSupportChat(action.message)}
              >
                {action.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Breathing Space */}
        {supportLevel === 'crisis' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">Ta en paus</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Känslomässiga beslut är sällan bra investeringsbeslut. Ta en kopp kaffe, 
              prata med din AI-rådgivare, och kom ihåg att detta kommer att gå över.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ToughTimesSupport;
