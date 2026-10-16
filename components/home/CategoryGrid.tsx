import { prisma } from "@/lib/db";
import CategoriesScroll from "./CategoriesScroll";

// Order the cards appear in. Any category not listed goes at the end.
const ORDER = ["fitness", "finance", "technology", "career", "lifestyle"];

export default async function CategoryGrid() {
  const categories = await prisma.category.findMany({
    include: {
      interests: { select: { name: true }, orderBy: { name: "asc" }, take: 2 },
      _count: { select: { guides: { where: { status: "PUBLISHED" } } } },
    },
  });

  if (categories.length === 0) {
    return (
      <p id="categories" className="px-6 py-24 text-center text-black/60">
        No categories yet — run the seed script to add some.
      </p>
    );
  }

  const rank = (slug: string) => {
    const i = ORDER.indexOf(slug);
    return i === -1 ? ORDER.length : i;
  };

  const cards = [...categories]
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      themeColor: c.themeColor,
      videoUrl: c.hoverVideoUrl,
      tags: c.interests.map((i) => i.name),
      guideCount: c._count.guides,
    }));

  return <CategoriesScroll categories={cards} />;
}
