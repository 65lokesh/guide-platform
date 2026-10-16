import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import { categoriesTheme } from "@/components/home/categoriesTheme";

export default function HomePage() {
  return (
    <main style={{ background: categoriesTheme.bgStart }}>
      <Hero />
      <CategoryGrid />
    </main>
  );
}
