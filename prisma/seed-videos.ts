import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const videos: Record<string, string> = {
  career: "/videos/career.mp4",
  finance: "/videos/finance.mp4",
  fitness: "/videos/fitness.mp4",
  lifestyle: "/videos/lifestyle.mp4",
  technology: "/videos/technology.mp4",
};

async function main() {
  for (const [slug, hoverVideoUrl] of Object.entries(videos)) {
    const result = await prisma.category.updateMany({
      where: { slug },
      data: { hoverVideoUrl },
    });
    console.log(`${slug}: ${result.count ? "updated" : "NOT FOUND"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
