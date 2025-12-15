// Prompt building logic for portfolio-ai-chat

import { IntentType } from './intent-types.ts';
import type { MacroTheme, AnalysisAngle, AnalysisFocusSignals } from './types.ts';

// ============================================================================
// Base Prompt Types and Constants
// ============================================================================

export type BasePromptOptions = {
  shouldOfferFollowUp: boolean;
  expertiseLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  preferredResponseLength?: 'concise' | 'balanced' | 'detailed' | null;
  respectRiskProfile?: boolean;
  includeTranslationDirective?: boolean;
  enableEmojiGuidance?: boolean;
  enableHeadingGuidance?: boolean;
  enforceTickerFormat?: boolean;
};

const CORE_PERSONA_PROMPT = `KÄRNROLL:
- Du är en licensierad svensk finansiell rådgivare som ger handlingsbara aktie- och portföljinsikter utan att genomföra affärer.
- Håll tonen professionell men dialogvänlig och visa att du följer användarens profil.`;

const STYLE_GUARDRAILS = `STIL & FORMAT:
- Bekräfta korta profiluppdateringar innan du ger råd.
- Använd svensk finansterminologi, väv in Tavily-källor endast när realtidsdata används och låt gränssnittet hantera disclaimern.
- Föredra stycken om 2–3 meningar och begränsa eventuella punktlistor till högst tre korta rader.`;

const SWEDISH_TRANSLATION_DIRECTIVE = `SPRÅKBRYGGAN:
- Om användarens senaste fråga är på svenska: översätt den internt till engelska för reasoning och tillbaka till naturlig svenska i svaret.`;

const EMOJI_POLICY_DIRECTIVE = `EMOJI-POLICY:
- Emojis används endast som diskreta markörer (max en per sektion) och aldrig när du beskriver förluster eller känsliga risker.`;

const HEADING_POLICY_DIRECTIVE = `RUBRIKER:
- Använd högst två rubriker när de förtydligar svaret och nämn aldrig rubriker som du inte fyller med text.`;

const TICKER_POLICY_DIRECTIVE = `AKTIEFÖRSLAG:
- Endast börsnoterade bolag och formatet ska vara Företagsnamn (TICKER) följt av en kort motivering.`;

// ============================================================================
// Base Prompt Builder
// ============================================================================

export const buildBasePrompt = (options: BasePromptOptions): string => {
  const sections: string[] = [CORE_PERSONA_PROMPT, STYLE_GUARDRAILS];
  const personalizationLines: string[] = [];

  if (options.expertiseLevel === 'beginner') {
    personalizationLines.push('- Förklara viktiga finansterminer enkelt och ge bakgrund om användaren kan behöva det.');
  } else if (options.expertiseLevel === 'advanced') {
    personalizationLines.push('- Du kan använda teknisk finansterminologi och fokusera på kärnanalysen utan långa grundförklaringar.');
  }

  if (options.preferredResponseLength === 'concise') {
    personalizationLines.push('- Håll svaren korta (2–4 meningar) när frågan är enkel eller faktabaserad.');
  } else if (options.preferredResponseLength === 'detailed') {
    personalizationLines.push('- Var generös med detaljer och förklaringar när det tillför värde.');
  }

  if (options.shouldOfferFollowUp) {
    personalizationLines.push('- Avsluta med en naturlig, öppen följdfråga när det passar kontexten.');
  } else {
    personalizationLines.push('- Hoppa över avslutande följdfrågor om de inte tillför något i just detta svar.');
  }

  if (options.respectRiskProfile === true) {
    personalizationLines.push('- Använd riskprofilen denna gång eftersom användaren bad om riskanpassade råd.');
  } else if (options.respectRiskProfile === false) {
    personalizationLines.push('- Låt riskprofilen vara åt sidan tills användaren uttryckligen ber om risknivå eller riskhantering.');
  }

  if (options.includeTranslationDirective) {
    sections.push(SWEDISH_TRANSLATION_DIRECTIVE);
  }

  if (options.enableEmojiGuidance) {
    sections.push(EMOJI_POLICY_DIRECTIVE);
  }

  if (options.enableHeadingGuidance) {
    sections.push(HEADING_POLICY_DIRECTIVE);
  }

  if (options.enforceTickerFormat) {
    sections.push(TICKER_POLICY_DIRECTIVE);
  }

  if (personalizationLines.length > 0) {
    sections.push(`RESPONSPREFERENSER:\n${personalizationLines.join('\n')}`);
  }

  return sections.join('\n');
};

