/**
 * Content transformation utilities for DailyContent
 * Shared between page and tests
 */

export interface VocabularyItem {
  word: string;
  definition: string;
  usage: string;
}

export interface PhraseItem {
  phrase: string;
  definition?: string;
  usage?: string;
}

export interface SentenceItem {
  sentence: string;
  definition?: string;
  usage?: string;
}

export interface GrammarItem {
  topic: string;
  explanation: string;
  example: string;
}

export interface GeneratedContentData {
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
  sentences: SentenceItem[];
  grammar: GrammarItem | null;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePhrase(input: unknown): PhraseItem | null {
  const asString = toTrimmedString(input);
  if (asString) {
    return { phrase: asString };
  }

  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const phrase = toTrimmedString(obj.phrase);
  if (!phrase) return null;

  return {
    phrase,
    definition: toTrimmedString(obj.definition) ?? undefined,
    usage: toTrimmedString(obj.usage) ?? undefined,
  };
}

function normalizeSentence(input: unknown): SentenceItem | null {
  const asString = toTrimmedString(input);
  if (asString) {
    return { sentence: asString };
  }

  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const sentence = toTrimmedString(obj.sentence);
  if (!sentence) return null;

  return {
    sentence,
    definition: toTrimmedString(obj.definition) ?? undefined,
    usage: toTrimmedString(obj.usage) ?? undefined,
  };
}

/**
 * Transform raw generated content data into structured format
 * Handles missing fields gracefully with strict typing
 * Accepts any data type and safely extracts known fields
 */
export function transformGeneratedContent(data: unknown): GeneratedContentData {
  if (!data || typeof data !== "object") {
    return {
      vocabulary: [],
      phrases: [],
      sentences: [],
      grammar: null,
    };
  }

  // Safely extract vocabulary array
  const vocabulary: VocabularyItem[] = [];
  const dataObj = data as Record<string, unknown>;
  if (Array.isArray(dataObj.vocabulary)) {
    dataObj.vocabulary.forEach((item) => {
      if (
        item &&
        typeof item === "object" &&
        "word" in item &&
        "definition" in item &&
        "usage" in item
      ) {
        vocabulary.push(item as VocabularyItem);
      }
    });
  }

  // Safely extract phrase
  const phrases: PhraseItem[] = [];
  const readingMaterial = dataObj.readingMaterial as Record<string, unknown> | undefined;
  if (readingMaterial && typeof readingMaterial === "object") {
    const phraseItem = normalizePhrase(readingMaterial.phrase);
    if (phraseItem) {
      phrases.push(phraseItem);
    }
  }

  // Safely extract sentence
  const sentences: SentenceItem[] = [];
  if (readingMaterial && typeof readingMaterial === "object") {
    const sentenceItem = normalizeSentence(readingMaterial.sentence);
    if (sentenceItem) {
      sentences.push(sentenceItem);
    }
  }

  // Safely extract grammar
  let grammar: GrammarItem | null = null;
  const grammarObj = dataObj.grammar as Record<string, unknown> | undefined;
  if (
    grammarObj &&
    typeof grammarObj === "object" &&
    "topic" in grammarObj &&
    "explanation" in grammarObj &&
    "example" in grammarObj
  ) {
    grammar = grammarObj as unknown as GrammarItem;
  }

  return {
    vocabulary,
    phrases,
    sentences,
    grammar,
  };
}

/**
 * Safe JSON parsing with proper typing
 * Returns parsed object or null on error
 */
export function safeParseJSON(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}
