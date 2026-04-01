import { db } from "./lib/db/client";
import { chatbots, documents } from "./lib/db/schema";

async function run() {
  const c = await db.select().from(chatbots);
  console.log("Chatbots:", c.map((x) => ({ id: x.id, status: x.trainingStatus })));

  const d = await db.select({ id: documents.id, chatbotId: documents.chatbotId }).from(documents);
  console.log("Docs Count:", d.length);
  process.exit(0);
}
run();