// ============================================================================
// Macro Theme Helpers
// ============================================================================

type MacroThemeDefinition = {
  theme: MacroTheme;
  patterns: RegExp[];
  instruction: string;
};

const MACRO_THEME_DEFINITIONS: MacroThemeDefinition[] = [
  {
    theme: 'inflation',
    patterns: [/inflation/i, /prisökning/i, /kpi/i],
    instruction: '- Lyft hur inflation och prispress påverkar efterfrågan och värderingar när du beskriver makrobilden.'
  },
  {
    theme: 'rates',
    patterns: [/ränt/i, /riksbank/i, /centralbank/i, /fed/i, /ecb/i],
    instruction: '- Koppla resonemangen till ränteläget och centralbankernas signaler när användaren fokuserar på det.'
  },
  {
    theme: 'growth',
    patterns: [/konjunktur/i, /bnp/i, /pmi/i, /arbetsmarknad/i, /tillväxt/i],
    instruction: '- Beskriv konjunktur- och tillväxttrender samt hur de spiller över på mikro- och sektornivå.'
  }
];

export const isMacroTheme = (value: unknown): value is MacroTheme =>
  typeof value === 'string' && MACRO_THEME_DEFINITIONS.some(def => def.theme === value);

const detectMacroThemeInText = (text: string): MacroTheme | null => {
  if (!text) return null;
  for (const definition of MACRO_THEME_DEFINITIONS) {
    if (definition.patterns.some(pattern => pattern.test(text))) {
      return definition.theme;
    }
  }
  return null;
};

export const detectMacroThemeFromMessages = (messages: string[]): MacroTheme | null => {
  for (const msg of messages) {
    const detected = detectMacroThemeInText(msg);
    if (detected) return detected;
  }
  return null;
};

export const getMacroInstruction = (theme: MacroTheme | null | undefined): string | null => {
  if (!theme) return null;
  const definition = MACRO_THEME_DEFINITIONS.find(def => def.theme === theme);
  return definition ? definition.instruction : null;
};

// ============================================================================
// Analysis Angle Helpers
// ============================================================================

const ANALYSIS_ANGLE_DEFINITIONS: Record<AnalysisAngle, { patterns: RegExp[]; instruction: string }> = {
  cash_flow: {
    patterns: [/kassaflöde/i, /cash flow/i, /fritt kassaflöde/i],
    instruction: '- Betona kassaflöden, skuldsättning och balansräkning när du diskuterar bolagets mikrobild.'
  },
  margin_focus: {
    patterns: [/marginal/i, /lönsamhet/i, /ebit/i, /ebitda/i],
    instruction: '- Beskriv marginaler och kostnadskontroll för att matcha användarens fokus på lönsamhet.'
  },
  demand: {
    patterns: [/orderbok/i, /pipeline/i, /kundtillväxt/i, /orderingång/i],
    instruction: '- Kommentera orderläge och efterfrågan så att användaren får tydligt mikro-perspektiv.'
  },
  capital_allocation: {
    patterns: [/återköp/i, /utdelning/i, /kapitalallokering/i, /kapitalstruktur/i],
    instruction: '- Resonera kring kapitalallokering (utdelningar/återköp) när användaren lyfter utdelningsstrategier.'
  }
};

export const isAnalysisAngle = (value: unknown): value is AnalysisAngle =>
  typeof value === 'string' && value in ANALYSIS_ANGLE_DEFINITIONS;

export const getAnalysisAngleInstruction = (angle: AnalysisAngle): string =>
  ANALYSIS_ANGLE_DEFINITIONS[angle]?.instruction ?? '';

// ============================================================================
// Intent Prompt Builder
// ============================================================================

export type IntentPromptContext = {
  intent: IntentType;
  focus?: AnalysisFocusSignals;
  referencesPersonalInvestments?: boolean;
  macroTheme?: MacroTheme | null;
};

const NO_FAKE_SECTION_DIRECTIVE = '- Beskriv bara de delar du faktiskt tar upp och nämn aldrig "X punkter" eller sektioner som inte följs av innehåll.';

