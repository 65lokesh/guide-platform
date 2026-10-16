import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CategoryHero from "@/components/category/CategoryHero";
import GuideListItem from "@/components/category/GuideListItem";

export default async function CategoryPageTemplate({ slug }: { slug: string }) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      guides: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black">
      <CategoryHero
        name={category.name}
        description={category.description}
        themeColor={category.themeColor}
      />
      <div className="px-6 pb-24 max-w-3xl mx-auto flex flex-col gap-4">
        {category.guides.length === 0 ? (
          <p className="text-white/50">No guides published yet in this category.</p>
        ) : (
          category.guides.map((guide) => (
            <GuideListItem
              key={guide.id}
              slug={guide.slug}
              title={guide.title}
              content={guide.content}
              categorySlug={category.slug}
            />
          ))
        )}
      </div>
    </main>
  );
}
