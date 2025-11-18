import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import EnhancedRiskAssessmentForm from '@/components/EnhancedRiskAssessmentForm';
import ResetProfileConfirmDialog from '@/components/ResetProfileConfirmDialog';
import {
  Brain,
  Briefcase,
  CalendarClock,
  FileText,
  Layers3,
  LineChart,
  ListChecks,
  Loader2,
  Sparkles,
  Boxes,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const focusLabels: Record<string, string> = {
  macro: 'Makro – räntor, konjunktur och geopolitik',
  fundamental: 'Fundamental – kassaflöden, värderingar och kvalitet',
  technical: 'Teknisk – momentum, nivåer och volatilitet',
  mixed: 'Hybrid – kombination av flera analysstilar',
};

const depthLabels: Record<string, string> = {
  light: 'Snabb översikt – viktigaste datapunkterna',
  normal: 'Standard – balans mellan resonemang och data',
  deep: 'Djupdykning – multipla vinklar och scenarioanalyser',
};

const timeframeLabels: Record<string, string> = {
  short: 'Kort sikt (dagar–veckor)',
  medium: 'Medellång (3–12 månader)',
  long: 'Lång sikt (12+ månader)',
};

const outputLabels: Record<string, string> = {
  bullets: 'Punktlistor',
  paragraphs: 'Textstycken',
  equity_report: 'Equity research-stil',
  highlights: 'Snabba highlights',
};

const experienceLabels: Record<string, string> = {
  beginner: 'Nybörjare – enkel ton och extra förklaringar',
  intermediate: 'Erfaren – praktiska resonemang och kontext',
  advanced: 'Avancerad – djup analys med nyckeltal och modeller',
};

const modelPortfolioLabels: Record<string, string> = {
  defensive: 'Defensiva exempel',
  balanced: 'Balanserade upplägg',
  growth: 'Tillväxtorienterade case',
  thematic: 'Tematiska vinklar',
  broad: 'Breddade marknadsexponeringar',
};

const formatValue = (value: string | null | undefined, map: Record<string, string>) => {
  if (!value) return 'Ej angivet';
  return map[value] ?? 'Ej angivet';
};

const renderChipList = (items: string[] | null | undefined, emptyLabel: string) => {
  if (!items || items.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <Badge key={item} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
          {item}
        </Badge>
      ))}
    </div>
  );
};

