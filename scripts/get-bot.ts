/**
 * Debug script: get the first chatbot ID from the database.
 * Usage: npx tsx scripts/get-bot.ts
 */
import { db } from "../lib/db/client";
import { chatbots } from "../lib/db/schema";

async function run() {
  const bots = await db.select().from(chatbots).limit(1);

  if (bots.length > 0) {
    console.log(bots[0].id);
    return;
  }

  console.log("NO_BOTS");
}

run().catch(console.error);
