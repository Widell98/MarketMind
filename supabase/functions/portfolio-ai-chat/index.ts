import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { IntentType } from './intent-types.ts';
import { detectUserIntentWithOpenAI } from './intent-detector.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRIMARY_CHAT_MODEL = Deno.env.get('OPENAI_PORTFOLIO_MODEL')
  || Deno.env.get('OPENAI_MODEL')
  || 'gpt-5.1';

const INLINE_INTENT_MODEL = Deno.env.get('OPENAI_INTENT_MODEL')
  || PRIMARY_CHAT_MODEL;

type BasePromptOptions = {
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
- När du rekommenderar en aktie ska bolaget vara börsnoterat och du måste ange dess ticker i formatet Företagsnamn (TICKER).
- Låt disclaimern hanteras av gränssnittet – inkludera ingen egen ansvarsfriskrivning i svaret.`;

const buildBasePrompt = (options: BasePromptOptions): string => {
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
**Företagsnamn (TICKER)** - Kort motivering (endast börsnoterade bolag)`,
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
- Beskriv effekten på användarens portfölj eller mål när användaren uttryckligen ber om det.
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
- När aktieförslag behövs ska formatet vara **Företagsnamn (TICKER)** - Kort motivering och endast inkludera börsnoterade bolag.`,
  document_summary: `DOKUMENTSAMMANFATTNING:
- Utgå strikt från användarens uppladdade dokument som primär källa.
- Läs igenom hela underlaget innan du formulerar svaret.
- Plocka ut syfte, struktur och kärninsikter med sidreferenser när det är möjligt.
- Presentera en sammanhängande översikt med tydliga sektioner som Översikt, Nyckelpunkter och VD´ns ord och reflektioner när materialet motiverar det.
- Återge inte långa citat – destillera och tolka innehållet i en professionell ton.
`
};

const buildIntentPrompt = (intent: IntentType): string => {
  return INTENT_PROMPTS[intent] ?? INTENT_PROMPTS.general_advice;
};

type HeadingDirectiveInput = {
  intent: IntentType;
};

const HEADING_VARIATIONS: Record<string, string[]> = {
  analysis: ['**Analys 🔍**', '**Grundlig analys 🔎**', '**Analys & Insikt 💡**'],
  recommendation: ['**Håll koll på detta:**'],
  risks: ['**Risker ⚠️**', '**Riskbild ⚡**', '**Risker & Bevaka 🔔**'],
  news: ['**Nyheter 📰**', '**Marknadsnytt 🗞️**', '**Senaste nytt 📣**'],
  actions: ['**Åtgärder ✅**', '**Nästa steg 🧭**', '**Föreslagna åtgärder 🛠️**']
};

const DOCUMENT_CONTEXT_MATCH_COUNT = 8;
const DOCUMENT_SUMMARY_CONTEXT_MAX_CHARS_PER_DOCUMENT = 60000;
const DOCUMENT_SUMMARY_PATTERNS: RegExp[] = [
  /sammanfatta/i,
  /sammanfattning/i,
  /summering/i,
  /sammanställ/i,
  /sammanstall/i,
  /summary/i,
  /summarize/i,
  /summarise/i,
  /key points?/i,
  /key takeaways?/i,
  /nyckelpunkter/i,
  /huvudpunkter/i,
  /huvudinsikter/i,
  /övergripande bild/i,
  /helhetsbild/i,
];

const pickRandom = (values: string[]): string => {
  if (values.length === 0) return '';
  const index = Math.floor(Math.random() * values.length);
  return values[index];
};

const buildHeadingDirectives = ({ intent }: HeadingDirectiveInput): string => {
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

const buildPersonalizationPrompt = ({
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

const SWEDISH_TAVILY_DOMAINS = [
  'di.se',
  'affarsvarlden.se',
  'placera.se',
  'www.placera.se',
  'www.placera.se/skribenter/199',
  'placera.se/skribenter/199',
  'privataaffarer.se',
  'svd.se',
  'dn.se',
  'efn.se',
  'breakit.se',
  'news.cision.com',
];

const INTERNATIONAL_TAVILY_DOMAINS = [
  'reuters.com',
  'bloomberg.com',
  'ft.com',
  'cnbc.com',
  'wsj.com',
  'marketwatch.com',
  'finance.yahoo.com',
  'investing.com',
  'morningstar.com',
  'marketscreener.com',
  'seekingalpha.com',
  'benzinga.com',
  'globenewswire.com',
  'sec.gov',
];

const TRUSTED_TAVILY_DOMAINS = Array.from(new Set([
  ...SWEDISH_TAVILY_DOMAINS,
  ...INTERNATIONAL_TAVILY_DOMAINS,
]));

const SWEDISH_PRIORITY_TAVILY_DOMAINS = Array.from(new Set([
  ...SWEDISH_TAVILY_DOMAINS,
  ...INTERNATIONAL_TAVILY_DOMAINS,
]));

const INTERNATIONAL_PRIORITY_TAVILY_DOMAINS = Array.from(new Set([
  ...INTERNATIONAL_TAVILY_DOMAINS,
  ...SWEDISH_TAVILY_DOMAINS,
]));

const EXTENDED_TAVILY_DOMAINS = Array.from(new Set([
  ...TRUSTED_TAVILY_DOMAINS,
  'marketbeat.com',
  'stockanalysis.com',
  'themotleyfool.com',
  'barrons.com',
  'forbes.com',
  'economist.com',
]));

const DEFAULT_EXCLUDED_TAVILY_DOMAINS = [
  'reddit.com',
  'www.reddit.com',
  'quora.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'linkedin.com',
  'medium.com',
  'stocktwits.com',
  'discord.com',
  'pinterest.com',
];

const RECENT_NEWS_MAX_DAYS = 3;
const RECENT_MARKET_NEWS_MAX_DAYS = 7;
const RECENT_FINANCIAL_DATA_MAX_DAYS = 45;
const DEFAULT_UNDATED_FINANCIAL_DOMAINS = ['stockanalysis.com'];

const FINANCIAL_RELEVANCE_KEYWORDS = [
  'aktie',
  'aktien',
  'aktier',
  'börs',
  'marknad',
  'marknaden',
  'stock',
  'stocks',
  'share',
  'shares',
  'equity',
  'equities',
  'revenue',
  'omsättning',
  'earnings',
  'vinster',
  'profit',
  'net income',
  'eps',
  'utdelning',
  'dividend',
  'guidance',
  'forecast',
  'prognos',
  'resultat',
  'rapport',
  'kvartal',
  'quarter',
  'valuation',
  'värdering',
  'cash flow',
  'kassaflöde',
  'yield',
  'ränta',
  'interest',
  'inflation',
  'ekonomi',
  'economy',
  'market',
  'markets',
  'investor',
  'investment',
  'analyst',
  'nyckeltal',
  'price',
  'pris',
];

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const INTENT_EMBEDDING_CACHE_KEY = 'intent_centroids_v1';
const EMBEDDING_SIMILARITY_THRESHOLD = 0.78;

const INTENT_EXAMPLES: Record<IntentType, string[]> = {
  stock_analysis: [
    'Kan du analysera Volvo-aktien åt mig?',
    'Vad är din syn på Evolution Gaming just nu?',
    'Hur ser fundamenta ut för Atlas Copco?',
  ],
  portfolio_optimization: [
    'Hur kan jag balansera om min portfölj?',
    'Vilken viktning bör jag ha mellan teknik och hälsovård?',
    'Behöver jag justera min portfölj för att minska risken?',
  ],
  buy_sell_decisions: [
    'Ska jag sälja mina H&M-aktier nu?',
    'Är det läge att köpa mer Investor?',
    'Borde jag minska positionen i Tesla?',
  ],
  market_analysis: [
    'Vad händer på börsen den här veckan?',
    'Hur påverkar inflationen marknaden just nu?',
    'Kan du ge en översikt över makrotrenderna?',
  ],
  general_news: [
    'Ge mig en marknadssammanfattning för idag.',
    'Vilka är de största nyheterna på börsen den här veckan?',
    'Vad har hänt på marknaden nyligen?',
  ],
  news_update: [
    'Hur påverkade dagens rapporter min portfölj?',
    'Vad är senaste nytt om mina innehav?',
    'Finns det nyheter från igår som påverkar mina aktier?',
  ],
  general_advice: [
    'Hur bör jag tänka kring långsiktigt sparande?',
    'Har du några investeringsidéer för en nybörjare?',
    'Vilka aktier passar en balanserad strategi?',
  ],
};

type IntentCentroidMap = Record<IntentType, number[]>;

let inMemoryIntentCentroids: IntentCentroidMap | null = null;
const messageEmbeddingCache = new Map<string, number[]>();

const averageVectors = (vectors: number[][]): number[] => {
  if (vectors.length === 0) return [];
  const dimension = vectors[0].length;
  const sums = new Array(dimension).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < dimension; i += 1) {
      sums[i] += vector[i];
    }
  }

  return sums.map(value => value / vectors.length);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const fetchEmbedding = async (text: string, openAIApiKey: string): Promise<number[] | null> => {
  if (messageEmbeddingCache.has(text)) {
    return messageEmbeddingCache.get(text) ?? null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: OPENAI_EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      console.warn('Embedding request failed with status', response.status);
      return null;
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (Array.isArray(embedding)) {
      messageEmbeddingCache.set(text, embedding);
      return embedding;
    }
  } catch (error) {
    console.warn('Failed to fetch embedding:', error);
  }

  return null;
};

const fetchCentroidsFromSupabase = async (supabase: any): Promise<IntentCentroidMap | null> => {
  try {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', INTENT_EMBEDDING_CACHE_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Failed to load intent centroids from kv_store:', error.message ?? error);
      return null;
    }

    if (data?.value) {
      if (typeof data.value === 'string') {
        return JSON.parse(data.value);
      }
      return data.value as IntentCentroidMap;
    }
  } catch (error) {
    console.warn('Unexpected error when loading centroids:', error);
  }

  return null;
};

const persistCentroidsToSupabase = async (supabase: any, centroids: IntentCentroidMap): Promise<void> => {
  try {
    const payload = {
      key: INTENT_EMBEDDING_CACHE_KEY,
      value: JSON.stringify(centroids),
    };

    const { error } = await supabase
      .from('kv_store')
      .upsert(payload, { onConflict: 'key' });

    if (error) {
      console.warn('Failed to persist intent centroids:', error.message ?? error);
    }
  } catch (error) {
    console.warn('Unexpected error when persisting centroids:', error);
  }
};

const loadIntentCentroids = async (
  supabase: any,
  openAIApiKey: string,
): Promise<IntentCentroidMap | null> => {
  if (inMemoryIntentCentroids) {
    return inMemoryIntentCentroids;
  }

  const cached = await fetchCentroidsFromSupabase(supabase);
  if (cached) {
    inMemoryIntentCentroids = cached;
    return cached;
  }

  const centroids: Partial<IntentCentroidMap> = {};

  for (const [intent, examples] of Object.entries(INTENT_EXAMPLES) as [IntentType, string[]][]) {
    const vectors: number[][] = [];
    for (const example of examples) {
      const embedding = await fetchEmbedding(example, openAIApiKey);
      if (embedding) {
        vectors.push(embedding);
      }
    }

    if (vectors.length > 0) {
      centroids[intent] = averageVectors(vectors);
    }
  }

  const result = centroids as IntentCentroidMap;
  inMemoryIntentCentroids = result;

  await persistCentroidsToSupabase(supabase, result);

  return result;
};

const classifyIntentWithEmbeddings = async (
  message: string,
  supabase: any,
  openAIApiKey: string,
): Promise<IntentType | null> => {
  if (message.trim().length < 3) {
    return null;
  }

  const centroids = await loadIntentCentroids(supabase, openAIApiKey);
  if (!centroids) {
    return null;
  }

  const messageEmbedding = await fetchEmbedding(message, openAIApiKey);
  if (!messageEmbedding) {
    return null;
  }

  let bestIntent: IntentType | null = null;
  let bestScore = -1;

  for (const [intent, centroid] of Object.entries(centroids) as [IntentType, number[]][]) {
    const score = cosineSimilarity(messageEmbedding, centroid);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestIntent && bestScore >= EMBEDDING_SIMILARITY_THRESHOLD) {
    console.log('Intent classified via embeddings:', bestIntent, 'score:', bestScore.toFixed(3));
    return bestIntent;
  }

  console.log('Embedding classification below threshold. Best intent:', bestIntent, 'score:', bestScore.toFixed(3));
  return null;
};

const classifyIntentWithLLM = async (
  message: string,
  openAIApiKey: string,
): Promise<IntentType | null> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        max_tokens: 5,
        messages: [
          {
            role: 'system',
            content: 'Klassificera användarens fråga som en av följande kategorier: stock_analysis, news_update, general_news, market_analysis, portfolio_optimization, buy_sell_decisions, general_advice. Svara endast med etiketten.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('LLM intent classification failed with status', response.status);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim()?.toLowerCase?.();
    const label = (content ?? '').replace(/[^a-z_]/g, '') as IntentType;
    if ((INTENT_EXAMPLES as Record<string, string[]>)[label]) {
      console.log('Intent classified via LLM:', label);
      return label;
    }
  } catch (error) {
    console.warn('LLM intent classification error:', error);
  }

  return null;
};

const extractEntityCandidates = (
  message: string,
  knownNames: string[] = [],
): string[] => {
  const entities = new Set<string>();

  const capitalizedPattern = /\b([A-ZÅÄÖ][\wÅÄÖåäö-]+(?:\s+[A-ZÅÄÖ][\wÅÄÖåäö-]+){0,2})\b/g;
  let match: RegExpExecArray | null;
  while ((match = capitalizedPattern.exec(message)) !== null) {
    const candidate = match[1];
    if (candidate && candidate.length > 2) {
      entities.add(candidate.trim());
    }
  }

  const lowerMessage = message.toLowerCase();
  for (const name of knownNames) {
    if (typeof name !== 'string') continue;
    const normalizedName = name.trim();
    if (!normalizedName) continue;
    const simple = normalizedName.toLowerCase();
    if (lowerMessage.includes(simple)) {
      entities.add(normalizedName);
    }
  }

  return Array.from(entities).slice(0, 5);
};

type EntityQueryInput = {
  message: string;
  tickers: string[];
  companyNames: string[];
  hasRealTimeTrigger: boolean;
  userIntent: IntentType;
  detectedEntities?: string[];
};

const buildEntityAwareQuery = ({
  message,
  tickers,
  companyNames,
  hasRealTimeTrigger,
  userIntent,
  detectedEntities,
}: EntityQueryInput): string | null => {
  const entitySet = new Set<string>();
  for (const ticker of tickers.slice(0, 4)) {
    if (ticker) {
      entitySet.add(ticker.toUpperCase());
    }
  }

  if (Array.isArray(detectedEntities)) {
    detectedEntities.forEach(entity => {
      if (typeof entity === 'string' && entity.trim()) {
        const formatted = entity.trim();
        const maybeTicker = formatted.length <= 8 ? formatted.toUpperCase() : formatted;
        entitySet.add(maybeTicker);
      }
    });
  }

  for (const name of extractEntityCandidates(message, companyNames)) {
    entitySet.add(name);
  }

  if (entitySet.size === 0) {
    return hasRealTimeTrigger || userIntent === 'news_update' || userIntent === 'general_news'
      ? `${message} senaste nyheter`
      : null;
  }

  const entities = Array.from(entitySet).slice(0, 4);
  const descriptor = hasRealTimeTrigger || userIntent === 'news_update' || userIntent === 'general_news'
    ? 'senaste nyheter och rapporter'
    : 'fördjupad analys';

  return `${entities.join(' ')} ${descriptor}`;
};

const EXCHANGE_RATES: Record<string, number> = {
  SEK: 1.0,
  USD: 10.5,
  EUR: 11.4,
  GBP: 13.2,
  NOK: 0.95,
  DKK: 1.53,
  JPY: 0.07,
  CHF: 11.8,
  CAD: 7.8,
  AUD: 7.0,
};

const convertToSEK = (amount: number, fromCurrency?: string | null): number => {
  if (!amount || amount === 0) return 0;

  const currency = typeof fromCurrency === 'string' && fromCurrency.trim().length > 0
    ? fromCurrency.trim().toUpperCase()
    : 'SEK';

  const rate = EXCHANGE_RATES[currency];

  if (!rate) {
    console.warn(`Exchange rate not found for currency: ${currency}, defaulting to SEK`);
    return amount;
  }

  return amount * rate;
};

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normalizeIdentifier = (value?: string | null): string | null => {
  if (!value) return null;

  const normalized = value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return normalized.length > 0 ? normalized : null;
};

const removeDiacritics = (value: string): string =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const escapeRegExp = (value: string): string =>
  value.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

type SheetTickerEdgeItem = {
  symbol?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
};

type SheetTickerEdgeResponse = {
  tickers?: SheetTickerEdgeItem[];
};

type HoldingRecord = {
  symbol?: string | null;
  name?: string | null;
  holding_type?: string | null;
  quantity?: number | string | null;
  current_price_per_unit?: number | string | null;
  price_currency?: string | null;
  currency?: string | null;
  current_value?: number | string | null;
};

type HoldingValueBreakdown = {
  quantity: number;
  pricePerUnit: number | null;
  priceCurrency: string;
  valueInOriginalCurrency: number;
  valueCurrency: string;
  valueInSEK: number;
  pricePerUnitInSEK: number | null;
  hasDirectPrice: boolean;
};

const resolveHoldingValue = (holding: HoldingRecord): HoldingValueBreakdown => {
  const quantity = parseNumericValue(holding?.quantity) ?? 0;

  const pricePerUnit = parseNumericValue(holding?.current_price_per_unit);
  const baseCurrencyRaw =
    typeof holding?.price_currency === 'string' && holding.price_currency.trim().length > 0
      ? holding.price_currency.trim().toUpperCase()
      : typeof holding?.currency === 'string' && holding.currency.trim().length > 0
        ? holding.currency.trim().toUpperCase()
        : 'SEK';

  const fallbackValue = parseNumericValue(holding?.current_value) ?? 0;
  const fallbackCurrency = baseCurrencyRaw;

  const hasDirectPrice = pricePerUnit !== null && quantity > 0;
  const rawValue = hasDirectPrice ? pricePerUnit * quantity : fallbackValue;
  const valueCurrency = hasDirectPrice ? baseCurrencyRaw : fallbackCurrency;
  const valueInSEK = convertToSEK(rawValue, valueCurrency);

  const pricePerUnitInSEK = pricePerUnit !== null
    ? convertToSEK(pricePerUnit, baseCurrencyRaw)
    : quantity > 0
      ? valueInSEK / quantity
      : null;

  return {
    quantity,
    pricePerUnit,
    priceCurrency: baseCurrencyRaw,
    valueInOriginalCurrency: rawValue,
    valueCurrency,
    valueInSEK,
    pricePerUnitInSEK,
    hasDirectPrice,
  };
};

const formatAllocationLabel = (label: string): string => {
  const normalized = label.replace(/_/g, ' ').trim();
  if (!normalized) return label;

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type RealTimeAssessment = {
  needsRealtime: boolean;
  signals: string[];
  questionType?: string;
  recommendationPreference?: RecommendationPreference;
  usedLLM: boolean;
};

type NewsIntentEvaluationParams = {
  message: string;
  hasPortfolio: boolean;
  apiKey: string;
};

type NewsIntentLabel = 'news_update' | 'general_news' | 'none';

const NEWS_INTENT_SCHEMA = {
  name: 'news_intent_selection',
  schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: ['news_update', 'general_news', 'none'],
        default: 'none',
      },
    },
    required: ['intent'],
    additionalProperties: false,
  },
} as const;

const evaluateNewsIntentWithOpenAI = async ({
  message,
  hasPortfolio,
  apiKey,
}: NewsIntentEvaluationParams): Promise<IntentType | null> => {
  if (!apiKey || !message || !message.trim()) {
    return null;
  }

  try {
    const systemPrompt = `Du hjälper en svensk finansiell assistent att välja rätt typ av nyhetssvar.\n- Välj \"news_update\" om användaren sannolikt vill ha en uppdatering om sina innehav eller portfölj.\n- Välj \"general_news\" om användaren vill ha ett brett marknadsbrev eller nyhetssvep.\n- Returnera \"none\" om inget av alternativen passar.\nSvara alltid med giltig JSON.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Meddelande: "${message.trim()}"\nHar användaren portföljdata hos oss: ${hasPortfolio ? 'ja' : 'nej'}\nVilket nyhetssvar förväntas?`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        response_format: { type: 'json_schema', json_schema: NEWS_INTENT_SCHEMA },
        messages,
      }),
    });

    if (!response.ok) {
      console.warn('News intent evaluation failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Failed to parse news intent response:', error);
      return null;
    }

    const intentRaw = typeof (parsed as any)?.intent === 'string' ? (parsed as any).intent as NewsIntentLabel : 'none';

    if (intentRaw === 'news_update' || intentRaw === 'general_news') {
      return intentRaw;
    }

    return null;
  } catch (error) {
    console.warn('News intent evaluator error:', error);
    return null;
  }
};