const UserInvestmentAnalysis: React.FC = () => {
  const { riskProfile, loading, clearRiskProfile, refetch } = useRiskProfile();
  const [showEditor, setShowEditor] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const updatedAt = riskProfile?.updated_at
    ? new Date(riskProfile.updated_at).toLocaleDateString('sv-SE', { dateStyle: 'long' })
    : null;

  const questionBlocks = useMemo<{ title: string; answer: React.ReactNode; }[]>(() => {
    if (!riskProfile) return [];

    return [
      {
        title: 'Vilken typ av analyser vill du att MarketMind fokuserar på?',
        answer: formatValue(riskProfile.analysis_focus, focusLabels),
      },
      {
        title: 'Hur detaljerade analyser föredrar du?',
        answer: formatValue(riskProfile.analysis_depth, depthLabels),
      },
      {
        title: 'Vilken tidsram ska analyserna fokusera på?',
        answer: formatValue(riskProfile.analysis_timeframe, timeframeLabels),
      },
      {
        title: 'Hur vill du att AI presenterar sina analyser?',
        answer: formatValue(riskProfile.output_format, outputLabels),
      },
      {
        title: 'Vilka sektorer är du mest intresserad av?',
        answer: renderChipList(riskProfile.sector_interests, 'Inga sektorer angivna'),
      },
      {
        title: 'Vilka typer av tillgångar vill du att analyserna ska täcka?',
        answer: renderChipList(riskProfile.preferred_assets, 'Inga tillgångstyper angivna'),
      },
      {
        title: 'Vill du att analyser ska utgå från din befintliga portfölj?',
        answer:
          riskProfile.has_current_portfolio === true
            ? 'Ja – koppla insikter till mina befintliga innehav'
            : riskProfile.has_current_portfolio === false
              ? 'Nej – utgå från en tom portfölj'
              : 'Ej angivet',
      },
      {
        title: 'Hur erfaren är du som investerare?',
        answer: formatValue(riskProfile.investment_experience, experienceLabels),
      },
      {
        title: 'Vilken typ av modellportföljer vill du oftast se?',
        answer: formatValue(riskProfile.model_portfolio_style, modelPortfolioLabels),
      },
    ];
  }, [riskProfile]);

  const handleResetProfile = async () => {
    const success = await clearRiskProfile();
    if (success) {
      setShowResetDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!riskProfile) {
    return (
      <div className="space-y-6">
        <Card className="rounded-3xl border border-dashed border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Skapa din analysprofil</CardTitle>
            <CardDescription>
              Riskprofilen har ersatts av sju analystekniska frågor. Ditt svar styr ton, struktur och fokus i AI-chatten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Vilken typ av analyser vill du att MarketMind fokuserar på?</li>
              <li>Hur detaljerade analyser föredrar du?</li>
              <li>Vilken tidsram ska analyserna täcka?</li>
              <li>Hur vill du att AI presenterar sina analyser?</li>
              <li>Vilka sektorer är du mest intresserad av?</li>
              <li>Vilka tillgångstyper ska analyserna fokusera på?</li>
              <li>Vill du att analyserna ska utgå från din befintliga portfölj?</li>
            </ol>
          </CardContent>
        </Card>

        <EnhancedRiskAssessmentForm
          onComplete={() => {
            refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="rounded-3xl shadow-lg">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">Din analysprofil</CardTitle>
            <CardDescription>
              Preferenserna styr hur MarketMind resonerar i varje svar{updatedAt ? ` · Uppdaterad ${updatedAt}` : ''}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowEditor(true)} className="rounded-xl">
              Uppdatera preferenser
            </Button>
            <Button variant="outline" onClick={() => setShowResetDialog(true)} className="rounded-xl">
              Återställ analysprofil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PreferenceCard
              icon={<LineChart className="h-5 w-5 text-primary" />}
              title="Analysfokus"
              value={formatValue(riskProfile.analysis_focus, focusLabels)}
            />
            <PreferenceCard
              icon={<Layers3 className="h-5 w-5 text-primary" />}
              title="Analysdjup"
              value={formatValue(riskProfile.analysis_depth, depthLabels)}
            />
            <PreferenceCard
              icon={<CalendarClock className="h-5 w-5 text-primary" />}
              title="Analysens tidsperspektiv"
              value={formatValue(riskProfile.analysis_timeframe, timeframeLabels)}
            />
            <PreferenceCard
              icon={<FileText className="h-5 w-5 text-primary" />}
              title="Output-format"
              value={formatValue(riskProfile.output_format, outputLabels)}
            />
            <PreferenceCard
              icon={<Brain className="h-5 w-5 text-primary" />}
              title="Erfarenhetsnivå"
              value={formatValue(riskProfile.investment_experience, experienceLabels)}
            />
            <PreferenceCard
              icon={<Briefcase className="h-5 w-5 text-primary" />}
              title="Portföljkontext"
              value={
                riskProfile.has_current_portfolio === true
                  ? 'Ja, använd mina befintliga innehav'
                  : riskProfile.has_current_portfolio === false
                    ? 'Nej, skapa analyser från grunden'
                    : 'Ej angivet'
              }
            />
            <PreferenceCard
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              title="Modellportföljer"
              value={formatValue(riskProfile.model_portfolio_style, modelPortfolioLabels)}
            />
            <PreferenceCard
              icon={<ListChecks className="h-5 w-5 text-primary" />}
              title="Sektorintressen"
              valueNode={renderChipList(riskProfile.sector_interests, 'Inga valda sektorer')}
            />
            <PreferenceCard
              icon={<Boxes className="h-5 w-5 text-primary" />}
              title="Tillgångstyper"
              valueNode={renderChipList(riskProfile.preferred_assets, 'Inga valda tillgångar')}
            />
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Du kan alltid justera profilens parametrar direkt i chatten genom att skriva till exempel “Kör mer teknisk analys” eller
          “Sammanfatta kortare”.
        </CardFooter>
      </Card>

      <Card className="rounded-3xl border border-muted/60">
        <CardHeader>
          <CardTitle>Frågorna som styr AI:n</CardTitle>
          <CardDescription>Så här svarade du på de sju analytikerfrågorna (plus modellportfölj-stilen).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionBlocks.map(block => (
            <div key={block.title} className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.title}</p>
              <div className="mt-2 text-base font-medium text-foreground">{block.answer}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uppdatera analysprofil</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <EnhancedRiskAssessmentForm
              onComplete={() => {
                setShowEditor(false);
                refetch();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ResetProfileConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetProfile}
      />
    </div>
  );
};

interface PreferenceCardProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  valueNode?: React.ReactNode;
}

const PreferenceCard: React.FC<PreferenceCardProps> = ({ icon, title, value, valueNode }) => (
  <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      {icon}
      {title}
    </div>
    <div className="text-base font-medium text-foreground">
      {valueNode ?? value ?? 'Ej angivet'}
    </div>
  </div>
);

export default UserInvestmentAnalysis;
