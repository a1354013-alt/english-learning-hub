import { describe, it, expect } from "vitest";
import { transformGeneratedContent, safeParseJSON } from "@/utils/contentTransform";

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
      vocabulary: [{ word: "apple", definition: "A fruit", usage: "I eat an apple" }],
      readingMaterial: {
        phrase: "How are you?",
        sentence: "I am fine.",
      },
      grammar: { topic: "Present Tense", explanation: "Used for habits", example: "I eat breakfast" },
    };

    const result = transformGeneratedContent(data);
    expect(result.vocabulary).toHaveLength(1);
    expect(result.vocabulary[0].word).toBe("apple");
    expect(result.phrases).toHaveLength(1);
    expect(result.phrases[0].phrase).toBe("How are you?");
    expect(result.sentences).toHaveLength(1);
    expect(result.sentences[0].sentence).toBe("I am fine.");
    expect(result.grammar?.topic).toBe("Present Tense");
  });

  it("should handle missing readingMaterial", () => {
    const data = {
      vocabulary: [{ word: "test", definition: "A test", usage: "This is a test" }],
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

  it("should handle empty data object", () => {
    const result = transformGeneratedContent({});
    expect(result.vocabulary).toEqual([]);
    expect(result.phrases).toEqual([]);
    expect(result.sentences).toEqual([]);
    expect(result.grammar).toBeNull();
  });
});

describe("safeParseJSON", () => {
  it("should parse valid JSON", () => {
    const json = '{"key": "value", "number": 42}';
    const result = safeParseJSON(json);
    expect(result).toEqual({ key: "value", number: 42 });
  });

  it("should return null for invalid JSON", () => {
    const json = "{invalid json}";
    const result = safeParseJSON(json);
    expect(result).toBeNull();
  });

  it("should handle empty string", () => {
    const result = safeParseJSON("");
    expect(result).toBeNull();
  });

  it("should handle JSON arrays", () => {
    const json = '[1, 2, 3]';
    const result = safeParseJSON(json);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should handle nested objects", () => {
    const json = '{"nested": {"key": "value"}}';
    const result = safeParseJSON(json);
    expect(result?.nested?.key).toBe("value");
  });

  it("should handle JSON with special characters", () => {
    const json = '{"text": "Hello\\nWorld"}';
    const result = safeParseJSON(json);
    expect(result?.text).toBe("Hello\nWorld");
  });

  it("should handle JSON with unicode", () => {
    const json = '{"text": "你好世界"}';
    const result = safeParseJSON(json);
    expect(result?.text).toBe("你好世界");
  });
});