type StockIntentEvaluationParams = {
  message: string;
  detectedTickers: string[];
  heuristicsTriggered: boolean;
  hasStockContext: boolean;
  analysisCue: boolean;
  apiKey: string;
};

type StockIntentEvaluationResult = {
  classification: 'stock_focus' | 'non_stock';
  rationale?: string;
};

const STOCK_INTENT_SCHEMA = {
  name: 'stock_intent_classification',
  schema: {
    type: 'object',
    properties: {
      classification: {
        type: 'string',
        enum: ['stock_focus', 'non_stock'],
        default: 'non_stock',
      },
      rationale: {
        type: 'string',
        maxLength: 200,
      },
    },
    required: ['classification'],
    additionalProperties: false,
  },
} as const;

const evaluateStockIntentWithOpenAI = async ({
  message,
  detectedTickers,
  heuristicsTriggered,
  hasStockContext,
  analysisCue,
  apiKey,
}: StockIntentEvaluationParams): Promise<StockIntentEvaluationResult | null> => {
  const trimmedMessage = message.trim();

  if (!apiKey || !trimmedMessage) {
    return null;
  }

  try {
    const systemPrompt = `Du hjälper en svensk finansiell assistent att avgöra hur svaret ska formuleras.\n- Välj \"stock_focus\" om användaren förväntar sig resonemang om ett specifikt bolag eller dess aktie.\n- Välj \"non_stock\" om frågan främst gäller portföljer, sparande, index, makro eller andra bredare ämnen.\n- Använd signalerna men gör en egen helhetsbedömning.\n- Svara alltid med giltig JSON enligt schemat.`;

    const tickerLine = detectedTickers.length > 0
      ? detectedTickers.join(', ')
      : 'inga';

    const userContent = [
      `Meddelande: "${trimmedMessage}"`,
      `Identifierade tickers: ${tickerLine}`,
      `Heuristik markerade som aktiefråga: ${heuristicsTriggered ? 'ja' : 'nej'}`,
      `Investerings- eller bolagskontext hittad: ${hasStockContext ? 'ja' : 'nej'}`,
      `Direkt analysfraser hittade: ${analysisCue ? 'ja' : 'nej'}`,
      'Avgör om detta ska besvaras som en aktiespecifik fråga.',
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        response_format: { type: 'json_schema', json_schema: STOCK_INTENT_SCHEMA },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Stock intent evaluation failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      console.warn('Failed to parse stock intent response:', error);
      return null;
    }

    const classificationRaw = typeof (parsed as any)?.classification === 'string'
      ? (parsed as any).classification as string
      : 'non_stock';

    if (classificationRaw !== 'stock_focus' && classificationRaw !== 'non_stock') {
      return null;
    }

    const rationaleRaw = typeof (parsed as any)?.rationale === 'string'
      ? (parsed as any).rationale.trim()
      : '';

    return {
      classification: classificationRaw,
      rationale: rationaleRaw.length > 0 ? rationaleRaw : undefined,
    };
  } catch (error) {
    console.warn('Stock intent evaluator error:', error);
    return null;
  }
};

type RealTimeDecisionInput = {
  message: string;
  userIntent?: IntentType;
  recentMessages?: string[];
  openAIApiKey: string;
};

type RecommendationPreference = 'yes' | 'no';

type RealTimeDecision = {
  decision: boolean;
  rationale?: string;
  questionType?: string;
  recommendationPreference?: RecommendationPreference;
  usedModel: boolean;
};

const askLLMIfRealtimeNeeded = async ({
  message,
  userIntent,
  recentMessages,
  openAIApiKey,
}: RealTimeDecisionInput): Promise<RealTimeDecision> => {
  try {
    const contextLines: string[] = [];

    if (userIntent) {
      contextLines.push(`Identifierad intent: ${userIntent}.`);
    }

    if (recentMessages && recentMessages.length > 0) {
      const recentSnippet = recentMessages
        .map((entry, index) => `${index + 1}. ${entry}`)
        .join('\n');
      contextLines.push(`Tidigare relaterade användarmeddelanden:\n${recentSnippet}`);
    }

    const userPromptSections = [
      'Du analyserar vilken typ av fråga en användare ställer i en finansiell chatt.',
      '1. Klassificera frågan i en av följande kategorier:',
      '   - latest_news (ber om senaste nyheter, uppdateringar eller rubriker).',
      '   - recent_report (hänvisar till färska rapporter, kvartalsrapporter eller earnings calls).',
      '   - intraday_price (vill veta aktuell kurs, intradagsrörelser eller "hur går den nu").',
      '   - macro_event (handlar om dagsaktuella marknadshändelser, centralbanker eller makronyheter).',
      '   - portfolio_update (ber om dagsfärsk status för sin portfölj eller innehav).',
      '   - strategy_or_education (förklaringar, historik, långsiktiga strategier).',
      '   - other (allt annat).',
      '2. Avgör om realtidsdata krävs för att besvara frågan pålitligt. Realtidsdata behövs främst för kategorierna latest_news, recent_report, intraday_price, macro_event och portfolio_update.',
      '3. Motivera kort på svenska varför realtidsdata behövs eller inte.',
      '4. Avgör om användaren uttryckligen ber om investeringsrekommendationer, konkreta portföljåtgärder eller köp/sälj-råd.',
      contextLines.join('\n\n'),
      `Nuvarande användarmeddelande:\n"""${message}"""`,
      'Returnera JSON i formatet {"realtime": "yes" eller "no", "reason": "...", "question_type": "...", "recommendations": "yes" eller "no"}.',
    ].filter(Boolean);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: INLINE_INTENT_MODEL,
        temperature: 0,
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content: 'Du avgör om en investeringsfråga behöver realtidsdata. Var konservativ med ja-svar och motivera kort på svenska.',
          },
          {
            role: 'user',
            content: userPromptSections.join('\n\n'),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Realtime LLM check failed with status', response.status);
      return { decision: false, usedModel: false };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return { decision: false, usedModel: true };
    }

    try {
      const parsed = JSON.parse(text);
      const decisionText = String(parsed?.realtime ?? '').toLowerCase();
      const decision = decisionText === 'yes' || decisionText === 'ja';
      const rationale = typeof parsed?.reason === 'string' ? parsed.reason.trim() : undefined;
      const questionType = typeof parsed?.question_type === 'string'
        ? parsed.question_type.trim().toLowerCase()
        : undefined;
      const recommendationPreferenceRaw = typeof parsed?.recommendations === 'string'
        ? parsed.recommendations.trim().toLowerCase()
        : undefined;
      const recommendationPreference: RecommendationPreference | undefined =
        recommendationPreferenceRaw === 'yes' || recommendationPreferenceRaw === 'no'
          ? recommendationPreferenceRaw
          : undefined;
      return { decision, rationale, questionType, recommendationPreference, usedModel: true };
    } catch (jsonError) {
      console.warn('Failed to parse realtime LLM response as JSON:', jsonError, 'Raw response:', text);
      const normalized = text.toLowerCase();
      const decision = normalized.includes('ja') || normalized.includes('yes');
      return {
        decision,
        rationale: text,
        questionType: undefined,
        recommendationPreference: undefined,
        usedModel: true,
      };
    }
  } catch (error) {
    console.warn('Realtime LLM check encountered an error:', error);
    return { decision: false, recommendationPreference: undefined, usedModel: false };
  }
};

const determineRealTimeSearchNeed = async ({
  message,
  userIntent,
  recentMessages,
  openAIApiKey,
}: RealTimeDecisionInput): Promise<RealTimeAssessment> => {
  const signals: string[] = [];

  const {
    decision,
    rationale,
    questionType,
    recommendationPreference,
    usedModel,
  } = await askLLMIfRealtimeNeeded({
    message,
    userIntent,
    recentMessages,
    openAIApiKey,
  });

  if (questionType) {
    signals.push(`llm:question_type:${questionType}`);
  }

  if (recommendationPreference) {
    signals.push(`llm:recommendations:${recommendationPreference}`);
  }

  if (rationale) {
    signals.push(`llm:${rationale}`);
  } else {
    signals.push(decision ? 'llm:yes' : 'llm:no');
  }

  if (!usedModel) {
    const newsIntents = new Set<IntentType>(['news_update', 'general_news', 'stock_analysis', 'market_analysis']);
    if (userIntent && newsIntents.has(userIntent)) {
      signals.push('fallback:intent_requires_realtime');
      return {
        needsRealtime: true,
        signals,
        usedLLM: false,
      };
    }
  }

  return {
    needsRealtime: decision,
    signals,
    questionType,
    recommendationPreference,
    usedLLM: usedModel,
  };
};

