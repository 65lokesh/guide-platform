type CategoryHeroProps = {
  name: string;
  description: string | null;
  themeColor: string | null;
};

export default function CategoryHero({ name, description, themeColor }: CategoryHeroProps) {
  return (
    <div
      className="px-6 pt-40 pb-16 flex flex-col items-center text-center"
      style={{
        background: `linear-gradient(to bottom, ${themeColor ?? "#1a1a1a"}33, transparent)`,
      }}
    >
      <h1 className="text-4xl sm:text-5xl font-serif text-white">{name}</h1>
      {description && <p className="text-white/60 mt-4 max-w-lg">{description}</p>}
    </div>
  );
}
