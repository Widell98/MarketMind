
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PieChart, Activity, Zap, TrendingUp, Lightbulb, Sparkles } from 'lucide-react';

interface ExamplePrompt {
  title: string;
  prompt: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

interface ModernExamplePromptsProps {
  onExampleClick: (prompt: string) => void;
}

const ModernExamplePrompts = ({ onExampleClick }: ModernExamplePromptsProps) => {
  const examplePrompts: ExamplePrompt[] = [
    {
      title: "Portföljanalys",
      prompt: "Ge mig en komplett analys av min portfölj med rekommendationer för optimering",
      icon: <PieChart className="w-5 h-5" />,
      description: "Få en genomgång av din portföljs prestanda och struktur",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Riskhantering", 
      prompt: "Analysera riskerna i min portfölj och föreslå strategier för bättre diversifiering",
      icon: <Activity className="w-5 h-5" />,
      description: "Identifiera och minimera risker för en mer balanserad portfölj",
      gradient: "from-red-500 to-pink-600"
    },
    {
      title: "Investeringsförslag",
      prompt: "Vilka aktier och tillgångar borde jag överväga nästa baserat på min profil?",
      icon: <Zap className="w-5 h-5" />,
      description: "Få personliga rekommendationer baserade på din riskprofil",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Marknadsinsikter",
      prompt: "Vad händer på marknaden just nu och hur påverkar det min investeringsstrategi?",
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Håll dig uppdaterad med aktuella marknadstrender",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/10 dark:border-gray-700/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Kom igång med AI-assistenten
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Välj ett förslag nedan eller skriv din egen fråga
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {examplePrompts.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              className="group h-auto p-0 text-left justify-start transition-all duration-300 hover:scale-[1.02] active:scale-95 overflow-hidden rounded-2xl border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl"
              onClick={() => onExampleClick(example.prompt)}
            >
              <div className="flex items-start gap-3 w-full p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${example.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 text-white`}>
                  {example.icon}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="font-semibold text-sm leading-tight text-gray-900 dark:text-white">
                    {example.title}
                  </div>
                  <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 break-words">
                    {example.description}
                  </div>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ModernExamplePrompts;
