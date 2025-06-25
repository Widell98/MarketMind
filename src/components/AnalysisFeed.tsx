
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Brain, BookOpen, TrendingUp, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const AnalysisFeed = () => {
  // Mock data för community-analyser
  const analyses = [
    {
      id: 1,
      type: 'market_insight',
      title: 'Varför svenska biotech-bolag är undervärderade just nu',
      content: 'Efter att ha analyserat sektorn under flera månader ser jag tydliga tecken på att marknaden missförstår potentialen inom svensk biotech. Flera bolag handlas till rabatt jämfört med internationella motsvarigheter...',
      author: {
        name: 'Anna Petersson',
        username: 'anna_p',
        avatar: 'AP',
        level: 'Expert'
      },
      timeAgo: '3 timmar sedan',
      likes: 24,
      comments: 8,
      shares: 3,
      tags: ['Biotech', 'Analys', 'Undervärderad']
    },
    {
      id: 2,
      type: 'case_analysis',
      title: 'Djupanalys: Evolution Gaming - Vad händer efter AI-hot?',
      content: 'Evolution Gaming har varit en fantastisk investering, men nu när AI börjar hota vissa delar av gaming-industrin måste vi omvärdera. Här är min analys av bolagets framtida konkurrenskraft...',
      author: {
        name: 'Marcus Lindberg',
        username: 'marcus_invest',
        avatar: 'ML',
        level: 'Advanced'
      },
      timeAgo: '5 timmar sedan',
      likes: 31,
      comments: 12,
      shares: 7,
      tags: ['Evolution Gaming', 'AI-påverkan', 'Gaming']
    },
    {
      id: 3,
      type: 'portfolio_share',
      title: 'Min Q2 2025 portfolio - fokus på hållbarhet och tech',
      content: 'Delar min nuvarande portfolioallokering som har presterat +18% hittills i år. Fokus ligger på hållbara tech-bolag med stark global position...',
      author: {
        name: 'Sarah Chen',
        username: 'sarah_esg',
        avatar: 'SC',
        level: 'Expert'
      },
      timeAgo: '1 dag sedan',
      likes: 45,
      comments: 19,
      shares: 15,
      tags: ['Portfolio', 'ESG', 'Tech', '+18%'],
      portfolioData: {
        performance: '+18%',
        holdings: 12,
        riskScore: 6
      }
    },
    {
      id: 4,
      type: 'reflection',
      title: 'Lärdomar från ett år av systematic value investing',
      content: 'Efter ett år av att följa Benjamin Grahams principer på Stockholmsbörsen vill jag dela mina viktigaste lärdomar. Både framgångar och misstag...',
      author: {
        name: 'Johan Eriksson',
        username: 'johan_value',
        avatar: 'JE',
        level: 'Intermediate'
      },
      timeAgo: '2 dagar sedan',
      likes: 18,
      comments: 25,
      shares: 4,
      tags: ['Value Investing', 'Reflektion', '1 år']
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'market_insight':
        return <Brain className="w-4 h-4" />;
      case 'case_analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'portfolio_share':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'case_analysis':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'portfolio_share':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'Market Insight';
      case 'case_analysis':
        return 'Case Analysis';
      case 'portfolio_share':
        return 'Portfolio Share';
      default:
        return 'Reflection';
    }
  };

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-gray-100 dark:border-gray-700">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                    {analysis.author.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {analysis.author.name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {analysis.author.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{analysis.author.username} • {analysis.timeAgo}
                  </p>
                </div>
              </div>
              <Badge className={`${getTypeColor(analysis.type)} flex items-center gap-1 px-2 py-1 border text-xs`}>
                {getTypeIcon(analysis.type)}
                {getTypeLabel(analysis.type)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                {analysis.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                {analysis.content}
              </p>
            </div>

            {/* Portfolio Performance (for portfolio_share type) */}
            {analysis.type === 'portfolio_share' && analysis.portfolioData && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Performance</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{analysis.portfolioData.performance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Holdings</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{analysis.portfolioData.holdings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Risk Score</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400">{analysis.portfolioData.riskScore}/10</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {analysis.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Engagement */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 px-2">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{analysis.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 px-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{analysis.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 px-2">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">{analysis.shares}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Läs mer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalysisFeed;
