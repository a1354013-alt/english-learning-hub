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
  if (
    readingMaterial &&
    typeof readingMaterial === "object" &&
    "phrase" in readingMaterial &&
    readingMaterial.phrase
  ) {
    const phraseObj = readingMaterial.phrase;
    if (typeof phraseObj === "object" && "phrase" in phraseObj) {
      phrases.push({
        phrase: (phraseObj as { phrase: string }).phrase,
        definition: (phraseObj as { definition?: string }).definition,
        usage: (phraseObj as { usage?: string }).usage,
      });
    }
  }

  // Safely extract sentence
  const sentences: SentenceItem[] = [];
  if (
    readingMaterial &&
    typeof readingMaterial === "object" &&
    "sentence" in readingMaterial &&
    readingMaterial.sentence
  ) {
    const sentenceObj = readingMaterial.sentence;
    if (typeof sentenceObj === "object" && "sentence" in sentenceObj) {
      sentences.push({
        sentence: (sentenceObj as { sentence: string }).sentence,
        definition: (sentenceObj as { definition?: string }).definition,
        usage: (sentenceObj as { usage?: string }).usage,
      });
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
  } catch (error) {
    console.error("JSON parse error:", error);
    return null;
  }
}
