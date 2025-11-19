export const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const TEXT_FIELD_CANDIDATES = [
  'text',
  'content',
  'value',
  'data',
  'delta',
  'arguments',
  'argument',
  'output_text'
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return '';
  }
};

const normalizeContentArray = (content: unknown): string[] => {
  if (typeof content === 'string') {
    return [content];
  }

  if (typeof content === 'number' || typeof content === 'boolean') {
    return [String(content)];
  }

  if (Array.isArray(content)) {
    return content.flatMap(normalizeContentArray);
  }

  if (!isRecord(content)) {
    return [];
  }

  const parts: string[] = [];

  for (const field of TEXT_FIELD_CANDIDATES) {
    const fieldValue = content[field];
    if (typeof fieldValue === 'string') {
      parts.push(fieldValue);
    }
  }

  const jsonField = content['json'];
  if (typeof jsonField === 'string') {
    parts.push(jsonField);
  } else if (jsonField && (Array.isArray(jsonField) || isRecord(jsonField))) {
    const jsonString = safeStringify(jsonField);
    if (jsonString) {
      parts.push(jsonString);
    }
  }

  const reasoningContent = content['reasoning_content'];
  if (Array.isArray(reasoningContent)) {
    parts.push(...reasoningContent.flatMap(normalizeContentArray));
  }

  const outputField = content['output'];
  if (Array.isArray(outputField)) {
    parts.push(...outputField.flatMap(normalizeContentArray));
  }

  const nestedContent = content['content'];
  if (Array.isArray(nestedContent)) {
    parts.push(...nestedContent.flatMap(normalizeContentArray));
  }

  const partsField = content['parts'];
  if (Array.isArray(partsField)) {
    parts.push(...partsField.flatMap(normalizeContentArray));
  }

  const reasoningField = content['reasoning'];
  if (typeof reasoningField === 'string') {
    parts.push(reasoningField);
  } else if (Array.isArray(reasoningField) || isRecord(reasoningField)) {
    parts.push(...normalizeContentArray(reasoningField));
  }

  return parts;
};

const collectStrings = (value: unknown): string[] => normalizeContentArray(value)
  .map((part) => (typeof part === 'string' ? part.trim() : ''))
  .filter(Boolean);

export function extractMessageContent(message: unknown): string {
  if (!message) return '';
  if (!isRecord(message)) return '';

  const nestedMessage = message['message'];
  const content = message['content'] ?? (isRecord(nestedMessage) ? nestedMessage['content'] : undefined);

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content) || isRecord(content)) {
    const combined = collectStrings(content).join('\n').trim();
    if (combined) {
      return combined;
    }

    if (content && (Array.isArray(content) || isRecord(content))) {
      const json = safeStringify(content);
      return json;
    }
  }

  return '';
}

export function extractResponseText(payload: unknown): string {
  if (!payload) return '';
  if (!isRecord(payload)) return '';

  const textParts: string[] = [];

  const outputText = payload['output_text'];
  if (Array.isArray(outputText)) {
    textParts.push(...outputText.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean));
  }

  if (!textParts.length) {
    const outputBlocks = payload['output'];
    if (Array.isArray(outputBlocks)) {
      for (const block of outputBlocks) {
        textParts.push(...collectStrings(isRecord(block) ? block['content'] : block));
      }
    }
  }

  if (!textParts.length) {
    const inlineContent = payload['content'];
    if (Array.isArray(inlineContent) || isRecord(inlineContent)) {
      textParts.push(...collectStrings(inlineContent));
    }
  }

  if (!textParts.length) {
    const choices = payload['choices'];
    if (Array.isArray(choices) && choices.length > 0) {
      const message = isRecord(choices[0]) ? choices[0]['message'] : null;
      if (message) {
        const normalized = extractMessageContent(message);
        if (normalized) {
          textParts.push(normalized);
        }
      }
    }
  }

  if (!textParts.length) {
    const message = payload['message'];
    if (message) {
      const normalized = extractMessageContent(message);
      if (normalized) {
        textParts.push(normalized);
      }
    }
  }

  if (!textParts.length && typeof payload['content'] === 'string') {
    textParts.push((payload['content'] as string).trim());
  }

  return textParts
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

const collectReasoningParts = (value: unknown, accumulator: string[]): void => {
  if (!value) return;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      accumulator.push(trimmed);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectReasoningParts(entry, accumulator));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const type = typeof value['type'] === 'string' ? String(value['type']).toLowerCase() : '';
  if (type.includes('reason')) {
    accumulator.push(...collectStrings(value));
    return;
  }

  const reasoningContent = value['reasoning_content'];
  if (reasoningContent) {
    accumulator.push(...collectStrings(reasoningContent));
  }

  const reasoningField = value['reasoning'];
  if (reasoningField) {
    accumulator.push(...collectStrings(reasoningField));
  }

  const nestedContent = value['content'];
  if (nestedContent) {
    collectReasoningParts(nestedContent, accumulator);
  }
};

export function extractReasoningFromResponse(payload: unknown): string | null {
  if (!payload) return null;
  if (!isRecord(payload)) return null;

  const reasoningParts: string[] = [];

  const outputBlocks = payload['output'];
  if (Array.isArray(outputBlocks)) {
    for (const block of outputBlocks) {
      const content = isRecord(block) ? block['content'] : block;
      collectReasoningParts(content, reasoningParts);
    }
  }

  const reasoningContent = payload['reasoning_content'];
  if (reasoningContent) {
    collectReasoningParts(reasoningContent, reasoningParts);
  }

  const choices = payload['choices'];
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const reasoning = isRecord(choice) ? choice['reasoning_content'] : null;
      if (reasoning) {
        collectReasoningParts(reasoning, reasoningParts);
      }
    }
  }

  return reasoningParts.length ? reasoningParts.join('\n').trim() : null;
}

export type ResponsesStreamChunk = {
  content?: string;
  done?: boolean;
  error?: string;
};

export function parseResponsesSseData(data: string): ResponsesStreamChunk {
  if (!data) {
    return {};
  }

  if (data === '[DONE]') {
    return { done: true };
  }

  try {
    const parsed = JSON.parse(data);
    if (!isRecord(parsed)) {
      return {};
    }

    const type = typeof parsed['type'] === 'string' ? String(parsed['type']).toLowerCase() : '';

    if (type === 'response.completed') {
      return { done: true };
    }

    if (type === 'response.error') {
      const errorField = parsed['error'];
      if (typeof errorField === 'string') {
        return { error: errorField };
      }
      if (isRecord(errorField) && typeof errorField['message'] === 'string') {
        return { error: String(errorField['message']) };
      }
      return { error: 'Okänt fel från OpenAI' };
    }

    const delta = parsed['delta'];
    if (typeof delta === 'string') {
      return { content: delta };
    }

    const text = parsed['text'];
    if (typeof text === 'string') {
      return { content: text };
    }

    const outputText = parsed['output_text'];
    if (Array.isArray(outputText)) {
      const combined = outputText
        .map((value) => (typeof value === 'string' ? value : ''))
        .filter(Boolean)
        .join('');
      if (combined.trim()) {
        return { content: combined.trim() };
      }
    }

    const message = parsed['message'];
    if (message) {
      const normalized = extractMessageContent(message);
      if (normalized) {
        return { content: normalized };
      }
    }

    const contentField = parsed['content'];
    if (contentField) {
      const normalized = collectStrings(contentField).join('\n').trim();
      if (normalized) {
        return { content: normalized };
      }
    }

    return {};
  } catch (_error) {
    return {};
  }
}
