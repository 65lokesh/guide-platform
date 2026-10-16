import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { interests: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}