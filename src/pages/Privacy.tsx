import React from 'react';
import Layout from '@/components/Layout';

const Privacy: React.FC = () => {
  return (
    <Layout>
      <div className="prose dark:prose-invert max-w-none">
        <h1>🔒 Integritetspolicy (Privacy Policy)</h1>

        <h2>1. Inledning</h2>
        <p>
          Denna policy beskriver hur MarketMind AB ("vi", "oss") behandlar personuppgifter för
          användare av market-mind.app. Vi följer EU:s dataskyddsförordning (GDPR) och svensk lag.
        </p>

        <h2>2. Personuppgifter vi samlar in</h2>
        <p>Vi samlar in följande uppgifter:</p>
        <ul>
          <li>Namn och e-postadress vid kontoregistrering</li>
          <li>Betalningsinformation via Stripe (hanteras direkt av Stripe, vi lagrar inte kortuppgifter)</li>
          <li>Tekniska data såsom IP-adress, enhetstyp och användarbeteende</li>
          <li>Användargenererade data: AI-förfrågningar (prompts), analyser och användningsstatistik</li>
          <li>Cookies (endast med samtycke)</li>
        </ul>

        <h2>3. Syfte med behandlingen</h2>
        <p>Vi behandlar personuppgifter för att:</p>
        <ul>
          <li>Tillhandahålla och administrera Tjänsten</li>
          <li>Hantera betalningar och prenumerationer</li>
          <li>Förbättra användarupplevelsen och felsöka tekniska problem</li>
          <li>Kommunicera uppdateringar, nyheter och erbjudanden (med ditt samtycke)</li>
          <li>Efterleva rättsliga skyldigheter (t.ex. bokföring)</li>
        </ul>

        <h2>4. Rättslig grund</h2>
        <p>Behandlingen sker enligt följande grunder:</p>
        <ul>
          <li>Avtal: för att tillhandahålla Tjänsten du registrerat dig för</li>
          <li>Samtycke: för marknadsföringsutskick och cookies</li>
          <li>Rättslig förpliktelse: för bokföring och betalningshantering</li>
          <li>Berättigat intresse: för drift, säkerhet och analys</li>
        </ul>

        <h2>5. Lagring av data</h2>
        <p>
          Vi använder Supabase (EU/EES-hosting) för datalagring. AI-analyser genereras via OpenAI
          GPT-4o och Tavily. Endast textdata som rör analysinnehåll skickas – inga personuppgifter
          eller betalningsdata. Vi sparar uppgifter så länge kontot är aktivt eller enligt lagkrav
          (t.ex. bokföring i 7 år).
        </p>

        <h2>6. Delning av uppgifter</h2>
        <p>Vi delar inte dina personuppgifter med tredje part utöver:</p>
        <ul>
          <li>Stripe (betalningar)</li>
          <li>Supabase (databas)</li>
          <li>OpenAI / Tavily (AI-analys, utan personuppgifter)</li>
        </ul>
        <p>Alla leverantörer följer GDPR och har databehandlaravtal (DPA) med oss.</p>

        <h2>7. Dina rättigheter</h2>
        <p>Du har rätt att:</p>
        <ul>
          <li>Få tillgång till dina uppgifter</li>
          <li>Begära rättelse eller radering</li>
          <li>Begränsa eller invända mot behandling</li>
          <li>Begära dataportabilitet</li>
          <li>Lämna klagomål till Integritetsskyddsmyndigheten (IMY)</li>
        </ul>
        <p>
          För begäran: kontakta oss på <a href="mailto:support@market-mind.app">support@market-mind.app</a>.
          Vi svarar inom 30 dagar.
        </p>

        <h2>8. Cookies</h2>
        <p>
          Vi använder cookies för inloggning, statistik och förbättringar. Du kan välja att neka
          icke-nödvändiga cookies. Detaljer framgår i vår cookiepolicy (kan vara en egen sida eller
          del av denna).
        </p>

        <h2>9. Säkerhet</h2>
        <p>
          Vi använder TLS/SSL-kryptering, begränsad åtkomst till databaser och säker autentisering
          via Supabase. Vi strävar efter högsta möjliga datasäkerhet men kan inte garantera absolut
          skydd.
        </p>

        <h2>10. Ändringar i policyn</h2>
        <p>
          Vi kan uppdatera denna policy. Senaste versionen finns alltid på
          <a href="/privacy">market-mind.app/privacy</a>. Väsentliga ändringar meddelas via e-post.
        </p>

        <h2>11. Kontakt</h2>
        <p>
          MarketMind AB<br />
          📧 <a href="mailto:support@market-mind.app">support@market-mind.app</a><br />
          📍 Sverige
        </p>
      </div>
    </Layout>
  );
};

export default Privacy;
