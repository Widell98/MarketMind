import React from 'react';
import Layout from '@/components/Layout';

const Terms: React.FC = () => {
  return (
    <Layout>
      <section className="relative py-8 sm:py-12 lg:py-16">
        <div className="container-responsive">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-xl backdrop-blur">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" aria-hidden="true" />

              <div className="border-b border-border/60 bg-background/80 px-6 py-8 sm:px-10 sm:py-10">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Juridik &amp; regelefterlevnad</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tjänstevillkor</h1>
                <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Här beskriver vi vilka villkor som gäller när du använder MarketMind. Läs igenom
                  punkterna nedan för att förstå dina rättigheter och våra skyldigheter.
                </p>
              </div>

              <div className="prose dark:prose-invert max-w-none px-6 py-8 sm:px-10 sm:py-10">
                <h2>1. Allmänt</h2>
                <p>
                  Dessa tjänstevillkor ("Villkoren") reglerar användningen av tjänsten MarketMind
                  ("Tjänsten"), tillgänglig via market-mind.app. Tjänsten tillhandahålls av MarketMind
                  AB, med säte i Sverige ("Vi", "Oss"). Genom att skapa ett konto, använda Tjänsten
                  eller genomföra en betalning accepterar du dessa Villkor.
                </p>

                <h2>2. Tjänstens beskrivning</h2>
                <p>
                  Tjänsten tillhandahåller AI-genererade aktieanalyser ("case") och marknadsinsikter
                  baserade på realtidsdata. Syftet är informations- och utbildningsmässigt. Innehållet
                  ska inte tolkas som finansiell rådgivning enligt lagen (2003:862) om finansiell
                  rådgivning till konsumenter. Investeringsbeslut sker alltid på eget ansvar.
                </p>

                <h2>3. Användarkonton</h2>
                <p>
                  För att använda Tjänsten krävs ett konto. Du ansvarar för att uppgifterna du lämnar är
                  korrekta och för att skydda dina inloggningsuppgifter. Vi förbehåller oss rätten att
                  stänga av konton vid missbruk eller brott mot Villkoren.
                </p>

                <h2>4. Användning</h2>
                <p>
                  Du får använda Tjänsten för personligt, icke-kommersiellt bruk. Det är förbjudet att
                  automatisera eller masshämta innehåll. Vi får när som helst ändra, begränsa eller
                  avsluta delar av Tjänsten.
                </p>

                <h2>5. Betalningar och abonnemang</h2>
                <p>
                  Premium-abonnemang hanteras via Stripe. Priset framgår på vår webbplats och debiteras
                  månadsvis i SEK. Betalningen sker säkert via Stripe enligt deras villkor och
                  sekretesspolicy. Du kan säga upp abonnemanget när som helst via ditt konto utan
                  bindningstid. Avslut sker innan nästa faktureringsperiod för att undvika ny debitering.
                </p>

                <h2>6. Ångerrätt och återbetalningar</h2>
                <p>
                  Eftersom Tjänsten tillhandahåller digitalt innehåll som levereras omedelbart samtycker du
                  vid betalning till att ångerrätten enligt distansavtalslagen (2005:59) upphör när
                  leveransen påbörjats. Återbetalning kan dock beviljas vid tekniska fel eller
                  dubbeldebitering. Kontakta oss på <a href="mailto:support@market-mind.app">support@market-mind.app</a>.
                </p>

                <h2>7. Ansvarsbegränsning</h2>
                <p>
                  Vi garanterar inte att analyser eller data är fullständiga eller korrekta. Vi ansvarar
                  inte för ekonomisk förlust, beslut eller skada som uppstår vid användning av Tjänsten.
                  Tjänsten tillhandahålls "i befintligt skick".
                </p>

                <h2>8. Immateriella rättigheter</h2>
                <p>
                  Allt innehåll som genereras av Tjänsten ägs eller licensieras av oss. Du får använda
                  materialet för eget bruk men inte sälja, distribuera eller kopiera det i kommersiellt
                  syfte utan tillstånd.
                </p>

                <h2>9. Dataskydd</h2>
                <p>
                  Behandling av personuppgifter sker enligt vår Integritetspolicy, tillgänglig på
                  <a href="/privacy">market-mind.app/privacy</a>.
                </p>

                <h2>10. Ändringar av villkor</h2>
                <p>
                  Vi kan uppdatera dessa Villkor. Väsentliga ändringar meddelas via e-post eller på
                  webbplatsen minst 14 dagar i förväg.
                </p>

                <h2>11. Kontakt</h2>
                <p className="not-prose">
                  <span className="block font-semibold">MarketMind AB</span>
                  <span className="mt-1 block">📧 <a href="mailto:support@market-mind.app">support@market-mind.app</a></span>
                  <span className="block">📍 Sverige</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;
