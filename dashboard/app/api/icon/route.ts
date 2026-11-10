import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const owner = process.env.GITHUB_OWNER || "AllensCreations";
const repo = process.env.GITHUB_REPO || "MCPE-Curseforges";

export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  const sha = request.nextUrl.searchParams.get("sha") || "";
  if (!token || !/^[a-f0-9]{40}$/i.test(sha)) {
    return NextResponse.json({ error: "Invalid icon request." }, { status: 400 });
  }
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store",
    });
    if (!response.ok) return new NextResponse(null, { status: 404 });
    const blob = await response.json();
    const image = Buffer.from(blob.content, "base64");
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (image.length < 8 || !pngSignature.every((byte, index) => image[index] === byte)) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(image), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