export const buildIntentPrompt = ({ intent, focus = {}, referencesPersonalInvestments, macroTheme }: IntentPromptContext): string => {
  const lines: string[] = [];

  switch (intent) {
    case 'stock_analysis': {
      const hasExplicitFocus = Object.values(focus).some(Boolean);
      lines.push('AKTIEANALYSUPPGIFT:', '- Välj endast de analysdelar som efterfrågas och håll motiveringarna tydliga.');
      if (!hasExplicitFocus) {
        lines.push('- Vid breda frågor: kombinera företagsöversikt, värdering och rekommendation i 2–3 kompakta stycken.');
      }
      if (focus.wantsOverview) {
        lines.push('- Ge en kort företagsöversikt när användaren saknar kontext.');
      }
      if (focus.wantsFinancials) {
        lines.push('- Summera viktiga siffror (tillväxt, marginaler, kassaflöden) när siffror efterfrågas.');
      }
      if (focus.wantsValuation) {
        lines.push('- Beskriv värderingen (multiplar, prisnivåer) när användaren lyfter riktkurser eller värdering.');
      }
      if (focus.wantsRecommendation) {
        lines.push('- Leverera tydligt köp/sälj/behåll när användaren ber om ett beslut.');
      }
      if (focus.wantsTriggers) {
        lines.push('- Lista 1–2 konkreta triggers eller katalysatorer endast när frågan efterfrågar dem.');
      }
      if (focus.wantsRisks) {
        lines.push('- Beskriv riskbilden kort och koppla den till vad som kan gå fel.');
      }
      if (focus.wantsAlternatives) {
        lines.push('- Föreslå 1–2 relaterade bolag bara när användaren uttryckligen ber om alternativ.');
      }
      lines.push('OBLIGATORISKT FORMAT FÖR AKTIEFÖRSLAG:', '**Företagsnamn (TICKER)** - Kort motivering (endast börsnoterade bolag)');
      break;
    }
    case 'prediction_analysis': {
      lines.push('PREDIKTIONSMARKNADSANALYS:', 
        '- Betrakta frågan som en analys av sannolikhetsmarknader (t.ex. Polymarket), inte som traditionell betting.',
        '- Förklara alltid "implicerad sannolikhet" om användaren diskuterar odds (t.ex. odds 2.0 = 50% sannolikhet).',
        '- Analysera "Wisdom of the Crowd" – vad säger marknadens prissättning om det förväntade utfallet?',
        '- Jämför gärna marknadens odds mot opinionsmätningar eller nyhetsflöde om relevant data finns.'
      );
      if (focus.wantsRisks) {
        lines.push('- Påpeka att prediktionsmarknader är volatila och kan påverkas av "whales" eller låg likviditet.');
      }
      if (focus.wantsRecommendation) {
        lines.push('- Ge INTE köp-/säljråd för betting. Utvärdera istället om marknaden verkar över- eller underreagera på nyheter.');
      }
      break;
    }
    case 'portfolio_optimization': {
      lines.push('PORTFÖLJOPTIMERINGSUPPGIFT:', '- Identifiera över-/underexponering och föreslå konkreta omviktningar vid behov.', '- Beskriv prioriterade åtgärder i löpande text och använd punktlistor endast för tydliga steg.');
      if (referencesPersonalInvestments) {
        lines.push('- Knyt råden till användarens faktiska innehav, kassareserver och månadssparande.');
      }
      if (focus.wantsRisks) {
        lines.push('- Kommentera hur omviktningarna påverkar portföljens risk.');
      }
      break;
    }
    case 'buy_sell_decisions': {
      lines.push('KÖP/SÄLJ-BESLUTSUPPGIFT:', '- Bedöm tajming utifrån data och sentiment och väg korta pro/cons.', '- Rekommendera positionsstorlek eller stegvisa åtgärder när användaren vill agera.');
      if (focus.wantsRisks) {
        lines.push('- Förklara nedsida/uppsida tydligt innan du ger rekommendation.');
      }
      break;
    }
    case 'market_analysis': {
      lines.push('MARKNADSANALYSUPPGIFT:', '- Ge en koncentrerad makroöversikt i 1–2 sektioner och koppla till sentiment.');
      const macroInstruction = getMacroInstruction(macroTheme);
      if (macroInstruction) {
        lines.push(macroInstruction);
      }
      if (referencesPersonalInvestments) {
        lines.push('- När användaren ber om det: förklara hur trenderna påverkar deras portfölj eller mål.');
      }
      lines.push('- Föreslå 1–2 bevakningspunkter eller justeringar om frågan kräver det.');
      break;
    }
    case 'general_news': {
      lines.push('NYHETSBREV:', '- Sammanfatta marknaden i högst två sektioner (t.ex. globalt + sektorer).', '- Varje sektion ska vara ett stycke på 2–3 meningar utan separata punktlistor.', '- Fråga om användaren vill koppla nyheterna till sin portfölj när det känns naturligt.');
      break;
    }
    case 'news_update': {
      lines.push('NYHETSBEVAKNING:', '- Gruppéra de viktigaste nyheterna per bolag, sektor eller tema och väv in Tavily-källor endast när de används.', '- Beskriv hur varje nyhet påverkar strategi eller innehav och föreslå konkreta uppföljningssteg.');
      if (!referencesPersonalInvestments) {
        lines.push('- Om användaren inte nämner portföljen: håll fokus på själva nyheterna och erbjud att koppla dem vid behov.');
      }
      break;
    }
    case 'document_summary': {
      lines.push('DOKUMENTSAMMANFATTNING:', '- Utgå strikt från uppladdade dokument, destillera syfte och nyckelpunkter och lägg till sidreferenser när det går.', '- Skippa rubriker som du inte fyller och återge inga långa citat.');
      break;
    }
    default: {
      lines.push('ALLMÄN INVESTERINGSRÅDGIVNING:', '- Svara i ett eller två stycken och anpassa förslag till användarens mål.', '- Ta bara upp riskprofilen om användaren uttryckligen efterfrågar det.', '- När aktieförslag behövs: **Företagsnamn (TICKER)** - Kort motivering och endast börsnoterade bolag.');
      if (focus.wantsRecommendation) {
        lines.push('- Ge konkreta förslag när användaren ber om det, annars håll dig till observationer.');
      }
      break;
    }
  }

  lines.push(NO_FAKE_SECTION_DIRECTIVE);
  return lines.join('\n');
};

