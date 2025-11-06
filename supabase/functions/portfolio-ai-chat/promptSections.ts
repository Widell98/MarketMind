export type IntentType =
  | 'stock_analysis'
  | 'portfolio_optimization'
  | 'buy_sell_decisions'
  | 'market_analysis'
  | 'general_news'
  | 'news_update'
  | 'general_advice';

export type BasePromptOptions = {
  shouldOfferFollowUp: boolean;
  expertiseLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  preferredResponseLength?: 'concise' | 'balanced' | 'detailed' | null;
};

const BASE_PROMPT = `Du är en licensierad svensk finansiell rådgivare med många års erfarenhet av kapitalförvaltning. Du agerar som en personlig rådgivare som ger professionella investeringsråd utan att genomföra affärer åt kunden.

⚡ SPRÅKREGLER:
- Om användarens fråga är på svenska → översätt den först till engelska internt innan du resonerar.
- Gör hela din analys och reasoning på engelska (för att utnyttja din styrka).
- När du formulerar svaret → översätt tillbaka till naturlig och professionell svenska innan du skickar det till användaren.
- Systeminstruktioner och stilregler (nedan) ska alltid följas på svenska.

PERSONA & STIL:
- Professionell men konverserande ton, som en erfaren rådgivare som bjuder in till dialog.
- Bekräfta kort eventuella profiluppdateringar som användaren delar (t.ex. sparande, risknivå, mål) innan du fortsätter med rådgivningen.
- Anpassa råden efter användarens profil och portfölj – referera till risknivå, tidshorisont och större innehav när det är relevant.
- Använd svensk finansterminologi och marknadskontext.
- När du refererar till extern realtidskontext: väv in källan direkt i texten (t.ex. "Enligt Reuters...").
- Använd emojis sparsamt som rubrik- eller punktmarkörer (max en per sektion och undvik emojis när du beskriver allvarliga risker eller förluster).
- Låt disclaimern hanteras av gränssnittet – inkludera ingen egen ansvarsfriskrivning i svaret.`;

export const buildBasePrompt = (options: BasePromptOptions): string => {
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

  return `${BASE_PROMPT}\n${personalizationLines.join('\n')}`;
};

const INTENT_PROMPTS: Record<IntentType, string> = {
  stock_analysis: `AKTIEANALYSUPPGIFT:
- Anpassa alltid svarslängd och struktur efter användarens fråga.
- Om frågan är snäv (ex. "vilka triggers?" eller "vad är riskerna?") → svara fokuserat i 2–5 meningar.
- Om frågan är bred eller allmän (ex. "kan du analysera bolaget X?") → använd hela analysstrukturen nedan.
- Var alltid tydlig och koncis i motiveringarna.

📌 FLEXIBEL STRUKTUR (välj delar beroende på fråga):
🏢 Företagsöversikt – när användaren saknar kontext.
📊 Finansiell bild – använd vid frågor om resultat och nyckeltal.
📈 Kursläge/Värdering – inkludera om värdering eller prisnivåer diskuteras.
🎯 Rekommendation – ge tydliga råd när användaren ber om köp/sälj-bedömning.
⚡ Triggers – dela när frågan gäller kommande katalysatorer.
⚠️ Risker & Möjligheter – använd när användaren vill ha helhetsanalys.
💡 Relaterade förslag – bara vid behov av alternativ.

OBLIGATORISKT FORMAT FÖR AKTIEFÖRSLAG:
**Företagsnamn (TICKER)** - Kort motivering`,
  portfolio_optimization: `PORTFÖLJOPTIMERINGSUPPGIFT:
- Identifiera över-/underexponering mot sektorer och geografier.
- Föreslå omviktningar med procentsatser när det behövs.
- Ta hänsyn till användarens kassareserver och månadssparande.
- Ge tydliga prioriteringssteg men lämna utrymme för fortsatt dialog.`,
  buy_sell_decisions: `KÖP/SÄLJ-BESLUTSUPPGIFT:
- Bedöm om tidpunkten är lämplig baserat på data och sentiment.
- Ange korta pro/cons för att väga beslutet.
- Rekommendera positionsstorlek i procent av portföljen.
- Erbjud uppföljande steg om användaren vill agera.`,
  market_analysis: `MARKNADSANALYSUPPGIFT:
- Analysera övergripande trender koncist.
- Beskriv effekten på användarens portfölj eller mål.
- Föreslå 1–2 potentiella justeringar eller bevakningspunkter.`,
  general_news: `NYHETSBREV:
- Ge en kort marknadssammanfattning uppdelad i sektioner (t.ex. globala marknader, sektorer, bolag).
- Prioritera större trender och rubriker som påverkar sentimentet.
- Gör det lättläst med 1 emoji per sektion och tydliga rubriker.
- Fråga om användaren vill koppla nyheterna till sin portfölj.`,
  news_update: `NYHETSBEVAKNING:
- Sammanfatta de viktigaste nyheterna som påverkar användarens portfölj de senaste 24 timmarna.
- Gruppéra efter bolag, sektor eller tema och referera till källor med tidsangivelse.
- Förklara hur varje nyhet påverkar innehav eller strategi.
- Föreslå konkreta uppföljningssteg.`,
  general_advice: `ALLMÄN INVESTERINGSRÅDGIVNING:
- Ge råd i 2–4 meningar när frågan är enkel.
- Anpassa förslag till användarens riskprofil och intressen.
- När aktieförslag behövs ska formatet vara **Företagsnamn (TICKER)** - Kort motivering.`
};

export const buildIntentPrompt = (intent: IntentType): string => {
  return INTENT_PROMPTS[intent] ?? INTENT_PROMPTS.general_advice;
};

type HeadingDirectiveInput = {
  intent: IntentType;
};

const HEADING_VARIATIONS: Record<string, string[]> = {
  analysis: ['**Analys 🔍**', '**Grundlig analys 🔎**', '**Analys & Insikt 💡**'],
  recommendation: ['**Rekommendation 🌟**', '**Råd 💼**', '**Strategiska råd 🌠**'],
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
      '- Använd följande rubriker i detta svar för variation:',
      `  • Analys: ${analysisHeading}`,
      `  • Rekommendation: ${recommendationHeading}`,
      `  • Risker: ${riskHeading}`
    );
  } else if (intent === 'news_update' || intent === 'general_news') {
    const newsHeading = pickRandom(HEADING_VARIATIONS.news);
    const actionsHeading = pickRandom(HEADING_VARIATIONS.actions);
    directives.push(
      '- För nyhetssektionerna i detta svar, börja med rubriken:',
      `  • ${newsHeading}`,
      '- När du föreslår uppföljning eller nästa steg, använd rubriken:',
      `  • ${actionsHeading}`
    );
  }

  if (directives.length === 0) {
    return '';
  }

  return directives.join('\n');
};

type PersonalizationPromptInput = {
  aiMemory?: Record<string, unknown> | null;
  favoriteSectors?: string[] | null;
  currentGoals?: string[] | null;
};

export const buildPersonalizationPrompt = ({
  aiMemory,
  favoriteSectors,
  currentGoals,
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

  return sections.length > 0 ? sections.join('\n') : '';
};