type TavilySearchResult = {
  title?: string;
  content?: string;
  snippet?: string;
  url?: string;
  published_date?: string;
  raw_content?: string;
};

type TavilySearchResponse = {
  answer?: string;
  results?: TavilySearchResult[];
};

type TavilyTopic = 'general' | 'news' | 'finance';

type TavilyContextPayload = {
  formattedContext: string;
  sources: string[];
};

type TavilySearchDepth = 'basic' | 'advanced';

type TavilySearchOptions = {
  query?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  topic?: TavilyTopic;
  timeRange?: string;
  days?: number;
  searchDepth?: TavilySearchDepth;
  maxResults?: number;
  includeRawContent?: boolean;
  timeoutMs?: number;
  requireRecentDays?: number;
  allowUndatedFromDomains?: string[];
};

type StockDetectionPattern = {
  regex: RegExp;
  requiresContext?: boolean;
};

type TavilyFormattingOptions = {
  requireRecentDays?: number;
  allowUndatedFromDomains?: string[];
};

const normalizeHostname = (url: string): string | null => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    console.warn('Kunde inte tolka URL från Tavily-resultat:', url, error);
    return null;
  }
};

const isAllowedDomain = (url: string, allowedDomains: string[]): boolean => {
  if (!url) return false;
  if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) {
    return true;
  }

  const hostname = normalizeHostname(url);
  if (!hostname) return false;

  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
    return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
  });
};

const hasFinancialRelevance = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const normalized = text.toLowerCase();
  return FINANCIAL_RELEVANCE_KEYWORDS.some(keyword => normalized.includes(keyword));
};

const selectSnippetSource = (result: TavilySearchResult): string => {
  const snippetSource = typeof result.raw_content === 'string' && result.raw_content.trim().length > 0
    ? result.raw_content
    : typeof result.content === 'string' && result.content.trim().length > 0
      ? result.content
      : result.snippet;

  return typeof snippetSource === 'string' ? snippetSource.trim() : '';
};

const formatTavilyResults = (
  data: TavilySearchResponse | null,
  allowedDomains: string[],
  options: TavilyFormattingOptions = {},
): TavilyContextPayload => {
  if (!data) {
    return { formattedContext: '', sources: [] };
  }

  const sections: string[] = [];
  const sourceSet = new Set<string>();
  const { requireRecentDays, allowUndatedFromDomains } = options;
  const requireFreshness = typeof requireRecentDays === 'number'
    && Number.isFinite(requireRecentDays)
    && requireRecentDays > 0;

  const normalizedUndatedDomains = Array.isArray(allowUndatedFromDomains)
    ? allowUndatedFromDomains
      .map(domain => domain.replace(/^www\./, '').toLowerCase())
      .filter(Boolean)
    : [];

  const recencyThresholdMs = requireFreshness
    ? requireRecentDays * 24 * 60 * 60 * 1000
    : 0;
  const nowMs = Date.now();

  const isUndatedAllowed = (url: string): boolean => {
    if (!requireFreshness) return true;
    const hostname = normalizeHostname(url);
    if (!hostname) {
      return false;
    }

    return normalizedUndatedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  };

  const isRecentEnough = (url: string, publishedDate?: string): boolean => {
    if (!requireFreshness) {
      return true;
    }

    if (typeof publishedDate === 'string' && publishedDate.trim().length > 0) {
      const parsed = Date.parse(publishedDate);
      if (!Number.isNaN(parsed)) {
        const ageMs = nowMs - parsed;
        if (ageMs < 0) {
          return true;
        }

        if (ageMs <= recencyThresholdMs) {
          return true;
        }

        console.log('Filtrerar bort Tavily-resultat som är äldre än tillåten gräns:', url, 'datum:', publishedDate);
        return false;
      }

      console.log('Kunde inte tolka publiceringsdatum för Tavily-resultat:', url, 'datum:', publishedDate);
      return isUndatedAllowed(url);
    }

    if (!isUndatedAllowed(url)) {
      console.log('Filtrerar bort Tavily-resultat utan publiceringsdatum när färska källor krävs:', url);
      return false;
    }

    return true;
  };

  if (typeof data.answer === 'string' && data.answer.trim().length > 0) {
    sections.push(`Sammanfattning från realtidssökning: ${data.answer.trim()}`);
  }

  if (Array.isArray(data.results)) {
    const filteredResults = data.results
      .filter((result: TavilySearchResult) => {
        const url = typeof result.url === 'string' ? result.url : '';
        if (!url || !isAllowedDomain(url, allowedDomains)) {
          if (url) {
            console.log('Filtrerar bort otillåten domän från Tavily-resultat:', url);
          }
          return false;
        }

        const snippetText = selectSnippetSource(result);
        const combinedText = [result.title, snippetText].filter(Boolean).join(' ');
        if (!combinedText) {
          console.log('Filtrerar bort Tavily-resultat utan relevant innehåll:', url);
          return false;
        }

        const hasRelevance = hasFinancialRelevance(combinedText);
        if (!hasRelevance && combinedText.length < 60) {
          console.log('Filtrerar bort Tavily-resultat med låg finansiell relevans:', url);
          return false;
        }

        if (!isRecentEnough(url, result.published_date)) {
          return false;
        }

        return true;
      })
      .slice(0, 3);

    if (filteredResults.length > 0) {
      const resultLines = filteredResults.map((result: TavilySearchResult, index: number) => {
        const title = typeof result.title === 'string' ? result.title : `Resultat ${index + 1}`;
        const trimmedSnippet = selectSnippetSource(result);
        const safeSnippet = trimmedSnippet.length > 900
          ? `${trimmedSnippet.slice(0, 900)}…`
          : trimmedSnippet;
        const url = typeof result.url === 'string' ? result.url : '';
        const publishedDate = typeof result.published_date === 'string' ? result.published_date : '';

        const parts = [`• ${title}`];
        if (publishedDate) {
          parts.push(`(${publishedDate})`);
        }
        if (safeSnippet) {
          parts.push(`- ${safeSnippet}`);
        }
        if (url) {
          sourceSet.add(url);
          parts.push(`Källa: ${url}`);
        }
        return parts.join(' ');
      });
      sections.push('Detaljer från TAVILY-sökning:\n' + resultLines.join('\n'));
    }
  }

  const formattedContext = sections.length > 0
    ? `\n\nExtern realtidskontext:\n${sections.join('\n\n')}`
    : '';

  return {
    formattedContext,
    sources: Array.from(sourceSet),
  };
};

const fetchTavilyContext = async (
  message: string,
  options: TavilySearchOptions = {},
): Promise<TavilyContextPayload> => {
  const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
  if (!tavilyApiKey) {
    console.warn('TAVILY_API_KEY saknas i miljövariablerna. Hoppar över realtidssökning.');
    return { formattedContext: '', sources: [] };
  }

  try {
    const {
      requireRecentDays,
      allowUndatedFromDomains,
      ...searchOptions
    } = options ?? {};

    const effectiveIncludeDomains = Array.isArray(searchOptions.includeDomains) && searchOptions.includeDomains.length > 0
      ? searchOptions.includeDomains
      : TRUSTED_TAVILY_DOMAINS;

    const allowDomainFallback = (!Array.isArray(searchOptions.includeDomains) || searchOptions.includeDomains.length === 0)
      && EXTENDED_TAVILY_DOMAINS.length > 0;

    const effectiveExcludeDomains = Array.from(new Set([
      ...DEFAULT_EXCLUDED_TAVILY_DOMAINS,
      ...(Array.isArray(searchOptions.excludeDomains) ? searchOptions.excludeDomains : []),
    ]));

    const effectiveTopic: TavilyTopic = searchOptions.topic ?? 'finance';
    const shouldRequestRawContent = (searchOptions.includeRawContent ?? false)
      && (searchOptions.searchDepth ?? 'basic') === 'advanced';

    const timeout = typeof searchOptions.timeoutMs === 'number' && searchOptions.timeoutMs > 0
      ? searchOptions.timeoutMs
      : 6000;

    const domainAttempts: string[][] = [];
    if (effectiveIncludeDomains.length > 0) {
      domainAttempts.push(effectiveIncludeDomains);
    } else {
      domainAttempts.push([]);
    }

    if (allowDomainFallback) {
      const fallbackDomains = Array.from(new Set(EXTENDED_TAVILY_DOMAINS));
      const isDifferentList = fallbackDomains.length !== effectiveIncludeDomains.length
        || fallbackDomains.some((domain, index) => domain !== effectiveIncludeDomains[index]);
      if (isDifferentList) {
        domainAttempts.push(fallbackDomains);
      }
    }

    const performSearch = async (includeDomains: string[]): Promise<{
      context: TavilyContextPayload;
      rawResultCount: number;
    }> => {
      const payload: Record<string, unknown> = {
        api_key: tavilyApiKey,
        query: searchOptions.query ?? message,
        search_depth: searchOptions.searchDepth ?? 'basic',
        include_answer: true,
        max_results: searchOptions.maxResults ?? 5,
      };

      if (shouldRequestRawContent) {
        payload.include_raw_content = true;
      }

      if (includeDomains.length > 0) {
        payload.include_domains = includeDomains;
      }

      if (effectiveExcludeDomains.length > 0) {
        payload.exclude_domains = effectiveExcludeDomains;
      }

      if (effectiveTopic) {
        payload.topic = effectiveTopic;
      }

      if (typeof searchOptions.timeRange === 'string' && searchOptions.timeRange.trim().length > 0) {
        payload.time_range = searchOptions.timeRange.trim();
      }

      if (typeof searchOptions.days === 'number' && Number.isFinite(searchOptions.days)) {
        payload.days = searchOptions.days;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fel vid anrop till Tavily API:', errorText);
          return { context: { formattedContext: '', sources: [] }, rawResultCount: 0 };
        }

        const tavilyData = await response.json() as TavilySearchResponse;
        const context = formatTavilyResults(tavilyData, includeDomains, {
          requireRecentDays,
          allowUndatedFromDomains,
        });
        const rawResultCount = Array.isArray(tavilyData.results) ? tavilyData.results.length : 0;

        return { context, rawResultCount };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let lastContext: TavilyContextPayload = { formattedContext: '', sources: [] };

    for (let attemptIndex = 0; attemptIndex < domainAttempts.length; attemptIndex++) {
      const domainSet = domainAttempts[attemptIndex];
      const { context, rawResultCount } = await performSearch(domainSet);

      if (context.formattedContext || context.sources.length > 0) {
        return context;
      }

      lastContext = context;

      const hasMoreAttempts = attemptIndex < domainAttempts.length - 1;
      if (hasMoreAttempts) {
        const logMessage = rawResultCount === 0
          ? 'Tavily-sökning gav inga resultat för prioriterade finansdomäner, testar med utökad lista.'
          : 'Tavily-sökning gav inga relevanta resultat inom prioriterade finansdomäner, försöker med utökad lista.';
        console.log(logMessage);
      }
    }

    return lastContext;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('Tavily-förfrågan avbröts på grund av timeout.');
    } else {
      console.error('Undantag vid anrop till Tavily API:', error);
    }
    return { formattedContext: '', sources: [] };
  }
};

