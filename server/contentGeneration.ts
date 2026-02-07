import { getDb } from "./db";
import { generatedContent, InsertGeneratedContent } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Convert Date to YYYY-MM-DD string format
 */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Content generation system that creates learning materials based on proficiency level
 */

const VOCABULARY_POOLS = {
  junior_high: [
    { word: "apple", definition: "A round fruit that is red, green, or yellow", usage: "I eat an apple every day." },
    { word: "beautiful", definition: "Pleasing to look at; attractive", usage: "The sunset is beautiful." },
    { word: "celebrate", definition: "To honor a special occasion with festivities", usage: "We celebrate birthdays with cake." },
    { word: "delicious", definition: "Tasting very good; pleasant to eat", usage: "The pizza was delicious." },
    { word: "elephant", definition: "A large gray animal with a long trunk", usage: "Elephants live in Africa." },
    { word: "friendship", definition: "A close relationship between two people", usage: "Friendship is very important." },
    { word: "generous", definition: "Willing to give and share; not selfish", usage: "He is generous with his time." },
    { word: "happiness", definition: "The state of being happy; joy", usage: "Happiness comes from helping others." },
  ],
  senior_high: [
    { word: "ambition", definition: "A strong desire to succeed or achieve goals", usage: "Her ambition is to become a doctor." },
    { word: "benevolent", definition: "Kind and generous; showing goodwill", usage: "The benevolent organization helps the poor." },
    { word: "consequence", definition: "A result or effect of an action", usage: "The consequence of his mistake was serious." },
    { word: "diligent", definition: "Showing careful and persistent effort", usage: "Diligent students usually get good grades." },
    { word: "eloquent", definition: "Fluent and persuasive in speaking or writing", usage: "The eloquent speech moved the audience." },
    { word: "facilitate", definition: "To make something easier or help it happen", usage: "Technology facilitates communication." },
    { word: "gratitude", definition: "The feeling of being grateful and thankful", usage: "She expressed her gratitude for the help." },
    { word: "hypothesis", definition: "A proposed explanation based on limited evidence", usage: "The scientist tested his hypothesis." },
  ],
  college: [
    { word: "ubiquitous", definition: "Present, appearing, or found everywhere", usage: "Smartphones have become ubiquitous in modern society." },
    { word: "paradigm", definition: "A typical example or pattern of something", usage: "The new theory represents a paradigm shift." },
    { word: "ephemeral", definition: "Lasting for a very short time; transitory", usage: "The beauty of cherry blossoms is ephemeral." },
    { word: "juxtapose", definition: "To place two things side by side for contrast", usage: "The artist juxtaposed light and darkness." },
    { word: "meticulous", definition: "Showing great attention to detail; very careful", usage: "Her meticulous research was impressive." },
    { word: "nostalgia", definition: "A sentimental longing for the past", usage: "The old photos evoked nostalgia." },
    { word: "pragmatic", definition: "Dealing with things in a practical, realistic way", usage: "We need a pragmatic approach to solve this." },
    { word: "quintessential", definition: "Representing the most perfect example of something", usage: "Jazz is quintessential American music." },
  ],
  advanced: [
    { word: "obfuscate", definition: "To deliberately make something unclear or obscure", usage: "The politician tried to obfuscate the real issue." },
    { word: "perspicacious", definition: "Having keen insight and understanding", usage: "His perspicacious analysis revealed hidden patterns." },
    { word: "sycophant", definition: "A person who acts obsequiously to someone important", usage: "He was accused of being a sycophant." },
    { word: "verisimilitude", definition: "The quality of appearing to be true or real", usage: "The novel has remarkable verisimilitude." },
    { word: "zeitgeist", definition: "The spirit of the times; the prevailing mood", usage: "The zeitgeist of the 1960s was revolutionary." },
    { word: "antediluvian", definition: "Belonging to the period before the biblical flood; very old", usage: "His views are antediluvian." },
    { word: "pellucid", definition: "Translucently clear; easily understood", usage: "The pellucid explanation helped everyone understand." },
    { word: "sesquipedalian", definition: "Characterized by long words; long-winded", usage: "His sesquipedalian writing was hard to read." },
  ],
};

const PHRASES_POOLS = {
  junior_high: [
    { phrase: "How are you?", definition: "A greeting asking about someone's well-being", usage: "When you meet a friend, you say 'How are you?'" },
    { phrase: "Nice to meet you", definition: "A polite greeting when meeting someone for the first time", usage: "'Nice to meet you,' she said warmly." },
    { phrase: "What's your name?", definition: "A question asking for someone's name", usage: "In class, the teacher asked 'What's your name?'" },
    { phrase: "See you later", definition: "A casual goodbye", usage: "'See you later!' he waved as he left." },
  ],
  senior_high: [
    { phrase: "To make a long story short", definition: "To summarize or get to the point quickly", usage: "To make a long story short, we decided to move." },
    { phrase: "Break the ice", definition: "To overcome initial awkwardness or shyness", usage: "The joke helped break the ice at the party." },
    { phrase: "Hit the books", definition: "To study hard", usage: "I need to hit the books before the exam." },
    { phrase: "Piece of cake", definition: "Something that is very easy to do", usage: "This math problem is a piece of cake." },
  ],
  college: [
    { phrase: "Paradigm shift", definition: "A fundamental change in approach or underlying assumptions", usage: "The internet caused a paradigm shift in communication." },
    { phrase: "Moot point", definition: "A subject for debate or discussion; irrelevant", usage: "Whether he attended is now a moot point." },
    { phrase: "Carte blanche", definition: "Complete freedom to act as one wishes", usage: "The director was given carte blanche for the project." },
    { phrase: "Status quo", definition: "The existing state of affairs", usage: "We should maintain the status quo." },
  ],
  advanced: [
    { phrase: "Deus ex machina", definition: "An unexpected solution that comes at the right moment", usage: "The inheritance was a deus ex machina for his problems." },
    { phrase: "Quid pro quo", definition: "A favor or advantage granted in return for something", usage: "He expected quid pro quo for his help." },
    { phrase: "Raison d'être", definition: "The most important reason for someone's existence", usage: "Education is the raison d'être of the school." },
    { phrase: "Sui generis", definition: "Unique; being the only one of its kind", usage: "Her artistic style is sui generis." },
  ],
};

