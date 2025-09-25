import React from 'react';
import type { MarketauxResponsePayload, MarketauxItem } from '@/types/marketaux';
import { formatNumberWithCurrency, formatPublishedDate } from '@/utils/marketaux';

interface MarketauxContextDetailsProps {
  context: MarketauxResponsePayload;
}

const MarketauxContextDetails: React.FC<MarketauxContextDetailsProps> = ({ context }) => {
  if (!context.items?.length && !context.summary?.length) {
    return (
      <p className="text-xs text-ai-text-muted">MarketAux hade inga detaljer att visa för denna fråga.</p>
    );
  }

  return (
    <div className="space-y-3">
      {context.summary && context.summary.length > 0 && (
        <div>
          <p className="text-[10px] uppercase font-semibold text-ai-text-muted">Sammanfattning</p>
          <ul className="mt-1 list-disc pl-4 space-y-1">
            {context.summary.map((line, idx) => (
              <li key={idx} className="text-xs text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {context.items && context.items.length > 0 && (
        <div className="space-y-3">
          {context.items.map((item) => (
            <div key={item.id} className="space-y-2 rounded-md border border-ai-border/60 bg-background p-3 text-left shadow-sm dark:border-ai-border/40 dark:bg-ai-surface">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-ai-text-muted">
                {item.source && <span>{item.source}</span>}
                {item.publishedAt && <span>{formatPublishedDate(item.publishedAt)}</span>}
              </div>

              {context.intent === 'report' && renderReportMetadata(item)}

              {item.url && context.intent === 'news' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs text-primary hover:underline"
                >
                  Öppna källa
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const renderReportMetadata = (item: MarketauxItem) => {
  if (!item.metadata) return null;

  const { metadata } = item as { metadata: Record<string, unknown> };
  const fiscalPeriod = typeof metadata.fiscalPeriod === 'string' ? metadata.fiscalPeriod : undefined;
  const fiscalYear = typeof metadata.fiscalYear === 'string' || typeof metadata.fiscalYear === 'number'
    ? metadata.fiscalYear
    : undefined;
  const epsActual = typeof metadata.epsActual === 'number' ? metadata.epsActual : undefined;
  const epsEstimate = typeof metadata.epsEstimate === 'number' ? metadata.epsEstimate : undefined;
  const revenueActual = typeof metadata.revenueActual === 'number' ? metadata.revenueActual : undefined;
  const revenueEstimate = typeof metadata.revenueEstimate === 'number' ? metadata.revenueEstimate : undefined;
  const currency = typeof metadata.currency === 'string' ? metadata.currency : undefined;

  const hasAnyMetric =
    fiscalPeriod ||
    fiscalYear ||
    epsActual != null ||
    epsEstimate != null ||
    revenueActual != null ||
    revenueEstimate != null;

  if (!hasAnyMetric) return null;

  return (
    <div className="rounded-md border border-ai-border/50 bg-ai-surface-muted/50 p-2 text-[11px] text-ai-text-muted dark:border-ai-border/40">
      <p className="font-semibold uppercase text-[10px] tracking-wide text-ai-text-muted">Nyckeltal</p>
      <div className="mt-1 space-y-1">
        {(fiscalPeriod || fiscalYear) && (
          <p>Period: {[fiscalPeriod, fiscalYear].filter(Boolean).join(' ')}</p>
        )}
        {(epsActual != null || epsEstimate != null) && (
          <p>
            EPS: {formatNumberWithCurrency(epsActual)} (est {formatNumberWithCurrency(epsEstimate)})
          </p>
        )}
        {(revenueActual != null || revenueEstimate != null) && (
          <p>
            Intäkter: {formatNumberWithCurrency(revenueActual, currency)} (est {formatNumberWithCurrency(revenueEstimate, currency)})
          </p>
        )}
      </div>
    </div>
  );
};

export default MarketauxContextDetails;
