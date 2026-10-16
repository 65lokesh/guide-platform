#!/bin/bash
set -e

echo "==> Stubbing empty page.tsx files"
find app -type f -name "page.tsx" -empty | while read -r file; do
  cat > "$file" << 'INNER'
export default function Page() {
  return (
    <div style={{ padding: "2rem" }}>
      <p>Placeholder — build this page next.</p>
    </div>
  );
}
INNER
  echo "Stubbed: $file"
done

echo "==> Stubbing empty route.ts files"
find app/api -type f -name "route.ts" -empty | while read -r file; do
  cat > "$file" << 'INNER'
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Not implemented yet" });
}
INNER
  echo "Stubbed: $file"
done

echo "==> Done."