// ============================================================================
// Heading Directives Builder
// ============================================================================

export type HeadingDirectiveInput = {
  intent: IntentType;
};

const HEADING_VARIATIONS: Record<string, string[]> = {
  analysis: ['**Analys 🔍**', '**Grundlig analys 🔎**', '**Analys & Insikt 💡**'],
  recommendation: ['**Håll koll på detta:**'],
  risks: ['**Risker ⚠️**', '**Riskbild ⚡**', '**Risker & Bevaka 🔔**'],
  news: ['**Nyheter 📰**', '**Marknadsnytt 🗞️**', '**Senaste nytt 📣**'],
  actions: ['**Åtgärder ✅**', '**Nästa steg 🧭**', '**Föreslagna åtgärder 🛠️**']
};

const pickRandom = (values: string[]): string => {
  if (values.length === 0) return '';
  const index = Math.floor(Math.random() * values.length);
  return values[index];
};

export const buildHeadingDirectives = ({ intent }: HeadingDirectiveInput): string => {
  const directives: string[] = [];

  if (intent === 'stock_analysis') {
    const analysisHeading = pickRandom(HEADING_VARIATIONS.analysis);
    const recommendationHeading = pickRandom(HEADING_VARIATIONS.recommendation);
    const riskHeading = pickRandom(HEADING_VARIATIONS.risks);

    directives.push(
      '- Om du behöver rubriker för tydlighet, välj högst två av följande alternativ och använd dem endast när du direkt följer upp med innehåll:',
      `  • Möjlig analysrubrik: ${analysisHeading}`,
      `  • Möjlig rekommendationsrubrik: ${recommendationHeading}`,
      `  • Möjlig riskrubrik: ${riskHeading}`,
      '- Lämna helt rubrikerna om svaret blir mer naturligt i styckeform och nämn dem inte på annat sätt.'
    );
  } else if (intent === 'news_update' || intent === 'general_news') {
    const newsHeading = pickRandom(HEADING_VARIATIONS.news);
    const actionsHeading = pickRandom(HEADING_VARIATIONS.actions);
    directives.push(
      '- Använd rubriker bara om de hjälper läsaren – annars skriv löpande text:',
      `  • Nyhetsrubrik att välja vid behov: ${newsHeading}`,
      `  • Åtgärdsrubrik att välja vid behov: ${actionsHeading}`,
      '- Hoppa helt över rubriker som du inte tänker använda direkt – inga referenser till tomma sektioner.'
    );
  }

  if (directives.length === 0) {
    return '';
  }

  return directives.join('\n');
};

