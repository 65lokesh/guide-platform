import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Fitness", slug: "fitness", description: "Workouts, nutrition, and recovery.", themeColor: "#7c3aed" },
  { name: "Finance", slug: "finance", description: "Budgeting, investing, and saving.", themeColor: "#0d9488" },
  { name: "Technology", slug: "technology", description: "Programming, tools, and tutorials.", themeColor: "#e11d48" },
  { name: "Career", slug: "career", description: "Resumes, interviews, and growth.", themeColor: "#db2777" },
  { name: "Lifestyle", slug: "lifestyle", description: "Habits, relationships, and home.", themeColor: "#d97706" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
