import React from 'react';
import { Newspaper, Sparkles } from 'lucide-react';

import Layout from '@/components/Layout';
import GeneratedReportsSection from '@/components/GeneratedReportsSection';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';

const News = () => {
  const { reports, loading } = useDiscoverReportSummaries(18);

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-14 sm:w-14">
                  <Newspaper className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Nyheter</h1>
                  <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Samlade AI-genererade rapporter och senaste höjdpunkterna från Discover i ett dedikerat nyhetsflöde.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-4 w-4" />
                AI-kuraterat flöde
              </div>
            </div>
          </section>

          <GeneratedReportsSection reports={reports} isLoading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default News;
