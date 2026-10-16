"use client";

import { useRef } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  hoverVideoUrl: string | null;
  themeColor: string | null;
};

function getFanStyle(index: number, total: number) {
  const mid = (total - 1) / 2;
  const dist = Math.abs(index - mid);
  const height = Math.max(300, 440 - dist * 50);
  const rotate = (index - mid) * 2;
  return { height, rotate };
}

export default function CategoryCard({
  category,
  index = 0,
  total = 1,
}: {
  category: Category;
  index?: number;
  total?: number;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { height, rotate } = getFanStyle(index, total);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `scale(1.06) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  };

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) card.style.transform = "scale(1) rotateY(0deg) rotateX(0deg)";
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="relative w-full mx-auto transition-transform duration-300 ease-out"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <Link
        href={`/${category.slug}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative block w-full rounded-2xl overflow-hidden transition-transform duration-300 ease-out"
        style={{ height, backgroundColor: category.themeColor ?? "#1a1a1a" }}
      >
        {category.hoverVideoUrl && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity duration-300"
          >
            <source src={category.hoverVideoUrl} type="video/mp4" />
          </video>
        )}
        {category.thumbnailUrl && !category.hoverVideoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.thumbnailUrl}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 from-black/80 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white text-sm font-medium leading-snug">{category.name}</h3>
          {category.description && (
            <p className="text-white/60 text-xs mt-1 leading-snug line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
