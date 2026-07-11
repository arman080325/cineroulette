import "dotenv/config";
import { prisma } from "@cineroulette/db";
import { syncGenres, syncLanguages } from "./jobs/syncReferenceData";
import { syncTitles } from "./jobs/syncTitles";

/**
 * Full sync sequence, run on a schedule (cron / Render cron job).
 * Reference data first (cheap, rarely changes), then titles.
 */
async function main() {
  console.log("CineRoulette sync worker starting...");
  await syncGenres();
  await syncLanguages();
  await syncTitles();
  console.log("Sync complete.");
}

main()
  .catch((err) => {
    console.error("Sync worker failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
