import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConversationExporter from '@/components/ConversationExporter';
import { Download, Share2 } from 'lucide-react';

const ExportSharingSection = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Export & Delning
          </h2>
          <p className="text-sm text-muted-foreground">
            Exportera konversationer och analysresultat
          </p>
        </div>
      </div>

      {/* Feature Overview */}
      <Card className="border border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="w-5 h-5 text-green-600" />
            Exportfunktioner
          </CardTitle>
          <CardDescription>
            Spara och dela dina AI-konversationer och analysresultat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Download className="w-4 h-4 text-green-600" />
                  Exportmöjligheter
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Spara AI-konversationer för framtida referens</li>
                  <li>• Dela insikter med finansiella rådgivare</li>
                  <li>• Exportera i olika format (PDF, JSON)</li>
                  <li>• Bevara viktiga marknadsanalyser</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  Delningsfunktioner
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
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