// ============================================================================
// Personalization Prompt Builder
// ============================================================================

export type PersonalizationPromptInput = {
  aiMemory?: Record<string, unknown> | null;
  favoriteSectors?: string[] | null;
  currentGoals?: string[] | null;
  recentMessages?: string[] | null;
  macroTheme?: MacroTheme | null;
  analysisAngles?: AnalysisAngle[] | null;
};

export const buildPersonalizationPrompt = ({
  aiMemory,
  favoriteSectors,
  currentGoals,
  recentMessages,
  macroTheme,
  analysisAngles,
}: PersonalizationPromptInput): string => {
  const sections: string[] = [];

  if (aiMemory?.communication_style === 'concise') {
    sections.push('- Använd korta meningar och håll presentationen stram när frågan inte kräver djupanalys.');
  } else if (aiMemory?.communication_style === 'detailed') {
    sections.push('- Ge utförliga förklaringar och resonemang – användaren uppskattar detaljnivå.');
  }

  if (Array.isArray(favoriteSectors) && favoriteSectors.length > 0) {
    sections.push(`- Knyt eventuella förslag till användarens favoritsektorer: ${favoriteSectors.join(', ')}.`);
  }

  if (Array.isArray(currentGoals) && currentGoals.length > 0) {
    sections.push(`- Säkerställ att råden stödjer målen: ${currentGoals.join(', ')}.`);
  }

  const normalizedGoals = Array.isArray(currentGoals)
    ? currentGoals
      .map(goal => (typeof goal === 'string' ? goal.toLowerCase() : null))
      .filter((goal): goal is string => Boolean(goal))
    : [];

  if (normalizedGoals.some(goal => goal.includes('pension'))) {
    sections.push('- Lyft hur råden passar ett långsiktigt pensionsmål och koppla till makrotrender som påverkar värdetillväxt.');
  }
  if (normalizedGoals.some(goal => goal.includes('passiv inkomst') || goal.includes('utdel'))) {
    sections.push('- Prioritera kassaflöde, utdelningsstabilitet och balansräkning när du föreslår bolag.');
  }
  if (normalizedGoals.some(goal => goal.includes('barnspar'))) {
    sections.push('- Betona stabilitet och tidshorisont för barns sparande snarare än kortsiktig avkastning.');
  }

  const riskComfortData = (aiMemory?.risk_comfort_patterns as Record<string, unknown> | null) ?? null;
  const macroSource = macroTheme
    || (isMacroTheme(riskComfortData?.macro_focus_topic as string) ? riskComfortData?.macro_focus_topic as MacroTheme : null)
    || detectMacroThemeFromMessages(Array.isArray(recentMessages) ? recentMessages : []);
  const macroInstruction = getMacroInstruction(macroSource);
  if (macroInstruction) {
    sections.push(macroInstruction);
  }

  const memoryAnglesSource = Array.isArray((riskComfortData as Record<string, unknown> | null)?.analysis_focus_preferences)
    ? (riskComfortData as { analysis_focus_preferences: unknown[] }).analysis_focus_preferences
    : (Array.isArray((aiMemory as Record<string, unknown> | null)?.analysis_focus_preferences)
      ? (aiMemory as { analysis_focus_preferences: unknown[] }).analysis_focus_preferences
      : []);
  const memoryAngles = memoryAnglesSource.filter(isAnalysisAngle);
  const combinedAngles = new Set<AnalysisAngle>([
    ...(analysisAngles ?? []),
    ...memoryAngles,
  ]);
  combinedAngles.forEach(angle => sections.push(getAnalysisAngleInstruction(angle)));

  return sections.length > 0 ? sections.join('\n') : '';
};