const SENTENCES_POOLS = {
  junior_high: [
    { sentence: "I like to read books in the library.", definition: "A simple statement about a preference", usage: "This is a basic present tense sentence." },
    { sentence: "She went to the store yesterday.", definition: "A statement about a past action", usage: "This uses the past tense." },
    { sentence: "They are playing football in the park.", definition: "A statement about an ongoing action", usage: "This uses the present continuous tense." },
    { sentence: "We will have dinner at 7 PM.", definition: "A statement about a future action", usage: "This uses the future tense." },
  ],
  senior_high: [
    { sentence: "Although he was tired, he continued working on the project.", definition: "A complex sentence showing contrast", usage: "This demonstrates subordination." },
    { sentence: "If you study hard, you will pass the exam.", definition: "A conditional sentence", usage: "This shows cause and effect." },
    { sentence: "The book, which was written in 1920, is still popular today.", definition: "A sentence with a relative clause", usage: "This provides additional information." },
    { sentence: "Not only did she win the competition, but she also broke the record.", definition: "A sentence with emphasis", usage: "This uses parallel structure." },
  ],
  college: [
    { sentence: "The phenomenon, which has been observed across multiple studies, suggests a paradigm shift in our understanding.", definition: "A complex academic sentence", usage: "This demonstrates sophisticated structure." },
    { sentence: "Notwithstanding the challenges presented by the economic downturn, the company maintained its growth trajectory.", definition: "A formal sentence with advanced vocabulary", usage: "This is typical of academic writing." },
    { sentence: "The correlation between variables, though statistically significant, does not necessarily imply causation.", definition: "A sentence expressing nuance", usage: "This demonstrates critical thinking." },
    { sentence: "Subsequent to the implementation of the new policy, we observed a marked improvement in efficiency.", definition: "A formal statement of results", usage: "This is typical of research writing." },
  ],
  advanced: [
    { sentence: "The obfuscation of the underlying mechanisms, coupled with the perspicacious analysis of the zeitgeist, renders the work both enigmatic and profoundly illuminating.", definition: "A highly complex sentence", usage: "This demonstrates mastery of language." },
    { sentence: "Whilst the verisimilitude of the narrative remains questionable, its quintessential representation of the human condition transcends such epistemological concerns.", definition: "A sophisticated philosophical statement", usage: "This is typical of literary criticism." },
    { sentence: "The antediluvian approach to problem-solving, notwithstanding its pellucid logic, fails to account for the sesquipedalian complexities of modern discourse.", definition: "A critique using advanced vocabulary", usage: "This demonstrates critical sophistication." },
    { sentence: "The sycophantic adulation of the zeitgeist, whilst superficially compelling, ultimately represents a failure of intellectual rigor and perspicacity.", definition: "A critical analysis", usage: "This demonstrates nuanced argumentation." },
  ],
};

export async function generateDailyContent(
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced"
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const today = new Date().toISOString().split("T")[0];

  // Check if content already generated for today
  const existing = await db
    .select()
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.generatedDate, today as any),
        eq(generatedContent.proficiencyLevel, proficiencyLevel)
      )
    );

  if (existing.length > 0) {
    return existing;
  }

  // Generate new content
  const vocabPool = VOCABULARY_POOLS[proficiencyLevel];
  const phrasePool = PHRASES_POOLS[proficiencyLevel];
  const sentencePool = SENTENCES_POOLS[proficiencyLevel];

  const contentItems: InsertGeneratedContent[] = [];

  // Pick random vocabulary
  const vocab = vocabPool[Math.floor(Math.random() * vocabPool.length)];
  contentItems.push({
    contentType: "vocabulary",
    content: vocab.word,
    definition: vocab.definition,
    exampleUsage: vocab.usage,
    proficiencyLevel,
    generatedDate: today as any,
    isArchived: false,
  });

  // Pick random phrase
  const phrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
  contentItems.push({
    contentType: "phrase",
    content: phrase.phrase,
    definition: phrase.definition,
    exampleUsage: phrase.usage,
    proficiencyLevel,
    generatedDate: today as any,
    isArchived: false,
  });

  // Pick random sentence
  const sentence = sentencePool[Math.floor(Math.random() * sentencePool.length)];
  contentItems.push({
    contentType: "sentence",
    content: sentence.sentence,
    definition: sentence.definition,
    exampleUsage: sentence.usage,
    proficiencyLevel,
    generatedDate: today as any,
    isArchived: false,
  });

  // Insert into database
  await db.insert(generatedContent).values(contentItems);

  return contentItems;
}

/**
 * Archive old content (older than 30 days)
 */
export async function archiveOldContent() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = toDateStr(thirtyDaysAgo);
  const archivedDateStr = toDateStr(new Date());

  // Archive old content
  const result = await db
    .update(generatedContent)
    .set({
      isArchived: true,
      archivedDate: archivedDateStr as any,
    })
    .where(
      and(
        lt(generatedContent.generatedDate, thirtyDaysAgoStr as any),
        eq(generatedContent.isArchived, false)
      )
    );

  const updatedCount = result.rowsAffected || 0;
  console.log(`[ContentGeneration] Archived ${updatedCount} old content items`);
  return updatedCount;
}
