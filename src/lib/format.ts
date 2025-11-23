export const abbreviateMetricLabel = (label: string): string => {
  const normalized = label.toLowerCase();
  const abbreviationRules: { match: RegExp; short: string }[] = [
    { match: /orderingång/, short: 'Ord.ing.' },
    { match: /nettooms/, short: 'Nettooms.' },
    { match: /brutto.*marg/, short: 'Bruttomarg.' },
    { match: /marginal/, short: 'Marg.' },
    { match: /ebita/, short: 'EBITA' },
    { match: /ebit/, short: 'EBIT' },
    { match: /kassaflöde/, short: 'Kassafl.' },
    { match: /likviditet/, short: 'Likv.' },
    { match: /rörelseresultat/, short: 'Rörelseres.' },
    { match: /omsättning/, short: 'Oms.' },
    { match: /resultat/, short: 'Res.' },
    { match: /tillväxt/, short: 'Tillv.' },
  ];

  const match = abbreviationRules.find((rule) => rule.match.test(normalized));

  return match ? match.short : label;
};

const NUMBER_WITH_OPTIONAL_UNIT = /^([+-]?\d[\d\s.,]*)(?:\s*([A-Za-z%]+))?(.*)$/;

export const formatKeyMetricValue = (rawValue: string): string => {
  const trimmed = rawValue?.trim();
  if (!trimmed) return rawValue;

  const match = trimmed.match(NUMBER_WITH_OPTIONAL_UNIT);

  if (!match) return trimmed;

  const [, rawNumber, rawUnit, rawRemainder] = match;
  const normalizedNumber = rawNumber.replace(/\s+/g, '').replace(/,/g, '.');
  const parsed = Number(normalizedNumber);

  if (!Number.isFinite(parsed)) return trimmed;

  const remainder = rawRemainder?.trim() ?? '';
  const isSekUnit = rawUnit ? /sek$/i.test(rawUnit) : false;

  let value = parsed;
  let unit = rawUnit?.trim() ?? '';

  if ((isSekUnit || !unit) && Math.abs(value) >= 1_000_000_000) {
    value = value / 1_000_000_000;
    unit = unit ? `G${unit}` : 'GSEK';
  } else if ((isSekUnit || !unit) && Math.abs(value) >= 1_000_000) {
    value = value / 1_000_000;
    unit = unit ? `M${unit}` : 'MSEK';
  }

  const maximumFractionDigits = Math.abs(value) >= 100 ? 0 : 2;
  const minimumFractionDigits = Number.isInteger(value) ? 0 : 2;

  const formattedNumber = value.toLocaleString('sv-SE', {
    maximumFractionDigits,
    minimumFractionDigits,
  });

  const formattedUnit = unit ? ` ${unit}` : '';
  const formattedRemainder = remainder ? ` ${remainder}` : '';

  return `${formattedNumber}${formattedUnit}${formattedRemainder}`.trim();
};