const FINANCIAL_DATA_KEYWORDS = [
  'senaste rapport',
  'rapporten',
  'kvartalsrapport',
  'årsrapport',
  'financials',
  'nyckeltal',
  'siffror',
  'resultat',
  'omsättning',
  'intäkter',
  'vinster',
  'vinst',
  'eps',
  'earnings',
  'guidance',
  'prognos',
  'income statement',
  'balance sheet',
  'cash flow',
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== PORTFOLIO AI CHAT FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { message, userId, portfolioId, chatHistory = [], analysisType, sessionId, insightType, timeframe, conversationData, stream, documentIds } = requestBody;

    const filteredDocumentIds: string[] = Array.isArray(documentIds)
      ? documentIds.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];

    const hasUploadedDocuments = filteredDocumentIds.length > 0;
    const normalizedSummaryCheckValue = message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
    const summaryPatternTriggered =
      DOCUMENT_SUMMARY_PATTERNS.some((pattern) => pattern.test(message)) ||
      DOCUMENT_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalizedSummaryCheckValue));
    let isDocumentSummaryRequest = hasUploadedDocuments && summaryPatternTriggered;

    console.log('Portfolio AI Chat function called with:', {
      message: message?.substring(0, 50) + '...',
      userId,
      portfolioId,
      sessionId,
      analysisType
    });

    const recentUserMessages = Array.isArray(chatHistory)
      ? chatHistory
        .filter((entry: { role?: string; content?: string }) => entry?.role === 'user' && typeof entry?.content === 'string')
        .map(entry => entry.content as string)
        .slice(-3)
      : [];

    if (!message || !userId) {
      console.error('Missing required fields:', { message: !!message, userId: !!userId });
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, length:', openAIApiKey.length);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Supabase client initialized');

    // Fetch all user data in parallel for better performance
    const [
      { data: aiMemory },
      { data: riskProfile },
      { data: portfolio },
      { data: holdings },
      { data: subscriber }
    ] = await Promise.all([
      supabase
        .from('user_ai_memory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('user_holdings')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('subscribers')
        .select('subscribed')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

    let sheetTickerSymbols: string[] = [];
    let sheetTickerNames: string[] = [];
    let sheetTickerCurrencyMap = new Map<string, string>();
    let swedishTickerSymbols: string[] = [];
    let swedishCompanyNamesNormalized: string[] = [];

    try {
      const { data: sheetTickerData, error: sheetTickerError } = await supabase.functions.invoke('list-sheet-tickers');

      if (sheetTickerError) {
        console.error('Failed to fetch Google Sheets tickers:', sheetTickerError);
      } else {
        const typedData = sheetTickerData as SheetTickerEdgeResponse | null;
        const rawTickers = Array.isArray(typedData?.tickers)
          ? (typedData?.tickers as SheetTickerEdgeItem[])
          : [];

        const symbolSet = new Set<string>();
        const nameSet = new Set<string>();
        const currencyMap = new Map<string, string>();
        const swedishSymbolSet = new Set<string>();
        const swedishNameSet = new Set<string>();

        for (const item of rawTickers) {
          if (!item || typeof item !== 'object') continue;

          const rawSymbol = typeof item.symbol === 'string' ? item.symbol : null;
          const currencyNormalized = typeof item.currency === 'string'
            ? item.currency.trim().toUpperCase()
            : null;
          if (rawSymbol) {
            const trimmedSymbol = rawSymbol.trim();
            const withoutPrefix = trimmedSymbol.includes(':')
              ? trimmedSymbol.split(':').pop() ?? trimmedSymbol
              : trimmedSymbol;
            const cleanedSymbol = withoutPrefix.replace(/\s+/g, '').toUpperCase();
            const normalizedSymbol = cleanedSymbol.replace(/[^A-Za-z0-9]/g, '');
            const finalSymbol = normalizedSymbol.length > 0 ? normalizedSymbol : cleanedSymbol;
            if (finalSymbol.length > 0) {
              symbolSet.add(finalSymbol);
              if (currencyNormalized) {
                currencyMap.set(finalSymbol, currencyNormalized);
                if (currencyNormalized === 'SEK') {
                  swedishSymbolSet.add(finalSymbol);
                }
              }
            }
          }

          const rawName = typeof item.name === 'string' ? item.name : null;
          if (rawName) {
            const normalizedWhitespaceName = rawName.replace(/\s+/g, ' ').trim();
            if (normalizedWhitespaceName.length > 0) {
              nameSet.add(normalizedWhitespaceName);

              const diacriticsStripped = removeDiacritics(normalizedWhitespaceName).trim();
              if (diacriticsStripped.length > 0 && diacriticsStripped !== normalizedWhitespaceName) {
                nameSet.add(diacriticsStripped);
              }

              if (currencyNormalized === 'SEK') {
                const lowerName = normalizedWhitespaceName.toLowerCase();
                swedishNameSet.add(lowerName);
                if (diacriticsStripped.length > 0) {
                  swedishNameSet.add(diacriticsStripped.toLowerCase());
                }
              }
            }
          }
        }

        sheetTickerSymbols = Array.from(symbolSet);
        sheetTickerNames = Array.from(nameSet);
        sheetTickerCurrencyMap = currencyMap;
        swedishTickerSymbols = Array.from(swedishSymbolSet);
        swedishCompanyNamesNormalized = Array.from(swedishNameSet);

        console.log('Loaded Google Sheets tickers:', {
          symbols: sheetTickerSymbols.length,
          names: sheetTickerNames.length,
        });
      }
    } catch (error) {
      console.error('Unexpected error when loading Google Sheets tickers:', error);
    }

    // ENHANCED INTENT DETECTION FOR PROFILE UPDATES
    const detectProfileUpdates = (message: string) => {
      const updates: any = {};
      let requiresConfirmation = false;
      const lowerMessage = message.toLowerCase();

      const parseNumber = (value: string) => {
        const numeric = value.replace(/[^\d]/g, '');
        return numeric ? parseInt(numeric, 10) : NaN;
      };

      // Parse monthly savings changes - more comprehensive
      const monthlySavingsPattern = /(öka|höja|minska|sänka|ändra).*(?:månad|månads).*(?:sparande|spara|investera).*?(\d+[\s,]*\d*)\s*(?:kr|sek|kronor)/i;
      const monthlySavingsMatch = message.match(monthlySavingsPattern);
      
      if (monthlySavingsMatch) {
        const action = monthlySavingsMatch[1].toLowerCase();
        const amount = parseInt(monthlySavingsMatch[2].replace(/[\s,]/g, ''));
        const currentAmount = riskProfile?.monthly_investment_amount || 0;
        
        let newAmount = amount;
        if (action.includes('öka') || action.includes('höja')) {
          newAmount = currentAmount + amount;
        } else if (action.includes('minska') || action.includes('sänka')) {
          newAmount = Math.max(0, currentAmount - amount);
        }

        if (newAmount !== currentAmount) {
          updates.monthly_investment_amount = newAmount;
          requiresConfirmation = true;
        }
      }

      // Direct monthly investment amount
      const directMonthlyMatch = message.match(/(?:spara|investera|satsa|lägga)\s+(\d+(?:\s?\d{3})*)\s*(?:kr|kronor|SEK).*(?:månad|månads)/i);
      if (directMonthlyMatch) {
        const amount = parseInt(directMonthlyMatch[1].replace(/\s/g, ''));
        if (amount > 0 && amount !== riskProfile?.monthly_investment_amount) {
          updates.monthly_investment_amount = amount;
          requiresConfirmation = true;
        }
      }

      // Parse liquid capital / savings on accounts
      const liquidCapitalPatterns = [
        /(?:likvidt? kapital|tillgängligt kapital|kassa|sparkonto|kontanter|på kontot|i banken).*?(\d[\d\s.,]*)\s*(?:kr|kronor|sek)?/i,
        /(\d[\d\s.,]*)\s*(?:kr|kronor|sek)?.*?(?:likvidt? kapital|tillgängligt kapital|kassa|sparkonto|kontanter|på kontot|i banken)/i
      ];

      for (const pattern of liquidCapitalPatterns) {
        const match = message.match(pattern);
        if (match) {
          const amount = parseNumber(match[1]);
          if (!Number.isNaN(amount) && amount > 0 && amount !== riskProfile?.liquid_capital) {
            updates.liquid_capital = amount;
            requiresConfirmation = true;
          }
          break;
        }
      }

      // Parse emergency buffer in months
      const emergencyBufferPatterns = [
        /(?:buffert|nödfond|akutfond|trygghetsbuffert).*?(\d+(?:[.,]\d+)?)\s*(?:månader|mån|months?)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:månader|mån)\s*(?:buffert|nödfond|akutfond)/i
      ];

      for (const pattern of emergencyBufferPatterns) {
        const match = message.match(pattern);
        if (match) {
          const bufferMonths = Math.round(parseFloat(match[1].replace(',', '.')));
          if (!Number.isNaN(bufferMonths) && bufferMonths > 0 && bufferMonths !== riskProfile?.emergency_buffer_months) {
            updates.emergency_buffer_months = bufferMonths;
            requiresConfirmation = true;
          }
          break;
        }
      }

      // Parse preferred number of stocks/holdings
      const preferredStockMatch = message.match(/(?:vill|önskar|föredrar|siktar på|tänker|ska|max|högst|upp till|äga|ha)\s*(?:ha|ägna|äga)?\s*(?:max|högst|upp till)?\s*(\d+(?:[.,]\d+)?)\s*(?:aktier|bolag|innehav)/i);
      if (preferredStockMatch) {
        const preferredCount = Math.round(parseFloat(preferredStockMatch[1].replace(',', '.')));
        if (!Number.isNaN(preferredCount) && preferredCount > 0 && preferredCount !== riskProfile?.preferred_stock_count) {
          updates.preferred_stock_count = preferredCount;
          requiresConfirmation = true;
        }
      }

      // Parse age updates
      const agePattern = /(?:är|age|ålder).*?(\d{2,3})\s*(?:år|years|old)/i;
      const ageMatch = message.match(agePattern);

      if (ageMatch) {
        const newAge = parseInt(ageMatch[1]);
        if (newAge >= 18 && newAge <= 100 && newAge !== riskProfile?.age) {
          updates.age = newAge;
          requiresConfirmation = true;
        }
      }

      // Parse income updates
      const incomePattern = /(årsinkomst|lön|income).*?(\d+[\s,]*\d*)\s*(?:kr|sek|kronor)/i;
      const incomeMatch = message.match(incomePattern);
      
      if (incomeMatch) {
        const newIncome = parseInt(incomeMatch[2].replace(/[\s,]/g, ''));
        if (newIncome !== riskProfile?.annual_income) {
          updates.annual_income = newIncome;
          requiresConfirmation = true;
        }
      }

      // Risk tolerance updates - enhanced patterns
      const riskPatterns = [
        { pattern: /(konservativ|låg risk|säker|försiktig)/i, value: 'conservative' },
        { pattern: /(måttlig|medel|balanserad|moderate)/i, value: 'moderate' },
        { pattern: /(aggressiv|hög risk|riskabel|risktagande)/i, value: 'aggressive' }
      ];

      for (const riskPattern of riskPatterns) {
        if (lowerMessage.match(riskPattern.pattern) &&
            (lowerMessage.includes('risk') || lowerMessage.includes('inställning') ||
            lowerMessage.includes('tolerans')) &&
            riskPattern.value !== riskProfile?.risk_tolerance) {
          updates.risk_tolerance = riskPattern.value;
          requiresConfirmation = true;
          break;
        }
      }

      // Investment horizon updates - enhanced patterns
      const horizonPatterns = [
        { pattern: /(kort|0[-–]2|kortsiktig)/i, value: 'short' },
        { pattern: /(medel|3[-–]5|mellanlång)/i, value: 'medium' },
        { pattern: /(lång|5\+|långsiktig|över 5)/i, value: 'long' }
      ];

      for (const horizonPattern of horizonPatterns) {
        if (lowerMessage.match(horizonPattern.pattern) &&
            (lowerMessage.includes('horisont') || lowerMessage.includes('sikt') ||
            lowerMessage.includes('tidshorisont')) &&
            horizonPattern.value !== riskProfile?.investment_horizon) {
          updates.investment_horizon = horizonPattern.value;
          requiresConfirmation = true;
          break;
        }
      }

      // Housing situation detection with loan status cues
      let detectedHousing: string | null = null;

      const mentionsNoLoan = lowerMessage.includes('utan lån') || lowerMessage.includes('skuldfri') ||
        lowerMessage.includes('utan bolån') || lowerMessage.includes('inget bolån');

      if (/(?:hyr|hyresrätt)/.test(lowerMessage)) {
        detectedHousing = 'rents';
      } else if (/bor hos (?:mina?|föräldrar)/.test(lowerMessage)) {
        detectedHousing = 'lives_with_parents';
      } else if (/(?:bostadsrätt|äg[er]?\s+(?:en\s+)?lägenhet|äg[er]?\s+(?:ett\s+)?hus|äg[er]?\s+(?:en\s+)?villa|äg[er]?\s+(?:ett\s+)?radhus|villa|radhus|egna hem)/.test(lowerMessage)) {
        detectedHousing = mentionsNoLoan ? 'owns_no_loan' : 'owns_with_loan';
      } else if (/bolån/.test(lowerMessage) && /(villa|hus|radhus|bostad|bostadsrätt)/.test(lowerMessage)) {
        detectedHousing = mentionsNoLoan ? 'owns_no_loan' : 'owns_with_loan';
      }

      if (detectedHousing && detectedHousing !== riskProfile?.housing_situation) {
        updates.housing_situation = detectedHousing;
        requiresConfirmation = true;
      }

      // Loan detection (true/false)
      const loanIndicators = [/bolån/, /studielån/, /privatlån/, /billån/, /låneskulder/, /har lån/, /lån på huset/, /lånet/, /lån kvar/];
      const loanNegativeIndicators = [/utan lån/, /skuldfri/, /inga lån/, /lånefri/, /helt skuldfri/, /utan bolån/, /inget lån/, /inget bolån/];

      const sanitizedLoanMessage = lowerMessage
        .replace(/utan\s+bolån/g, '')
        .replace(/utan\s+lån/g, '')
        .replace(/inga\s+lån/g, '')
        .replace(/inget\s+lån/g, '')
        .replace(/inget\s+bolån/g, '')
        .replace(/skuldfri/g, '')
        .replace(/lånefri/g, '');

      const hasPositiveLoan = loanIndicators.some(pattern => pattern.test(sanitizedLoanMessage));
      const hasNegativeLoan = loanNegativeIndicators.some(pattern => pattern.test(lowerMessage));

      if (hasPositiveLoan) {
        if (riskProfile?.has_loans !== true) {
          updates.has_loans = true;
          requiresConfirmation = true;
        }
      } else if (hasNegativeLoan) {
        if (riskProfile?.has_loans !== false) {
          updates.has_loans = false;
          requiresConfirmation = true;
        }
      }

      return { updates, requiresConfirmation };
    };

    const profileChangeDetection = detectProfileUpdates(message);

    const isPremium = subscriber?.subscribed || false;
    console.log('User premium status:', isPremium);

    const investmentContextPattern = /(aktie|aktier|börs|portfölj|fond|investera|bolag|innehav|kurs|marknad|stock|share|equity)/i;
    const hasInvestmentContext = investmentContextPattern.test(message);

    const companyIntentPattern = /(?:analysera|analys av|vad tycker du om|hur ser du på|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|information om|företagsinfo|köpvärd|sälj|köpa|sälja|investera)/i;
    const hasCompanyIntent = companyIntentPattern.test(message);

    const hasStockContext = hasInvestmentContext || hasCompanyIntent;

    // Check if this is a stock exchange request
    const isExchangeRequest = /(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av)/i.test(message) &&
      /(?:aktie|aktier|innehav|portfölj)/i.test(message);

    // Enhanced stock detection - detect both analysis requests AND stock mentions
    const createBoundaryPattern = (pattern: string) => `(?:^|[^A-Za-z0-9])${pattern}(?=$|[^A-Za-z0-9])`;

    const sheetTickerSymbolSet = new Set(sheetTickerSymbols.map(symbol => symbol.toUpperCase()));

    const sheetTickerSymbolPatterns: StockDetectionPattern[] = sheetTickerSymbols.map(symbol =>
      ({
        regex: new RegExp(createBoundaryPattern(escapeRegExp(symbol)), 'i'),
        requiresContext: true,
      })
    );

    const sheetTickerNamePatterns: StockDetectionPattern[] = sheetTickerNames.map(name => {
      const collapsedName = name.replace(/\s+/g, ' ');
      const escapedName = escapeRegExp(collapsedName).replace(/\s+/g, '\\s+');
      return {
        regex: new RegExp(createBoundaryPattern(escapedName), 'i'),
        requiresContext: true,
      };
    });

    const staticCompanyPattern: StockDetectionPattern = {
      regex: new RegExp(
        createBoundaryPattern('(?:investor|volvo|ericsson|sandvik|atlas|kinnevik|hex|alfa\\s+laval|skf|telia|seb|handelsbanken|nordea|abb|astra|electrolux|husqvarna|getinge|boliden|ssab|stora\\s+enso|svenska\\s+cellulosa|lund|billerud|holmen|nibe|beijer|essity|kindred|evolution|betsson|net\\s+entertainment|fingerprint|sinch|tobii|xvivo|medivir|orexo|camurus|diamyd|raysearch|elekta|sectra|bactiguard|vitrolife|bioinvent|immunovia|hansa|cantargia|oncopeptides|wilson\\s+therapeutics|solberg|probi|biovica|addlife|duni|traction|embracer|stillfront|paradox|starbreeze|remedy|gaming|saab|h&m|hennes|mauritz|assa\\s+abloy|atlas\\s+copco|epiroc|trelleborg|lifco|indutrade|fagerhult|munters|sweco|ramboll|hexagon|addtech|bufab|nolato|elanders)'),
        'i'
      ),
      requiresContext: true,
    };

    const stockMentionPatterns: StockDetectionPattern[] = [
      staticCompanyPattern,
      {
        regex: /(?:köpa|sälja|investera|aktier?|bolag|företag)\s+(?:i\s+)?([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      {
        regex: /(?:aktien?|bolaget)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      {
        regex: /(?:vad tycker du om|hur ser du på|bra aktie|dålig aktie|köpvärd|sälj)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      {
        regex: /(?:nyhet(?:erna)?|senaste\s+nytt)\s+(?:om|kring|för|hos|i|på)\s+([A-ZÅÄÖ][a-zåäöA-Z\s&.-]{2,30})/i,
        requiresContext: false,
      },
      ...sheetTickerSymbolPatterns,
      ...sheetTickerNamePatterns,
    ];

    const isStockAnalysisRequest = /(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) &&
      /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity)/i.test(message);

    const extractTickerSymbols = (input: string): string[] => {
      const normalizedInput = removeDiacritics(input);
      const tickerMatches = Array.from(normalizedInput.matchAll(/\b([A-Za-z0-9]{1,6})\b/g));
      if (tickerMatches.length === 0) return [];

      const knownTickers = new Set<string>();
      const uppercaseFallback = new Set<string>();

      for (const match of tickerMatches) {
        const rawToken = match[1];
        if (!rawToken) continue;

        const normalizedSymbol = rawToken.toUpperCase();
        const isUppercaseInMessage = rawToken === rawToken.toUpperCase();

        if (sheetTickerSymbolSet.size > 0) {
          if (sheetTickerSymbolSet.has(normalizedSymbol)) {
            knownTickers.add(normalizedSymbol);
          }
        } else if (isUppercaseInMessage) {
          knownTickers.add(normalizedSymbol);
        }

        if (isUppercaseInMessage) {
          uppercaseFallback.add(normalizedSymbol);
        }
      }

      if (knownTickers.size > 0) {
        return Array.from(knownTickers);
      }

      return Array.from(uppercaseFallback);
    };

    const buildStockAnalysisUrlCandidates = (ticker: string): string[] => {
      if (!ticker) return [];

      const trimmed = ticker.trim();
      if (!trimmed) return [];

      const lowercaseTicker = trimmed.toLowerCase();
      const withoutExchange = lowercaseTicker.includes(':')
        ? lowercaseTicker.split(':').pop() ?? lowercaseTicker
        : lowercaseTicker;

      const baseCandidates = new Set<string>([
        withoutExchange,
        withoutExchange.replace(/[^a-z0-9.-]/g, '-'),
        withoutExchange.replace(/[^a-z0-9]/g, ''),
        withoutExchange.replace(/\./g, '-'),
        withoutExchange.replace(/-/g, ''),
      ]);

      const normalizedCandidates = Array.from(baseCandidates)
        .map(candidate => candidate.replace(/-+/g, '-').replace(/^-|-$/g, ''))
        .filter(candidate => candidate.length > 0);

      const uniqueUrls = new Set<string>();
      const addUniqueUrl = (url: string) => {
        if (!uniqueUrls.has(url)) {
          uniqueUrls.add(url);
        }
      };

      const addPathVariants = (base: string) => {
        addUniqueUrl(base);
        if (!base.endsWith('/')) {
          addUniqueUrl(`${base}/`);
        }
      };

      for (const candidate of normalizedCandidates) {
        const baseUrl = `https://stockanalysis.com/stocks/${candidate}`;

        const prioritizedPaths = [
          'financials/metrics',
          'financials/ratios',
          'financials/cash-flow-statement',
          'financials/balance-sheet',
          'financials',
          'financials/quarterly',
          'financials/income-statement',
          'financials/cash-flow',
          '',
          'earnings',
        ];

        for (const path of prioritizedPaths) {
          const trimmedPath = path.replace(/\/+$/g, '');
          if (trimmedPath.length === 0) {
            addPathVariants(baseUrl);
            continue;
          }

          addPathVariants(`${baseUrl}/${trimmedPath}`);
        }
      }

      return Array.from(uniqueUrls);
    };

    const buildStockAnalysisQuery = (ticker: string, urls: string[]): string => {
      const trimmedTicker = ticker.trim();
      const upperTicker = trimmedTicker.toUpperCase();
      let slug = trimmedTicker.toLowerCase();

      const subPathSet = new Set<string>();

      for (const candidateUrl of urls) {
        try {
          const parsed = new URL(candidateUrl);
          if (parsed.hostname.replace(/^www\./, '') !== 'stockanalysis.com') {
            continue;
          }

          const segments = parsed.pathname.split('/').filter(Boolean);
          const stocksIndex = segments.indexOf('stocks');
          if (stocksIndex === -1 || stocksIndex + 1 >= segments.length) {
            continue;
          }

          const slugCandidate = segments[stocksIndex + 1];
          if (slugCandidate) {
            slug = slugCandidate.toLowerCase();
          }

          const subSegments = segments.slice(stocksIndex + 2);
          if (subSegments.length > 0) {
            const subPath = subSegments.join('/').replace(/\/+$/g, '');
            if (subPath) {
              subPathSet.add(subPath);
            }
          }
        } catch (_error) {
          continue;
        }
      }

      const defaultSubPaths = [
        'financials',
        'financials/metrics',
        'financials/ratios',
        'financials/cash-flow-statement',
        'financials/balance-sheet',
      ];

      const subPaths = subPathSet.size > 0
        ? Array.from(subPathSet)
        : defaultSubPaths;

      const limitedSubPaths = subPaths
        .map(path => path.replace(/^\/+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);

      const baseUrl = `https://stockanalysis.com/stocks/${slug}`;

      const buildQueryFromPaths = (paths: string[]): string => {
        const pathText = paths.length > 0
          ? ` such as ${paths.join(', ')}`
          : '';

        return [
          `Extract the latest reported financial figures for ${upperTicker} (revenue, EPS, net income, cash flow, margins, debt ratios, guidance).`,
          `Use ${baseUrl} financial pages${pathText}.`,
          'Return the numbers with brief Swedish notes.',
        ].join(' ');
      };

      let query = buildQueryFromPaths(limitedSubPaths);

      while (query.length > 400 && limitedSubPaths.length > 1) {
        limitedSubPaths.pop();
        query = buildQueryFromPaths(limitedSubPaths);
      }

      if (query.length > 400) {
        query = buildQueryFromPaths([]);
      }

      if (query.length > 400) {
        query = `${query.slice(0, 397)}...`;
      }

      return query;
    };

    const fetchStockAnalysisFinancialContext = async (
      ticker: string,
      message: string,
    ): Promise<TavilyContextPayload> => {
      const urlCandidates = buildStockAnalysisUrlCandidates(ticker);
      if (urlCandidates.length === 0) {
        return { formattedContext: '', sources: [] };
      }

      console.log('Tavily StockAnalysis-förfrågan, prioriterade URL:er:', urlCandidates.slice(0, 6));

      const targetedQuery = buildStockAnalysisQuery(ticker, urlCandidates);

      const targetedContext = await fetchTavilyContext(message, {
        query: targetedQuery,
        includeDomains: ['stockanalysis.com'],
        searchDepth: 'advanced',
        maxResults: 5,
        includeRawContent: true,
        timeoutMs: 7000,
        requireRecentDays: RECENT_FINANCIAL_DATA_MAX_DAYS,
        allowUndatedFromDomains: DEFAULT_UNDATED_FINANCIAL_DOMAINS,
      });

      return targetedContext;
    };

    const detectedTickers = extractTickerSymbols(message);
    const primaryDetectedTicker = detectedTickers.length > 0 ? detectedTickers[0] : null;

    const hasTickerSymbolMention = (() => {
      if (detectedTickers.length === 0) return false;

      const tokens = message.trim().split(/\s+/);
      const allTokensAreTickers = tokens.length > 0 && tokens.every(token => detectedTickers.includes(token.toUpperCase()));

      return hasStockContext || allTokensAreTickers;
    })();

    // Check for stock mentions in user message
    const stockMentionsInMessage = stockMentionPatterns.some(({ regex, requiresContext }) => {
      regex.lastIndex = 0;
      if (requiresContext && !hasStockContext) {
        return false;
      }
      return regex.test(message);
    }) || hasTickerSymbolMention;

    const lowerCaseMessage = message.toLowerCase();
    const mentionsPersonalPortfolio = /(?:min|mitt|mina|vår|vårt|våra)\s+(?:portfölj(?:en)?|innehav|investeringar|aktier)/i.test(message);
    const asksAboutPortfolioImpact = /påverkar.*(?:min|mitt|mina|vår|vårt|våra).*(?:portfölj|portföljen|innehav|investeringar|aktier|sparande)/i.test(lowerCaseMessage);
    const referencesPersonalInvestments = mentionsPersonalPortfolio || asksAboutPortfolioImpact;
    const isFinancialDataRequest = FINANCIAL_DATA_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));

    let isStockMentionRequest = stockMentionsInMessage || isStockAnalysisRequest || (isFinancialDataRequest && detectedTickers.length > 0);

    if (openAIApiKey) {
      const stockIntentAssessment = await evaluateStockIntentWithOpenAI({
        message,
        detectedTickers,
        heuristicsTriggered: isStockMentionRequest,
        hasStockContext,
        analysisCue: isStockAnalysisRequest,
        apiKey: openAIApiKey,
      });

      if (stockIntentAssessment) {
        console.log('Stock intent classification:', stockIntentAssessment.classification);
        if (stockIntentAssessment.rationale) {
          console.log('Stock intent rationale:', stockIntentAssessment.rationale);
        }

        isStockMentionRequest = stockIntentAssessment.classification === 'stock_focus';
      }
    }

    // Check if user wants personal investment advice/recommendations
    const isPersonalAdviceRequest = /(?:rekommendation|förslag|vad ska jag|bör jag|passar mig|min portfölj|mina intressen|för mig|personlig|skräddarsy|baserat på|investera|köpa|sälja|portföljanalys|investeringsstrategi)/i.test(message);
    const isPortfolioOptimizationRequest = /portfölj/i.test(message) && /optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma/i.test(message);

    // Fetch Tavily context when the user mentions stocks or requests real-time insights
    let tavilyContext: TavilyContextPayload = { formattedContext: '', sources: [] };

    const userHasPortfolio = Array.isArray(holdings) &&
      holdings.some((holding: HoldingRecord) => holding?.holding_type !== 'recommendation');

    // ENHANCED INTENT ROUTING SYSTEM
    type IntentSelection = {
      primaryIntent: IntentType;
      intents: IntentType[];
      entities: string[];
      language: string | null;
      source: 'interpreter' | 'fallback';
    };

    const detectIntent = async (message: string): Promise<IntentSelection> => {
      const interpreterResult = await detectUserIntentWithOpenAI(message, openAIApiKey);
      const interpreterIntents = interpreterResult?.intents ?? [];
      const interpreterEntities = interpreterResult?.entities ?? [];
      const interpreterLanguage = interpreterResult?.language ?? null;

      let primaryIntent = interpreterIntents[0];
      let intentSource: 'interpreter' | 'fallback' = 'interpreter';
      let resolvedIntents = interpreterIntents.slice();

      const interpreterMarkedSummary = interpreterIntents.includes('document_summary');
      if (hasUploadedDocuments && interpreterMarkedSummary) {
        primaryIntent = 'document_summary';
        resolvedIntents = ['document_summary'];
      }

      if (!primaryIntent) {
        const embeddingIntent = await classifyIntentWithEmbeddings(message, supabase, openAIApiKey);
        if (embeddingIntent) {
          primaryIntent = embeddingIntent;
          intentSource = 'fallback';
          resolvedIntents = [embeddingIntent];
        }
      }

      if (!primaryIntent) {
        const llmIntent = await classifyIntentWithLLM(message, openAIApiKey);
        if (llmIntent) {
          primaryIntent = llmIntent;
          intentSource = 'fallback';
          resolvedIntents = [llmIntent];
        }
      }

      if (!primaryIntent) {
        if (hasUploadedDocuments && summaryPatternTriggered) {
          primaryIntent = 'document_summary';
        } else if (isStockMentionRequest ||
            (/(?:analysera|analys av|vad tycker du om|berätta om|utvärdera|bedöm|värdera|opinion om|kursmål|värdering av|fundamentalanalys|teknisk analys|vad har.*för|information om|företagsinfo)/i.test(message) &&
            /(?:aktie|aktien|bolaget|företaget|aktier|stock|share|equity|[A-Z]{3,5})/i.test(message))) {
          primaryIntent = 'stock_analysis';
        } else {
          const newsIntent = await evaluateNewsIntentWithOpenAI({
            message,
            hasPortfolio: userHasPortfolio,
            apiKey: openAIApiKey,
          });

          if (newsIntent) {
            primaryIntent = newsIntent;
          } else if (/(?:portfölj|portfolio)/i.test(message) && /(?:optimera|optimering|förbättra|effektivisera|balansera|omviktning|trimma|rebalansera)/i.test(message)) {
            primaryIntent = 'portfolio_optimization';
          } else if (/(?:byt|ändra|ersätt|ta bort|sälja|köpa|mer av|mindre av|position|handel)/i.test(message)) {
            primaryIntent = 'buy_sell_decisions';
          } else if (/(?:marknad|index|trend|prognos|ekonomi|räntor|inflation|börsen)/i.test(message)) {
            primaryIntent = 'market_analysis';
          } else {
            primaryIntent = 'general_advice';
          }
        }

        intentSource = 'fallback';
        resolvedIntents = [primaryIntent];
      }

      if (hasUploadedDocuments && (summaryPatternTriggered || resolvedIntents.includes('document_summary'))) {
        primaryIntent = 'document_summary';
        intentSource = interpreterMarkedSummary ? intentSource : 'fallback';
        resolvedIntents = ['document_summary'];
      }

      if (resolvedIntents.length === 0) {
        resolvedIntents = [primaryIntent ?? 'general_advice'];
      }

      return {
        primaryIntent: primaryIntent ?? 'general_advice',
        intents: resolvedIntents,
        entities: interpreterEntities,
        language: interpreterLanguage,
        source: intentSource,
      };
    };

    const { primaryIntent: userIntent, intents: detectedIntents, entities: interpretedEntities, language: interpretedLanguage, source: intentSource } = await detectIntent(message);

    if (hasUploadedDocuments && (userIntent === 'document_summary' || detectedIntents.includes('document_summary'))) {
      isDocumentSummaryRequest = true;
    }
    const personalIntentTypes = new Set<IntentType>(['portfolio_optimization', 'buy_sell_decisions', 'news_update', 'stock_analysis']);
    let shouldIncludePersonalContext = personalIntentTypes.has(userIntent)
      || isPersonalAdviceRequest
      || isPortfolioOptimizationRequest
      || referencesPersonalInvestments;

    if (isDocumentSummaryRequest) {
      shouldIncludePersonalContext = false;
    }

    if ((userIntent === 'market_analysis' || userIntent === 'general_news')
      && !referencesPersonalInvestments
      && !isPersonalAdviceRequest) {
      shouldIncludePersonalContext = false;
    }

    console.log('Detected user intent:', userIntent, 'source:', intentSource, 'all intents:', detectedIntents.join(', '));
    if (interpretedEntities.length > 0) {
      console.log('Interpreter entities:', interpretedEntities.join(', '));
    }
    if (interpretedLanguage) {
      console.log('Interpreter language guess:', interpretedLanguage);
    }

    const realTimeAssessment = await determineRealTimeSearchNeed({
      message,
      userIntent,
      recentMessages: recentUserMessages,
      openAIApiKey,
    });
    const hasRealTimeTrigger = realTimeAssessment.needsRealtime;
    const realTimeQuestionType = realTimeAssessment.questionType;
    const recommendationPreference = realTimeAssessment.recommendationPreference;
    if (realTimeAssessment.signals.length > 0) {
      console.log('Real-time assessment signals:', realTimeAssessment.signals.join(', '), 'LLM used:', realTimeAssessment.usedLLM);
    }

    if (realTimeQuestionType) {
      console.log('LLM question type:', realTimeQuestionType);
    }

    if (recommendationPreference) {
      console.log('LLM recommendation preference:', recommendationPreference);
    }

    const isSimplePersonalAdviceRequest = (
      isPersonalAdviceRequest || isPortfolioOptimizationRequest
    ) &&
      !isStockMentionRequest &&
      !hasRealTimeTrigger &&
      detectedTickers.length === 0;

    const entityAwareQuery = buildEntityAwareQuery({
      message,
      tickers: detectedTickers,
      companyNames: sheetTickerNames,
      hasRealTimeTrigger,
      userIntent,
      detectedEntities: interpretedEntities,
    });

    const shouldFetchTavily = !hasUploadedDocuments && !isDocumentSummaryRequest && !isSimplePersonalAdviceRequest && (
      isStockMentionRequest || hasRealTimeTrigger
    );
    if (shouldFetchTavily) {
      const logMessage = isStockMentionRequest
        ? 'Aktieomnämnande upptäckt – anropar Tavily för relevanta nyheter.'
        : 'Fråga upptäckt som realtidsfråga – anropar Tavily.';
      console.log(logMessage);

      const shouldPrioritizeStockAnalysis = primaryDetectedTicker && (isStockAnalysisRequest || isFinancialDataRequest);

      const determineTavilyTopic = (): TavilyTopic => {
        if (hasRealTimeTrigger || userIntent === 'general_news' || userIntent === 'news_update' || userIntent === 'market_analysis') {
          return 'news';
        }
        if (isStockAnalysisRequest || isFinancialDataRequest) {
          return 'finance';
        }
        return 'finance';
      };

      const shouldUseAdvancedDepth = shouldPrioritizeStockAnalysis
        || isFinancialDataRequest
        || userIntent === 'news_update'
        || userIntent === 'market_analysis'
        || hasRealTimeTrigger;

      const normalizeTickerToken = (value: string | null | undefined): string => {
        if (!value) return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        const upper = trimmed.toUpperCase();
        const withoutPrefix = upper.includes(':')
          ? upper.split(':').pop() ?? upper
          : upper;
        return withoutPrefix.replace(/[^A-Za-z0-9]/g, '');
      };

      const swedishTickerLookup = new Set(swedishTickerSymbols.map(symbol => symbol.toUpperCase()));
      const normalizedMessageNoDiacritics = removeDiacritics(message).toLowerCase();
      const messageIncludesSwedishName = swedishCompanyNamesNormalized.some(name =>
        typeof name === 'string'
          && name.length > 2
          && normalizedMessageNoDiacritics.includes(name)
      );
      const interpreterEntityText = interpretedEntities
        .map(entity => removeDiacritics(entity).toLowerCase())
        .join(' ');

      let swedishScore = 0;
      let internationalScore = 0;

      const seenTickerTokens = new Set<string>();
      const considerTickerForLocale = (ticker: string | null | undefined) => {
        const normalizedTicker = normalizeTickerToken(ticker);
        if (!normalizedTicker || seenTickerTokens.has(normalizedTicker)) {
          return;
        }
        seenTickerTokens.add(normalizedTicker);

        const mappedCurrency = sheetTickerCurrencyMap.get(normalizedTicker) ?? null;
        if (mappedCurrency === 'SEK' || swedishTickerLookup.has(normalizedTicker)) {
          swedishScore += 3;
          return;
        }

        if (mappedCurrency && mappedCurrency !== 'SEK') {
          internationalScore += 3;
        }
      };

      considerTickerForLocale(primaryDetectedTicker);
      detectedTickers.forEach(considerTickerForLocale);

      if (messageIncludesSwedishName || staticCompanyPattern.regex.test(message)) {
        swedishScore += 2;
      }

      const swedishContextPattern = /(sverige|svensk[at]?|stockholm|stockholmsbörsen|omx|first\s+north|large\s+cap|mid\s+cap|small\s+cap)/i;
      const swedishTickerIndicatorPattern = /\b(?:[A-Z]{1,5}\.ST|STO:[A-Z0-9]+)\b/;
      if (swedishContextPattern.test(message)) {
        swedishScore += 1;
      }
      if (swedishTickerIndicatorPattern.test(message)) {
        swedishScore += 1;
      }
      if (interpreterEntityText.includes('sweden') || interpreterEntityText.includes('swedish')) {
        swedishScore += 1;
      }

      const internationalContextPattern = /(nasdaq|nyse|usa|amerikansk|amerika|wall\s+street|london|lse|storbritannien|uk|england|frankfurt|tyskland|germany|paris|euronext|tokyo|japan|hong\s*kong|kina|china|kanada|canada|tsx|asx|australien|singapore)/i;
      if (internationalContextPattern.test(message)) {
        internationalScore += 1;
      }
      if (interpreterEntityText.includes('usa')
        || interpreterEntityText.includes('united states')
        || interpreterEntityText.includes('germany')
        || interpreterEntityText.includes('france')
        || interpreterEntityText.includes('uk')
        || interpreterEntityText.includes('london')
        || interpreterEntityText.includes('china')
        || interpreterEntityText.includes('japan')) {
        internationalScore += 1;
      }

      const determineIncludeDomains = (): string[] => {
        if (swedishScore === 0 && internationalScore === 0) {
          return TRUSTED_TAVILY_DOMAINS;
        }
        if (swedishScore >= internationalScore) {
          return SWEDISH_PRIORITY_TAVILY_DOMAINS;
        }
        return INTERNATIONAL_PRIORITY_TAVILY_DOMAINS;
      };

      const prioritizedIncludeDomains = determineIncludeDomains();
      if (swedishScore > 0 || internationalScore > 0) {
        console.log('Tavily domain preference scores:', {
          swedishScore,
          internationalScore,
          prioritizedDomainsPreview: prioritizedIncludeDomains.slice(0, 6),
        });
      }

      const buildDefaultTavilyOptions = (): TavilySearchOptions => {
        const options: TavilySearchOptions = {
          query: entityAwareQuery ?? undefined,
          includeDomains: prioritizedIncludeDomains,
          excludeDomains: DEFAULT_EXCLUDED_TAVILY_DOMAINS,
          includeRawContent: shouldUseAdvancedDepth,
          topic: determineTavilyTopic(),
          searchDepth: shouldUseAdvancedDepth ? 'advanced' : 'basic',
          maxResults: 6,
          timeoutMs: hasRealTimeTrigger ? 5000 : 6500,
        };

        if (hasRealTimeTrigger || userIntent === 'news_update') {
          options.timeRange = 'day';
          if (options.topic === 'news' && options.days === undefined) {
            options.days = 3;
          }
          options.requireRecentDays = RECENT_NEWS_MAX_DAYS;
        } else if (userIntent === 'general_news' || userIntent === 'market_analysis') {
          options.timeRange = 'week';
          if (options.topic === 'news' && options.days === undefined) {
            options.days = 7;
          }
          options.requireRecentDays = RECENT_MARKET_NEWS_MAX_DAYS;
        }

        if (isFinancialDataRequest) {
          const candidateDays = RECENT_FINANCIAL_DATA_MAX_DAYS;
          options.requireRecentDays = options.requireRecentDays !== undefined
            ? Math.min(options.requireRecentDays, candidateDays)
            : candidateDays;
          options.allowUndatedFromDomains = DEFAULT_UNDATED_FINANCIAL_DOMAINS;
        }

        return options;
      };

      if (shouldPrioritizeStockAnalysis) {
        console.log(`Försöker hämta finansiell data för ${primaryDetectedTicker} från stockanalysis.com.`);
        tavilyContext = await fetchStockAnalysisFinancialContext(primaryDetectedTicker, message);

        if (tavilyContext.formattedContext) {
          console.log('Lyckades hämta data från stockanalysis.com.');
        } else {
          console.log('Inga resultat från stockanalysis.com, försöker med bredare Tavily-sökning.');
          tavilyContext = await fetchTavilyContext(message, buildDefaultTavilyOptions());
        }
      } else {
        tavilyContext = await fetchTavilyContext(message, buildDefaultTavilyOptions());
      }

      if (tavilyContext.formattedContext) {
        console.log('Tavily-kontent hämtad och läggs till i kontexten.');
      }
    }

    // AI Memory update function
    const updateAIMemory = async (
      supabase: any,
      userId: string,
      userMessage: string,
      aiResponse: string,
      existingMemory: any,
      detectedIntent: IntentType,
    ) => {
      try {
        const normalizedMessage = userMessage.toLowerCase();
        const interests: string[] = [];
        const companies: string[] = [];

        const techKeywords = ['teknik', 'ai', 'mjukvara', 'innovation', 'digitalisering'];
        const healthKeywords = ['hälsa', 'medicin', 'bioteknik', 'läkemedel', 'vård'];
        const energyKeywords = ['energi', 'förnybar', 'miljö', 'hållbarhet', 'grön'];

        if (techKeywords.some(keyword => normalizedMessage.includes(keyword))) {
          interests.push('Teknik');
        }
        if (healthKeywords.some(keyword => normalizedMessage.includes(keyword))) {
          interests.push('Hälsovård');
        }
        if (energyKeywords.some(keyword => normalizedMessage.includes(keyword))) {
          interests.push('Förnybar energi');
        }

        const companyPattern = /\b([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)*)\b/g;
        const matches = userMessage.match(companyPattern);
        if (matches) {
          companies.push(...matches.map(item => item.trim()).filter(Boolean).slice(0, 5));
        }

        const wantsConcise = /(håll.*kort|kortfattat|kort svar|snabb sammanfattning|bara det viktigaste)/i.test(userMessage);
        const wantsDetailed = /(mer detaljer|djupare analys|kan du utveckla|förklara mer|utförligt)/i.test(userMessage);

        let preferredResponseLength: 'concise' | 'detailed' | string = existingMemory?.preferred_response_length || (userMessage.length > 120 ? 'detailed' : 'concise');
        if (wantsConcise) {
          preferredResponseLength = 'concise';
        } else if (wantsDetailed) {
          preferredResponseLength = 'detailed';
        }

        let communicationStyle: 'concise' | 'detailed' | string = existingMemory?.communication_style || (userMessage.length > 60 ? 'detailed' : 'concise');
        if (wantsConcise) {
          communicationStyle = 'concise';
        } else if (wantsDetailed) {
          communicationStyle = 'detailed';
        }

        const goalPatterns: Array<{ pattern: RegExp; label: string }> = [
          { pattern: /pension/i, label: 'pension' },
          { pattern: /passiv(?:\s+|-)inkomst/i, label: 'passiv inkomst' },
          { pattern: /utdelning/i, label: 'utdelningsfokus' },
          { pattern: /långsiktig|långsiktigt/i, label: 'långsiktig tillväxt' },
          { pattern: /barnspar/i, label: 'barnsparande' },
        ];

        const detectedGoals = new Set<string>(Array.isArray(existingMemory?.current_goals) && existingMemory.current_goals.length > 0
          ? existingMemory.current_goals
          : ['långsiktig tillväxt']);
        goalPatterns.forEach(({ pattern, label }) => {
          if (pattern.test(userMessage) || pattern.test(aiResponse)) {
            detectedGoals.add(label);
          }
        });

        const updatedFavoriteSectors = Array.from(new Set([...(existingMemory?.favorite_sectors || []), ...interests])).slice(0, 6);
        const updatedFavoriteCompanies = Array.from(new Set([...(existingMemory?.favorite_companies || []), ...companies])).slice(0, 6);

        let expertiseLevel: 'beginner' | 'intermediate' | 'advanced' = (existingMemory?.expertise_level as 'beginner' | 'intermediate' | 'advanced') || 'beginner';
        if (riskProfile?.investment_experience && ['beginner', 'intermediate', 'advanced'].includes(riskProfile.investment_experience)) {
          expertiseLevel = riskProfile.investment_experience as 'beginner' | 'intermediate' | 'advanced';
        }
        if ((isStockAnalysisRequest || isPortfolioOptimizationRequest) && expertiseLevel !== 'advanced') {
          expertiseLevel = expertiseLevel === 'beginner' ? 'intermediate' : 'advanced';
        }

        const followUpPreference = wantsConcise ? 'skip' : existingMemory?.follow_up_preference ?? 'auto';

        const memoryData = {
          user_id: userId,
          total_conversations: (existingMemory?.total_conversations || 0) + 1,
          communication_style: communicationStyle,
          preferred_response_length: preferredResponseLength,
          expertise_level: expertiseLevel,
          frequently_asked_topics: [
            ...(existingMemory?.frequently_asked_topics || []),
            ...(isStockAnalysisRequest ? ['aktieanalys'] : []),
            ...(isPortfolioOptimizationRequest ? ['portföljoptimering'] : [])
          ].slice(0, 6),
          favorite_sectors: updatedFavoriteSectors,
          favorite_companies: updatedFavoriteCompanies,
          current_goals: Array.from(detectedGoals).slice(0, 6),
          follow_up_preference: followUpPreference,
          last_detected_intent: detectedIntent,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_ai_memory')
          .upsert(memoryData, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating AI memory:', error);
        } else {
          console.log('AI memory updated successfully');
        }
      } catch (error) {
        console.error('Error in updateAIMemory:', error);
      }
    };

    // Build enhanced context with intent-specific prompts
    const normalizePreference = (value: string | null | undefined): 'concise' | 'balanced' | 'detailed' | null => {
      if (!value) return null;
      if (value === 'concise' || value === 'detailed') {
        return value;
      }
      if (value === 'balanced') {
        return 'balanced';
      }
      return null;
    };

    const expertiseFromMemory = typeof aiMemory?.expertise_level === 'string'
      && ['beginner', 'intermediate', 'advanced'].includes(aiMemory.expertise_level)
      ? aiMemory.expertise_level as 'beginner' | 'intermediate' | 'advanced'
      : null;
    const expertiseFromProfile = typeof riskProfile?.investment_experience === 'string'
      && ['beginner', 'intermediate', 'advanced'].includes(riskProfile.investment_experience)
      ? riskProfile.investment_experience as 'beginner' | 'intermediate' | 'advanced'
      : null;

    let preferredLength = normalizePreference(aiMemory?.preferred_response_length);
    if (!preferredLength) {
      if (message.length < 120) {
        preferredLength = 'concise';
      } else if (message.length > 240) {
        preferredLength = 'detailed';
      } else {
        preferredLength = 'balanced';
      }
    }

    const followUpPreference = typeof aiMemory?.follow_up_preference === 'string' ? aiMemory.follow_up_preference : 'auto';
    let shouldOfferFollowUp = followUpPreference !== 'skip' && aiMemory?.communication_style !== 'concise';
    if (['general_news'].includes(userIntent) && followUpPreference !== 'force') {
      shouldOfferFollowUp = false;
    }

    const basePrompt = buildBasePrompt({
      shouldOfferFollowUp,
      expertiseLevel: expertiseFromMemory ?? expertiseFromProfile ?? null,
      preferredResponseLength: preferredLength,
    });

    const headingDirective = buildHeadingDirectives({ intent: userIntent });
    const intentPrompt = buildIntentPrompt(userIntent);

    const favoriteSectorCandidates = new Set<string>();
    if (Array.isArray(aiMemory?.favorite_sectors)) {
      aiMemory.favorite_sectors.forEach((sector: string) => {
        if (typeof sector === 'string' && sector.trim()) {
          favoriteSectorCandidates.add(sector.trim());
        }
      });
    }
    if (Array.isArray(riskProfile?.sector_interests)) {
      riskProfile.sector_interests.forEach((sector: string) => {
        if (typeof sector === 'string' && sector.trim()) {
          favoriteSectorCandidates.add(sector.trim());
        }
      });
    }

    const personalizationPrompt = buildPersonalizationPrompt({
      aiMemory,
      favoriteSectors: Array.from(favoriteSectorCandidates),
      currentGoals: Array.isArray(aiMemory?.current_goals) ? aiMemory.current_goals : undefined,
    });

    const contextSections = [basePrompt];
    if (headingDirective) {
      contextSections.push(headingDirective);
    }
    contextSections.push(intentPrompt);
    if (recommendationPreference === 'no') {
      contextSections.push('REKOMMENDATIONSPOLICY:\n- Användaren har inte bett om investeringsrekommendationer eller köp/sälj-råd.\n- Fokusera på att beskriva nuläget, risker och observationer utan att föreslå specifika affärer eller omviktningar.\n- Om du nämner bevakningspunkter, håll dem neutrala och undvik att säga åt användaren att agera.');
    } else if (recommendationPreference === 'yes') {
      contextSections.push('REKOMMENDATIONSPOLICY:\n- Användaren vill ha konkreta investeringsrekommendationer. Leverera tydliga råd med motivering när det är relevant.');
    }
    if (personalizationPrompt) {
      contextSections.push(`PERSONLIGA PREFERENSER:\n${personalizationPrompt}`);
    }

    let contextInfo = contextSections.join('\n\n');


    // Enhanced user context with current holdings and performance
    if (shouldIncludePersonalContext && riskProfile) {
      contextInfo += `\n\nANVÄNDARPROFIL (använd denna info, fråga ALDRIG efter den igen):
- Ålder: ${riskProfile.age || 'Ej angiven'}
- Risktolerans: ${riskProfile.risk_tolerance === 'conservative' ? 'Konservativ' : riskProfile.risk_tolerance === 'moderate' ? 'Måttlig' : 'Aggressiv'}
- Investeringshorisont: ${riskProfile.investment_horizon === 'short' ? 'Kort (0–2 år)' : riskProfile.investment_horizon === 'medium' ? 'Medellång (3–5 år)' : 'Lång (5+ år)'}
- Erfarenhetsnivå: ${riskProfile.investment_experience === 'beginner' ? 'Nybörjare' : riskProfile.investment_experience === 'intermediate' ? 'Mellannivå' : 'Erfaren'}`;
      
      if (riskProfile.monthly_investment_amount) {
        contextInfo += `\n- Månatligt sparande: ${riskProfile.monthly_investment_amount.toLocaleString()} SEK`;
      }
      
      if (riskProfile.annual_income) {
        contextInfo += `\n- Årsinkomst: ${riskProfile.annual_income.toLocaleString()} SEK`;
      }
      
      if (riskProfile.sector_interests && riskProfile.sector_interests.length > 0) {
        contextInfo += `\n- Sektorintressen: ${riskProfile.sector_interests.join(', ')}`;
      }
      
      if (riskProfile.investment_goal) {
        contextInfo += `\n- Investeringsmål: ${riskProfile.investment_goal}`;
      }
    }

    // Add current portfolio context with latest valuations
    if (shouldIncludePersonalContext && holdings && holdings.length > 0) {
      const actualHoldings: HoldingRecord[] = (holdings as HoldingRecord[]).filter((h) => h.holding_type !== 'recommendation');
      if (actualHoldings.length > 0) {
        const holdingsWithValues = actualHoldings.map((holding) => ({
          holding,
          value: resolveHoldingValue(holding),
        }));

        const totalValue = holdingsWithValues.reduce((sum, item) => sum + item.value.valueInSEK, 0);

        const actualHoldingsLookup = new Map<string, { label: string; percentage: number; valueInSEK: number }>();

        holdingsWithValues.forEach(({ holding, value }) => {
          const label = holding.symbol || holding.name || 'Okänt innehav';
          const percentage = totalValue > 0 ? (value.valueInSEK / totalValue) * 100 : 0;
          const entry = { label, percentage, valueInSEK: value.valueInSEK };

          const symbolKey = normalizeIdentifier(typeof holding.symbol === 'string' ? holding.symbol : null);
          const nameKey = normalizeIdentifier(typeof holding.name === 'string' ? holding.name : null);

          if (symbolKey && !actualHoldingsLookup.has(symbolKey)) {
            actualHoldingsLookup.set(symbolKey, entry);
          }

          if (nameKey && !actualHoldingsLookup.has(nameKey)) {
            actualHoldingsLookup.set(nameKey, entry);
          }
        });

        const topHoldings = [...holdingsWithValues]
          .sort((a, b) => b.value.valueInSEK - a.value.valueInSEK)
          .slice(0, 5);

        const topHoldingsDetails = topHoldings.map(({ holding, value }) => {
          const label = holding.symbol || holding.name || 'Okänt innehav';
          const percentage = totalValue > 0 ? (value.valueInSEK / totalValue) * 100 : 0;

          const identifiers = new Set<string>();
          const symbolKey = normalizeIdentifier(typeof holding.symbol === 'string' ? holding.symbol : null);
          const nameKey = normalizeIdentifier(typeof holding.name === 'string' ? holding.name : null);

          if (symbolKey) identifiers.add(symbolKey);
          if (nameKey) identifiers.add(nameKey);

          return {
            label,
            percentage,
            formattedPercentage: percentage.toFixed(1),
            identifiers: Array.from(identifiers),
          };
        });

        let holdingsSummary = topHoldingsDetails
          .map(({ label, formattedPercentage }) => `${label} (${formattedPercentage}%)`)
          .join(', ');

        const totalValueFormatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(totalValue));

        let recommendedAllocationEntries: Array<{
          asset: string;
          percentage: number;
          displayValue: string;
          normalizedKey: string | null;
          actualPercentage: number | null;
        }> = [];

        if (portfolio && portfolio.asset_allocation && typeof portfolio.asset_allocation === 'object') {
          recommendedAllocationEntries = Object.entries(portfolio.asset_allocation)
            .map(([asset, rawValue]) => {
              const parsedValue = parseNumericValue(rawValue);
              if (parsedValue === null) return null;

              const normalizedKey = normalizeIdentifier(asset);
              const actualMatch = normalizedKey ? actualHoldingsLookup.get(normalizedKey) : undefined;

              return {
                asset,
                percentage: parsedValue,
                displayValue: typeof rawValue === 'number' ? rawValue.toString() : String(rawValue),
                normalizedKey,
                actualPercentage: actualMatch ? actualMatch.percentage : null,
              };
            })
            .filter((entry): entry is {
              asset: string;
              percentage: number;
              displayValue: string;
              normalizedKey: string | null;
              actualPercentage: number | null;
            } => entry !== null);

          if (recommendedAllocationEntries.length > 0) {
            holdingsSummary = topHoldingsDetails
              .map(({ label, formattedPercentage, identifiers }) => {
                const matchingAllocation = identifiers
                  .map(identifier => recommendedAllocationEntries.find(entry => entry.normalizedKey === identifier))
                  .find((match): match is {
                    asset: string;
                    percentage: number;
                    displayValue: string;
                    normalizedKey: string | null;
                    actualPercentage: number | null;
                  } => Boolean(match));

                if (matchingAllocation) {
                  return `${label} (nu ${formattedPercentage}%, mål ${matchingAllocation.displayValue}%)`;
                }

                return `${label} (${formattedPercentage}%)`;
              })
              .join(', ');
          }
        }

        contextInfo += `\n\nNUVARANDE PORTFÖLJ:
- Totalt värde: ${totalValueFormatted} SEK
- Antal innehav: ${actualHoldings.length}
- Största positioner: ${holdingsSummary || 'Inga registrerade innehav'}`;

        if (portfolio) {
          if (recommendedAllocationEntries.length > 0) {
            contextInfo += `\n- Rekommenderad allokering (använd dessa målviktstal när du diskuterar portföljens struktur):`;
            recommendedAllocationEntries.forEach(({ asset, displayValue, actualPercentage }) => {
              const actualText = actualPercentage !== null
                ? ` (nu ${actualPercentage.toFixed(1)}%)`
                : '';
              contextInfo += `\n  • ${formatAllocationLabel(asset)}: ${displayValue}%${actualText}`;
            });
          }

          contextInfo += `\n- Portföljens riskpoäng: ${portfolio.risk_score || 'Ej beräknad'}
- Förväntad årlig avkastning: ${portfolio.expected_return || 'Ej beräknad'}%`;
        }
      }
    }

    let documentContextHandled = false;

    if (filteredDocumentIds.length > 0) {
      if (isDocumentSummaryRequest) {
        try {
          const { data: documentRecords, error: documentRecordsError } = await supabase
            .from('chat_documents')
            .select('id, user_id, name, metadata, chunk_count')
            .in('id', filteredDocumentIds)
            .eq('user_id', userId);

          if (documentRecordsError) {
            console.error('Failed to fetch document metadata for summary', documentRecordsError);
          } else {
            const documentMetaMap = new Map<string, { name: string; metadata: Record<string, unknown> | null; chunkCount: number | null }>();
            const authorizedDocumentIds: string[] = [];

            (documentRecords ?? []).forEach((record) => {
              if (
                record &&
                typeof record.id === 'string' &&
                typeof record.user_id === 'string' &&
                record.user_id === userId
              ) {
                authorizedDocumentIds.push(record.id);
                documentMetaMap.set(record.id, {
                  name: typeof record.name === 'string' && record.name.trim().length > 0 ? record.name.trim() : 'Dokument',
                  metadata: (record.metadata ?? null) as Record<string, unknown> | null,
                  chunkCount: typeof record.chunk_count === 'number' ? record.chunk_count : null,
                });
              }
            });

            if (authorizedDocumentIds.length === 0) {
              console.warn('No authorized documents found for summary request', { filteredDocumentIds, userId });
            }

            const { data: chunkData, error: chunkError } = authorizedDocumentIds.length === 0
              ? { data: null, error: null }
              : await supabase
                .from('chat_document_chunks')
                .select('document_id, content, metadata, chunk_index')
                .in('document_id', authorizedDocumentIds)
                .order('document_id', { ascending: true })
                .order('chunk_index', { ascending: true });

            if (chunkError) {
              console.error('Failed to fetch document chunks for summary', chunkError);
            } else if (Array.isArray(chunkData) && chunkData.length > 0) {
              const groupedChunks = new Map<string, Array<{ content: string; metadata: { page_number?: number } | null; chunk_index: number | null }>>();

              chunkData.forEach((entry) => {
                if (!entry || typeof entry.document_id !== 'string') {
                  return;
                }

                const existing = groupedChunks.get(entry.document_id) ?? [];
                const metadata = (entry.metadata ?? null) as { page_number?: number } | null;
                existing.push({
                  content: typeof entry.content === 'string' ? entry.content : '',
                  metadata,
                  chunk_index: typeof entry.chunk_index === 'number' ? entry.chunk_index : null,
                });
                groupedChunks.set(entry.document_id, existing);
              });

              const summaryContextSections: string[] = [];
              let sourceCounter = 1;

              for (const [documentId, entries] of groupedChunks.entries()) {
                const sortedEntries = entries.sort((a, b) => (a.chunk_index ?? 0) - (b.chunk_index ?? 0));
                const meta = documentMetaMap.get(documentId);
                const documentName = meta?.name ?? 'Dokument';
                const metadataRecord = meta?.metadata as { page_count?: unknown } | null;
                const pageCount = typeof metadataRecord?.page_count === 'number' ? metadataRecord.page_count : null;
                const chunkCount = meta?.chunkCount ?? sortedEntries.length;

                const headerParts: string[] = [documentName];
                if (pageCount) {
                  headerParts.push(`${pageCount} sidor`);
                }
                headerParts.push(`${chunkCount} textavsnitt`);

                const aggregatedContent = sortedEntries
                  .map((entry) => {
                    const pageNumberRaw = typeof entry.metadata?.page_number === 'number'
                      ? entry.metadata.page_number
                      : null;
                    const pagePrefix = pageNumberRaw !== null ? `[Sida ${pageNumberRaw}] ` : '';
                    return `${pagePrefix}${entry.content}`.trim();
                  })
                  .filter((value) => value.length > 0)
                  .join('\n\n');

                if (aggregatedContent.length === 0) {
                  continue;
                }

                const truncatedContent = aggregatedContent.length > DOCUMENT_SUMMARY_CONTEXT_MAX_CHARS_PER_DOCUMENT
                  ? `${aggregatedContent.slice(0, DOCUMENT_SUMMARY_CONTEXT_MAX_CHARS_PER_DOCUMENT)}\n[Texten har kortats för att passa sammanfattningsuppdraget.]`
                  : aggregatedContent;

                summaryContextSections.push(`Källa ${sourceCounter}: ${headerParts.join(' – ')}\n${truncatedContent}`);
                sourceCounter += 1;
              }

              if (summaryContextSections.length > 0) {
                contextInfo += `\n\nFULLSTÄNDIGT DOKUMENTUNDERLAG FÖR SAMMANFATTNING:\n${summaryContextSections.join('\n\n')}`;
                contextInfo += `\n\nSAMMANFATTNINGSUPPDRAG:\n- Läs igenom hela textunderlaget ovan som representerar användarens uppladdade dokument.\n- Basera hela svaret på dokumentinnehållet som primär källa och komplettera endast med egna resonemang.\n- Identifiera dokumentets syfte, struktur och viktigaste slutsatser.\n- Destillera 5–7 centrala nyckelpunkter med relevanta siffror eller citat och hänvisa till sidnummer när det går.\n- Presentera en heltäckande men kondenserad sammanfattning med tydliga rubriker (t.ex. \"Översikt\", \"Nyckelpunkter\", \"Fördjupning\").\n- Avsluta med en sektion \"VD´ns ord och reflektioner\" om dokumentet antyder åtgärder eller uppföljning.\n- Undvik att återge långa textstycken ordagrant – fokusera på analys och tolkning.`;
                documentContextHandled = true;
              }
            }
          }
        } catch (error) {
          console.error('Failed to prepare document summary context', error);
        }
      }

      if (!documentContextHandled) {
        try {
          const queryEmbedding = await fetchEmbedding(message, openAIApiKey);
          if (queryEmbedding) {
            const { data: documentMatches, error: documentMatchError } = await supabase.rpc('match_chat_document_chunks', {
              p_query_embedding: queryEmbedding,
              p_match_count: DOCUMENT_CONTEXT_MATCH_COUNT,
              p_user_id: userId,
              p_document_ids: filteredDocumentIds.length > 0 ? filteredDocumentIds : null,
            });

            if (documentMatchError) {
              console.error('Document match RPC failed', documentMatchError);
            } else if (Array.isArray(documentMatches) && documentMatches.length > 0) {
              const groupedMatches = new Map<string, { name: string; entries: Array<{ content: string; metadata: { page_number?: number }; similarity: number | null }> }>();

              (documentMatches as Array<{
                document_id: string;
                document_name?: string | null;
                content: string;
                metadata?: { page_number?: number } | null;
                similarity?: number | null;
              }>).forEach((match) => {
                if (!match.document_id) {
                  return;
                }

                const existing = groupedMatches.get(match.document_id) ?? {
                  name: typeof match.document_name === 'string' && match.document_name.trim().length > 0
                    ? match.document_name.trim()
                    : 'Dokument',
                  entries: [],
                };

                existing.entries.push({
                  content: match.content,
                  metadata: (match.metadata ?? {}) as { page_number?: number },
                  similarity: typeof match.similarity === 'number' ? match.similarity : null,
                });

                groupedMatches.set(match.document_id, existing);
              });

              const documentContextLines: string[] = [];
              let sourceCounter = 1;

              for (const [, value] of groupedMatches) {
                const topEntries = value.entries.slice(0, 3);
                topEntries.forEach((entry) => {
                  const pageNumber = typeof entry.metadata?.page_number === 'number' ? entry.metadata.page_number : undefined;
                  const similarityText = entry.similarity !== null ? ` (Relevans ${(entry.similarity * 100).toFixed(1)}%)` : '';
                  const header = `${value.name}${pageNumber ? ` – Sida ${pageNumber}` : ''}${similarityText}`;
                  documentContextLines.push(`Källa ${sourceCounter}: ${header}\n${entry.content}`);
                  sourceCounter += 1;
                });
              }

              if (documentContextLines.length > 0) {
                contextInfo += `\n\nDOKUMENTUNDERLAG FRÅN UPPLADDADE FILER:\n${documentContextLines.join('\n\n')}`;
                contextInfo += `\n\nSÅ HANTERAR DU UPPLADDADE DOKUMENT:\n- Utgå från dokumentet som primär källa och dra dina slutsatser med det som bas.\n- Lyft fram konkreta siffror och nyckeltal från underlagen när de stärker din analys (t.ex. omsättning, resultat, kassaflöden).\n- Ange tydligt vilken källa och sida siffrorna kommer från, exempelvis "Årsredovisning 2023 – Sida 12".\n- Knyt rekommendationer och slutsatser till dessa dokumenterade fakta när det är relevant.`;
              }
            }
          }
        } catch (error) {
          console.error('Failed to enrich chat with document context', error);
        }
      }
    }

    // Add response structure requirements
    const structureLines = [
      'SVARSSTRUKTUR (ANPASSNINGSBAR):',
      '- Anpassa alltid svarens format efter frågans karaktär och utveckla resonemanget så långt som behövs för att svaret ska bli komplett – det finns ingen strikt begränsning på längden.',
      '- Vid generella marknadsfrågor: använd en nyhetsbrevsliknande ton och rubriker enligt variationen ovan.',
      '- Vid djupgående analyser: använd de rubriker som angavs tidigare (analys, rekommendation, risker, åtgärder) men ta enbart med sektioner som tillför värde.',
    ];

    if (isDocumentSummaryRequest) {
      structureLines.push('- Vid dokumentsammanfattningar: läs igenom hela underlaget, leverera en strukturerad översikt och inkludera sektioner för Översikt, Nyckelpunkter samt VD´ns ord och reflektioner när materialet motiverar det.');
    }

    if (recommendationPreference === 'no') {
      structureLines.push('- Ge inga investeringsrekommendationer, köp/sälj-råd eller portföljjusteringar i detta svar. Fokusera på att ge lägesbild och analys.');
    } else if (recommendationPreference === 'yes') {
      structureLines.push('- Om användaren efterfrågar vägledning, formulera det som bevakningspunkter eller saker att hålla koll på i stället för direkta köp-/säljrekommendationer.');
    } else {
      structureLines.push('- Lyft endast fram bevakningspunkter när de verkligen behövs och undvik direkta rekommendationer.');
    }

    const emojiLines = [
      'EMOJI-ANVÄNDNING:',
      '- Använd relevanta emojis för att förstärka budskapet, men max en per sektion och undvik emojis i avsnitt som beskriver allvarliga risker eller förluster.',
      '- Rotera emojis och rubriker enligt instruktionen ovan för att undvika monotona svar.',
    ];

    let recommendationSectionLine: string;
    if (recommendationPreference === 'no') {
      recommendationSectionLine = '- "Håll koll på detta" – Hoppa över denna sektion om användaren inte uttryckligen ber om bevakningspunkter.';
    } else if (recommendationPreference === 'yes') {
      recommendationSectionLine = '- "Håll koll på detta" – Om du anser att det tillför värde, lyft 1–2 viktiga observationer att bevaka i stället för konkreta rekommendationer.';
    } else {
      recommendationSectionLine = '- "Håll koll på detta" – Använd endast när det verkligen behövs och begränsa dig till korta bevakningspunkter.';
    }

    const optionalSections = isDocumentSummaryRequest
      ? [
          'MÖJLIGA SEKTIONER (välj flexibelt utifrån behov):',
          '- Översikt – Ge en kort bakgrund till dokumentet och dess huvudsakliga syfte.',
          '- Nyckelpunkter – Lista 5–7 huvudinsikter med sidreferenser när det är möjligt.',
          '- Fördjupning – Använd när specifika avsnitt kräver extra analys eller kontext.',
          recommendationSectionLine,
          '- Risker & Överväganden – Endast om dokumentet tar upp begränsningar eller riskmoment.',
          '- VD´ns ord och reflektioner – Lyft sammanfattade budskap eller nästa steg som framgår av dokumentet.',
          '- Uppföljning – Använd för att föreslå hur användaren kan arbeta vidare med materialet.',
        ]
      : [
          'MÖJLIGA SEKTIONER (välj flexibelt utifrån behov):',
          '- Analys/Insikt – Sammanfatta situationen eller frågan.',
          recommendationSectionLine,
          '- Risker & Överväganden – Endast om det finns relevanta risker att lyfta.',
          '- Åtgärdsplan/Nästa steg – Använd vid komplexa frågor som kräver steg-för-steg.',
          '- Nyhetsöversikt – Använd vid frågor om senaste nyheter eller marknadshändelser.',
          '- Uppföljning – Använd när du föreslår fortsatta analyser eller handlingar.',
        ];

    const importantLines = [
      'VIKTIGT:',
      '- Använd aldrig hela strukturen slentrianmässigt – välj endast sektioner som ger värde.',
      '- Variera rubriker och emojis för att undvika repetitiva svar.',
      '- Avsluta endast med en öppen fråga när det känns naturligt och svaret inte redan är komplett.',
      '- Avsluta svaret med en sektion "Källor:" där varje länk står på en egen rad (om källor finns).',
    ];

    if (isDocumentSummaryRequest) {
      importantLines.push('- Vid dokumentsammanfattningar: inkludera sidreferenser när du nämner nyckelfakta och fokusera på att destillera det viktigaste i stället för att citera långa textavsnitt.');
    }

    contextInfo += `
${structureLines.join('\n')}

${emojiLines.join('\n')}

${optionalSections.join('\n')}

${importantLines.join('\n')}
`;


    // Force using gpt-5.1 with reasoning-enabled features for consistent behavior
    const model = PRIMARY_CHAT_MODEL;

    console.log('Selected model:', model, 'for request type:', {
      isStockAnalysis: isStockAnalysisRequest,
      isPortfolioOptimization: isPortfolioOptimizationRequest,
      messageLength: message.length,
      historyLength: chatHistory.length
    });

    const hasMarketData = tavilyContext.formattedContext.length > 0;
    let tavilySourceInstruction = '';
    if (tavilyContext.sources.length > 0) {
      const formattedSourcesList = tavilyContext.sources
        .map((url, index) => `${index + 1}. ${url}`)
        .join('\n');
      tavilySourceInstruction = `\n\nKÄLLHÄNVISNINGAR FÖR AGENTEN:\n${formattedSourcesList}\n\nINSTRUKTION: Avsluta alltid ditt svar med en sektion "Källor:" som listar dessa länkar i samma ordning och med en länk per rad.`;
    }

    // Build messages array with enhanced context
    const messages = [
      { role: 'system', content: contextInfo + tavilyContext.formattedContext + tavilySourceInstruction },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    // Enhanced telemetry logging
    const requestId = crypto.randomUUID();
    const telemetryData = {
      requestId,
      userId,
      sessionId,
      messageType: isStockAnalysisRequest ? 'stock_analysis' : isPersonalAdviceRequest ? 'personal_advice' : 'general',
      model,
      timestamp: new Date().toISOString(),
      hasMarketData,
      isPremium
    };

    console.log('TELEMETRY START:', telemetryData);

    // Save user message to database first
    if (sessionId) {
      try {
        const userMessageContext: Record<string, unknown> = {
          analysisType,
          requestId,
          timestamp: new Date().toISOString()
        };

        if (filteredDocumentIds.length > 0) {
          userMessageContext.documentIds = filteredDocumentIds;
        }

        await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: userId,
            chat_session_id: sessionId,
            message: message,
            message_type: 'user',
            context_data: userMessageContext
          });
        console.log('User message saved to database');
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // If the client requests non-streaming, return JSON instead of SSE
    if (stream === false) {
      const nonStreamResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (!nonStreamResp.ok) {
        const errorBody = await nonStreamResp.text();
        console.error('OpenAI API error response:', errorBody);
        console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
        throw new Error(`OpenAI API error: ${nonStreamResp.status} - ${errorBody}`);
      }

      const nonStreamData = await nonStreamResp.json();
      const aiMessage = nonStreamData.choices?.[0]?.message?.content || '';

      // Update AI memory and optionally save to chat history
      await updateAIMemory(supabase, userId, message, aiMessage, aiMemory, userIntent);
      if (sessionId && aiMessage) {
        await supabase
          .from('portfolio_chat_history')
          .insert({
            user_id: userId,
            chat_session_id: sessionId,
            message: aiMessage,
            message_type: 'assistant',
            context_data: {
              analysisType,
              model,
              requestId,
              hasMarketData,
              profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
              requiresConfirmation: profileChangeDetection.requiresConfirmation,
              confidence: 0.8
            }
          });
      }

      console.log('TELEMETRY COMPLETE:', { ...telemetryData, responseLength: aiMessage.length, completed: true });

      return new Response(
        JSON.stringify({
          response: aiMessage,
          requiresConfirmation: profileChangeDetection.requiresConfirmation,
          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: streaming SSE response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API error response:', errorBody);
      console.error('TELEMETRY ERROR:', { ...telemetryData, error: errorBody });
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const streamResp = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let aiMessage = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Update AI memory
                  await updateAIMemory(supabase, userId, message, aiMessage, aiMemory, userIntent);
                  
                  // Send final telemetry
                  console.log('TELEMETRY COMPLETE:', { 
                    ...telemetryData, 
                    responseLength: aiMessage.length,
                    completed: true 
                  });
                  
                  // Save complete message to database
                  if (sessionId && aiMessage) {
                    await supabase
                      .from('portfolio_chat_history')
                      .insert({
                        user_id: userId,
                        chat_session_id: sessionId,
                        message: aiMessage,
                        message_type: 'assistant',
                        context_data: {
                          analysisType,
                          model,
                          requestId,
                          hasMarketData,
                          profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                          requiresConfirmation: profileChangeDetection.requiresConfirmation,
                          confidence: 0.8
                        }
                      });
                  }
                  
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    aiMessage += content;
                    
                    // Stream content to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      content,
                      profileUpdates: profileChangeDetection.requiresConfirmation ? profileChangeDetection.updates : null,
                      requiresConfirmation: profileChangeDetection.requiresConfirmation
                    })}\n\n`));
                  }
                } catch (e) {
                  // Ignore JSON parse errors for non-JSON lines
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          console.error('TELEMETRY STREAM ERROR:', { ...telemetryData, error: error.message });
          controller.error(error);
        }
      }
    });

    return new Response(streamResp, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in portfolio-ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});