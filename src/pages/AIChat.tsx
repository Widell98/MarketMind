
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import AIChat from '@/components/AIChat';
import { Card } from '@/components/ui/card';
import { Brain, MessageSquare } from 'lucide-react';

const AIChatPage = () => {
  const [searchParams] = useSearchParams();
  const stockName = searchParams.get('stock');
  const message = searchParams.get('message');

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px]">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-primary shadow-lg">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1 text-foreground">
                  AI-Assistent
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {stockName ? `Diskutera ${stockName}` : 'Din personliga investeringsrådgivare'}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <Card className="bg-card border shadow-lg rounded-2xl overflow-hidden">
            <AIChat 
              portfolioId={undefined} 
              initialStock={stockName} 
              initialMessage={message}
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AIChatPage;
