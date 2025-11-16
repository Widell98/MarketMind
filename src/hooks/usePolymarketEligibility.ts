import { useEffect, useMemo, useState } from 'react';
import { featureFlags } from '@/config/features';

const AGE_STORAGE_KEY = 'polymarket-age-confirmed';

const detectRegion = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    const navLang = typeof navigator !== 'undefined' ? navigator.language : '';
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || navLang || '';
    const parts = locale.split('-');
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }
  }

  return '';
};

export const usePolymarketEligibility = () => {
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(() => {
    if (!featureFlags.polymarket.requireAgeCheck) return true;
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(AGE_STORAGE_KEY) === 'true';
  });
  const [region, setRegion] = useState<string>('');

  useEffect(() => {
    setRegion(detectRegion());
  }, []);

  useEffect(() => {
    if (!featureFlags.polymarket.requireAgeCheck) return;
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AGE_STORAGE_KEY, ageConfirmed ? 'true' : 'false');
  }, [ageConfirmed]);

  const blockedRegions = useMemo(
    () => featureFlags.polymarket.blockedRegions.map((value) => value.toUpperCase()),
    [],
  );

  const regionBlocked = useMemo(() => {
    if (!region) return false;
    return blockedRegions.includes(region.toUpperCase());
  }, [blockedRegions, region]);

  const ageBlocked = featureFlags.polymarket.requireAgeCheck && !ageConfirmed;

  const blockingReason = useMemo(() => {
    if (regionBlocked) {
      return `Polymarket är inte tillgängligt i din region (${region || 'okänd region'}).`;
    }

    if (ageBlocked) {
      return `Du måste bekräfta att du är minst ${featureFlags.polymarket.minimumAge} år för att se Polymarket-data.`;
    }

    return null;
  }, [ageBlocked, region, regionBlocked]);

  const confirmAge = () => setAgeConfirmed(true);

  return {
    ageConfirmed,
    confirmAge,
    region,
    regionBlocked,
    ageBlocked,
    isEligible: !regionBlocked && !ageBlocked,
    blockingReason,
    blockedRegions,
    minimumAge: featureFlags.polymarket.minimumAge,
  };
};

export type PolymarketEligibility = ReturnType<typeof usePolymarketEligibility>;
