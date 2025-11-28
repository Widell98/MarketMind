import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConversationExporter from '@/components/ConversationExporter';
import { Download, Share2 } from 'lucide-react';

const ExportSharingSection = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 shadow-lg flex-shrink-0">
          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-foreground break-words">
            Export & Delning
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Exportera konversationer och analysresultat
          </p>
        </div>
      </div>

      {/* Feature Overview */}
      <Card className="border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <span className="break-words">Exportfunktioner</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Spara och dela dina AI-konversationer och analysresultat
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                  <span className="break-words">Exportmöjligheter</span>
                </h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>• Spara AI-konversationer för framtida referens</li>
                  <li>• Dela insikter med finansiella rådgivare</li>
                  <li>• Exportera i olika format (PDF, JSON)</li>
                  <li>• Bevara viktiga marknadsanalyser</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  <span className="break-words">Delningsfunktioner</span>
                </h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>• Dela specifika konversationer</li>
                  <li>• Skapa sammanfattningar för rådgivare</li>
                  <li>• Exportera portföljinsikter</li>
                  <li>• Säker delning med lösenordsskydd</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Exporter */}
      <ConversationExporter />
    </div>
  );
};

export default ExportSharingSection;