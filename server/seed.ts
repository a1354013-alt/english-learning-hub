import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { toTaipeiDateStr } from "./_core/date";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const databaseUrl = DATABASE_URL;

async function seed() {
  const connection = await mysql.createConnection(databaseUrl);

  try {
    console.log("Starting seed...");

    const videosData = [
      {
        title: "English Basics: Greetings",
        description: "Learn common English greetings and introductions",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        youtubeId: "dQw4w9WgXcQ",
        durationSeconds: 300,
        proficiencyLevel: "junior_high",
        transcript: JSON.stringify([
          {
            start: 0,
            end: 5,
            text: "Hello everyone, welcome to English class.",
          },
          { start: 5, end: 10, text: "Today we will learn basic greetings." },
          { start: 10, end: 15, text: "The most common greeting is Hello." },
          { start: 15, end: 20, text: "You can also say Hi or Good morning." },
          {
            start: 20,
            end: 25,
            text: "When meeting someone new, say Nice to meet you.",
          },
          { start: 25, end: 30, text: "How are you is a common question." },
          {
            start: 30,
            end: 35,
            text: "Common responses include I am fine or I am good.",
          },
          {
            start: 35,
            end: 40,
            text: "Remember to make eye contact and smile.",
          },
        ]),
      },
      {
        title: "Present Tense Basics",
        description: "Understanding the present tense in English",
        url: "https://www.youtube.com/embed/9bZkp7q19f0",
        youtubeId: "9bZkp7q19f0",
        durationSeconds: 420,
        proficiencyLevel: "junior_high",
        transcript: JSON.stringify([
          {
            start: 0,
            end: 5,
            text: "Welcome to grammar lesson on present tense.",
          },
          {
            start: 5,
            end: 10,
            text: "Present tense describes actions happening now.",
          },
          {
            start: 10,
            end: 15,
            text: "The simple present tense uses the base form of the verb.",
          },
          { start: 15, end: 20, text: "For example: I eat, you eat, he eats." },
          {
            start: 20,
            end: 25,
            text: "Notice that with third person singular, we add s.",
          },
          {
            start: 25,
            end: 30,
            text: "The present continuous uses am, is, or are plus ing.",
          },
          {
            start: 30,
            end: 35,
            text: "Example: I am eating, she is studying.",
          },
          {
            start: 35,
            end: 40,
            text: "This shows an action in progress right now.",
          },
        ]),
      },
      {
        title: "Common Vocabulary: Food",
        description: "Learn vocabulary related to food and eating",
        url: "https://www.youtube.com/embed/kJQP7kiw9Fk",
        youtubeId: "kJQP7kiw9Fk",
        durationSeconds: 360,
        proficiencyLevel: "senior_high",
        transcript: JSON.stringify([
          { start: 0, end: 5, text: "Today we learn food vocabulary." },
          {
            start: 5,
            end: 10,
            text: "Common fruits include apple, banana, and orange.",
          },
          {
            start: 10,
            end: 15,
            text: "Vegetables include carrot, broccoli, and spinach.",
          },
          {
            start: 15,
            end: 20,
            text: "Proteins include chicken, fish, and beef.",
          },
          {
            start: 20,
            end: 25,
            text: "Dairy products include milk, cheese, and yogurt.",
          },
          {
            start: 25,
            end: 30,
            text: "Grains include rice, bread, and pasta.",
          },
          {
            start: 30,
            end: 35,
            text: "A balanced diet includes all these food groups.",
          },
        ]),
      },
    ];

    for (const video of videosData) {
      await connection.execute(
        `INSERT INTO videos (title, description, url, youtubeId, durationSeconds, proficiencyLevel, transcript, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          video.title,
          video.description,
          video.url,
          video.youtubeId,
          video.durationSeconds,
          video.proficiencyLevel,
          video.transcript,
        ]
      );
    }
    console.log("Videos seeded successfully");

    const writingChallengesData = [
      {
        topic: "Daily Life",
        title: "My Favorite Day",
        prompt: "Write about your favorite day of the week and explain why.",
        proficiencyLevel: "junior_high",
      },
      {
        topic: "Family",
        title: "Family Introduction",
        prompt:
          "Introduce your family members and describe their personalities.",
        proficiencyLevel: "junior_high",
      },
      {
        topic: "Travel",
        title: "Dream Vacation",
        prompt:
          "Describe where you would like to travel and what you would do there.",
        proficiencyLevel: "senior_high",
      },
      {
        topic: "Technology",
        title: "Impact of Social Media",
        prompt:
          "Discuss the positive and negative effects of social media on society.",
        proficiencyLevel: "senior_high",
      },
      {
        topic: "Environment",
        title: "Climate Change Solutions",
        prompt: "Propose three practical solutions to combat climate change.",
        proficiencyLevel: "college",
      },
      {
        topic: "Career",
        title: "Future Career Goals",
        prompt:
          "Explain your career aspirations and the steps you will take to achieve them.",
        proficiencyLevel: "college",
      },
    ];

    const todayDate = toTaipeiDateStr(new Date());

    for (const challenge of writingChallengesData) {
      await connection.execute(
        `INSERT INTO writingChallenges (topic, title, prompt, proficiencyLevel, activeDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          challenge.topic,
          challenge.title,
          challenge.prompt,
          challenge.proficiencyLevel,
          todayDate,
        ]
      );
    }
    console.log("Writing challenges seeded successfully");

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
