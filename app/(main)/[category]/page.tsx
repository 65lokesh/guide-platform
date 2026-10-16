import CategoryPageTemplate from "@/components/category/CategoryPageTemplate";

export default async function DynamicCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  return <CategoryPageTemplate slug={slug} />;
}
