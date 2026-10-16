import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(null);
  }

  const guide = await prisma.guide.findFirst({
    where: {
      status: "PUBLISHED",
      title: { contains: q, mode: "insensitive" },
    },
    include: { category: true },
  });

  if (!guide) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    guideSlug: guide.slug,
    categorySlug: guide.category.slug,
    title: guide.title,
  });
}
