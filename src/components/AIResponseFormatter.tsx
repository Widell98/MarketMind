
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Shield, BarChart3, Calendar, DollarSign } from 'lucide-react';

interface AIResponseFormatterProps {
  response: string;
}

const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({ response }) => {
  // Parse the AI response to extract different sections
  const parseResponse = (text: string) => {
    const sections = {
      analysis: '',
      optimization: '',
      strategies: '',
      instruments: '',
      rebalancing: '',
      taxOptimization: '',
      monitoring: '',
      actionPlan: ''
    };

    // Split by common section headers
    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('Nuvarande Portföljanalys') || trimmedLine.includes('Portföljanalys')) {
        currentSection = 'analysis';
      } else if (trimmedLine.includes('Optimeringsmöjligheter')) {
        currentSection = 'optimization';
      } else if (trimmedLine.includes('Allokeringsstrategier') || trimmedLine.includes('Strategier')) {
        currentSection = 'strategies';
      } else if (trimmedLine.includes('Instrumentförslag') || trimmedLine.includes('Förslag')) {
        currentSection = 'instruments';
      } else if (trimmedLine.includes('Rebalansering') || trimmedLine.includes('Exit-strategier')) {
        currentSection = 'rebalancing';
      } else if (trimmedLine.includes('Skatteoptimering')) {
        currentSection = 'taxOptimization';
      } else if (trimmedLine.includes('Uppföljning') || trimmedLine.includes('Metriker')) {
        currentSection = 'monitoring';
      } else if (trimmedLine.includes('Action Plan') || trimmedLine.includes('Månadlig')) {
        currentSection = 'actionPlan';
      } else if (currentSection && trimmedLine) {
        sections[currentSection as keyof typeof sections] += trimmedLine + '\n';
      }
    });

    return sections;
  };

  const sections = parseResponse(response);

  const formatBulletPoints = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.includes(':')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <span className="text-sm leading-relaxed">{trimmed.replace(/^-\s*/, '')}</span>
          </div>
        );
      }
      return (
        <p key={index} className="text-sm mb-2 leading-relaxed">{trimmed}</p>
      );
    });
  };

  return (
    <div className="space-y-4">
      {sections.analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Nuvarande Portföljanalys
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {formatBulletPoints(sections.analysis)}
          </CardContent>
        </Card>
      )}

      {sections.optimization && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Optimeringsmöjligheter
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {formatBulletPoints(sections.optimization)}
          </CardContent>
        </Card>
      )}

      {sections.strategies && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-purple-600" />
              Allokeringsstrategier
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {formatBulletPoints(sections.strategies)}
          </CardContent>
        </Card>
      )}

      {sections.instruments && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-4 h-4 text-orange-600" />
              Instrumentförslag
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {formatBulletPoints(sections.instruments)}
          </CardContent>
        </Card>
      )}

      {sections.rebalancing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-red-600" />
              Rebalansering & Exit-strategier
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {formatBulletPoints(sections.rebalancing)}
          </CardContent>
        </Card>
      )}

      {(sections.taxOptimization || sections.monitoring) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Skatteoptimering & Uppföljning
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {sections.taxOptimization && formatBulletPoints(sections.taxOptimization)}
            {sections.monitoring && formatBulletPoints(sections.monitoring)}
          </CardContent>
        </Card>
      )}

      {sections.actionPlan && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-green-800">
              <Calendar className="w-4 h-4 text-green-600" />
              Månadlig Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {formatBulletPoints(sections.actionPlan)}
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Viktigt:</strong> Detta är för utbildningsändamål och du bör diskutera med en licensierad rådgivare innan du fattar beslut.
        </p>
      </div>
    </div>
  );
};

export default AIResponseFormatter;
