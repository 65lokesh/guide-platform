import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { interestIds } = (await req.json()) as { interestIds: string[] };
  const userId = session.user.id;

  await prisma.userInterest.deleteMany({ where: { userId } });
  await prisma.userInterest.createMany({
    data: interestIds.map((interestId) => ({ userId, interestId })),
  });

  return NextResponse.json({ success: true });
}
