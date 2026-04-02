import { describe, it, expect } from "vitest";

/**
 * Transform generated content data into display format
 * Handles missing fields gracefully
 */
export function transformGeneratedContent(data: any) {
  if (!data) {
    return {
      vocabulary: [],
      phrases: [],
      sentences: [],
      grammar: null,
    };
  }

  return {
    vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
    phrases:
      data.readingMaterial && data.readingMaterial.phrase
        ? [{ phrase: data.readingMaterial.phrase }]
        : [],
    sentences:
      data.readingMaterial && data.readingMaterial.sentence
        ? [{ sentence: data.readingMaterial.sentence }]
        : [],
    grammar: data.grammar || null,
  };
}

/**
 * Safe JSON parsing with error handling
 */
export function safeParse(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parse error:", error);
    return null;
  }
}

describe("transformGeneratedContent", () => {
  it("should handle null data", () => {
    const result = transformGeneratedContent(null);
    expect(result.vocabulary).toEqual([]);
    expect(result.phrases).toEqual([]);
    expect(result.sentences).toEqual([]);
    expect(result.grammar).toBeNull();
  });

  it("should handle undefined data", () => {
    const result = transformGeneratedContent(undefined);
    expect(result.vocabulary).toEqual([]);
    expect(result.phrases).toEqual([]);
    expect(result.sentences).toEqual([]);
    expect(result.grammar).toBeNull();
  });

  it("should transform valid data correctly", () => {
    const data = {
      vocabulary: [{ word: "apple", definition: "A fruit" }],
      readingMaterial: {
        phrase: "How are you?",
        sentence: "I am fine.",
      },
      grammar: { topic: "Present Tense" },
    };

    const result = transformGeneratedContent(data);
    expect(result.vocabulary).toHaveLength(1);
    expect(result.vocabulary[0].word).toBe("apple");
    expect(result.phrases).toHaveLength(1);
    expect(result.phrases[0].phrase).toBe("How are you?");
    expect(result.sentences).toHaveLength(1);
    expect(result.sentences[0].sentence).toBe("I am fine.");
    expect(result.grammar.topic).toBe("Present Tense");
  });

  it("should handle missing readingMaterial", () => {
    const data = {
      vocabulary: [{ word: "test" }],
    };

    const result = transformGeneratedContent(data);
    expect(result.vocabulary).toHaveLength(1);
    expect(result.phrases).toEqual([]);
    expect(result.sentences).toEqual([]);
  });

  it("should handle non-array vocabulary", () => {
    const data = {
      vocabulary: "not an array",
    };

    const result = transformGeneratedContent(data);
    expect(result.vocabulary).toEqual([]);
  });
});

describe("safeParse", () => {
  it("should parse valid JSON", () => {
    const json = '{"key": "value", "number": 42}';
    const result = safeParse(json);
    expect(result).toEqual({ key: "value", number: 42 });
  });

  it("should return null for invalid JSON", () => {
    const json = "{invalid json}";
    const result = safeParse(json);
    expect(result).toBeNull();
  });

  it("should handle empty string", () => {
    const result = safeParse("");
    expect(result).toBeNull();
  });

  it("should handle JSON arrays", () => {
    const json = '[1, 2, 3]';
    const result = safeParse(json);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle nested objects", () => {
    const json = '{"nested": {"key": "value"}}';
    const result = safeParse(json);
    expect(result.nested.key).toBe("value");
  });

  it("should handle JSON with special characters", () => {
    const json = '{"text": "Hello\\nWorld"}';
    const result = safeParse(json);
    expect(result.text).toBe("Hello\nWorld");
  });
});
