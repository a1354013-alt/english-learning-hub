/**
 * Ollama AI Integration Module
 * Handles communication with local Ollama instance for course generation
 */

import axios from "axios";

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.warn("[Ollama] Service not available:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

/**
 * Generate English course content using Ollama
 */
export async function generateEnglishCourse(
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced",
  topic?: string
): Promise<{
  vocabulary: Array<{
    word: string;
    pronunciation: string;
    definition: string;
    exampleSentence: string;
    chineseTranslation: string;
  }>;
  grammar: {
    title: string;
    explanation: string;
    examples: string[];
  };
  readingMaterial: {
    title: string;
    content: string;
    difficulty: string;
  };
  exercises: Array<{
    type: "multiple_choice" | "fill_blank" | "translation";
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }>;
}> {
  const levelDescriptions: Record<typeof proficiencyLevel, string> = {
    junior_high: "Junior High School (國中程度)",
    senior_high: "Senior High School (高中程度)",
    college: "College Level (大學程度)",
    advanced: "Advanced / TOEIC 700+ (進階程度)",
  };

  const levelDesc = levelDescriptions[proficiencyLevel];
  const topicStr = topic ? `Topic: ${topic}` : "General English";

  const prompt = `You are an expert English language teacher. Generate a comprehensive English lesson for ${levelDesc} students.

${topicStr}

Please provide the response in the following JSON format (respond ONLY with valid JSON, no additional text):
{
  "vocabulary": [
    {
      "word": "example",
      "pronunciation": "ig-zam-pul",
      "definition": "a thing characteristic of its kind or illustrating a general rule",
      "exampleSentence": "Can you give me an example of a good essay?",
      "chineseTranslation": "例子"
    }
  ],
  "grammar": {
    "title": "Grammar Topic",
    "explanation": "Clear explanation of the grammar concept",
    "examples": ["Example sentence 1", "Example sentence 2"]
  },
  "readingMaterial": {
    "title": "Reading Passage Title",
    "content": "A short reading passage appropriate for the level",
    "difficulty": "${proficiencyLevel}"
  },
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "What does the word 'example' mean?",
      "options": ["A. A test", "B. A thing characteristic of its kind", "C. A mistake", "D. A book"],
      "answer": "B",
      "explanation": "The correct answer is B because..."
    }
  ]
}

Generate 5 vocabulary items, 1 grammar concept, 1 reading passage, and 3-5 exercises. Ensure all content is appropriate for ${levelDesc} level.`;

  try {
    console.log(`[Ollama] Generating course for level: ${proficiencyLevel}`);

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      },
      {
        timeout: 120000,
      }
    );

    const ollamaResponse = response.data as OllamaResponse;

    try {
      const jsonMatch = ollamaResponse.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const courseContent = JSON.parse(jsonMatch[0]);
      console.log("[Ollama] Course generated successfully");
      return courseContent;
    } catch (parseError) {
      console.error("[Ollama] Failed to parse JSON response:", parseError);
      throw new Error("Failed to parse AI-generated content");
    }
  } catch (error) {
    console.error("[Ollama] Error generating course:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Generate writing exercise feedback using Ollama
 */
export async function generateWritingFeedback(
  userText: string,
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced"
): Promise<{
  score: number;
  feedback: string;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  suggestions: string[];
}> {
  const prompt = `You are an English writing teacher. Evaluate the following student writing for ${proficiencyLevel} level.

Student's writing:
"${userText}"

Provide feedback in JSON format (respond ONLY with valid JSON):
{
  "score": 85,
  "feedback": "Overall assessment of the writing",
  "corrections": [
    {
      "original": "original text",
      "corrected": "corrected text",
      "explanation": "why this correction is needed"
    }
  ],
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}

Score should be 0-100. Include 2-5 corrections and 2-3 suggestions.`;

  try {
    console.log("[Ollama] Generating writing feedback");

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.5,
      },
      {
        timeout: 60000,
      }
    );

    const ollamaResponse = response.data as OllamaResponse;

    try {
      const jsonMatch = ollamaResponse.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const feedback = JSON.parse(jsonMatch[0]);
      console.log("[Ollama] Writing feedback generated successfully");
      return feedback;
    } catch (parseError) {
      console.error("[Ollama] Failed to parse feedback:", parseError);
      throw new Error("Failed to parse AI feedback");
    }
  } catch (error) {
    console.error("[Ollama] Error generating feedback:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Generate vocabulary quiz using Ollama
 */
export async function generateVocabularyQuiz(
  words: string[],
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced"
): Promise<
  Array<{
    word: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>
> {
  const wordsStr = words.join(", ");

  const prompt = `Create vocabulary quiz questions for these words: ${wordsStr}

Level: ${proficiencyLevel}

Respond ONLY with a valid JSON array:
[
  {
    "word": "example",
    "question": "What does 'example' mean?",
    "options": ["A. A test", "B. A thing characteristic of its kind", "C. A mistake", "D. A book"],
    "answer": "B",
    "explanation": "The correct answer is B because..."
  }
]

Create one question per word.`;

  try {
    console.log("[Ollama] Generating vocabulary quiz");

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.6,
      },
      {
        timeout: 60000,
      }
    );

    const ollamaResponse = response.data as OllamaResponse;

    try {
      const jsonMatch = ollamaResponse.response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const quiz = JSON.parse(jsonMatch[0]);
      console.log("[Ollama] Vocabulary quiz generated successfully");
      return quiz;
    } catch (parseError) {
      console.error("[Ollama] Failed to parse quiz:", parseError);
      throw new Error("Failed to parse AI-generated quiz");
    }
  } catch (error) {
    console.error("[Ollama] Error generating quiz:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}
