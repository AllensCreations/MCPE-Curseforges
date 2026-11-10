import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const owner = process.env.GITHUB_OWNER || "AllensCreations";
const repo = process.env.GITHUB_REPO || "MCPE-Curseforges";
const ref = process.env.GITHUB_REF || "main";
const safeSegment = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,180}$/;
const safePackageName = /^[A-Za-z0-9][A-Za-z0-9._ ()-]{0,220}\.(?:mcaddon|mcpack|mcworld)$/i;

export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "Download service is not configured." }, { status: 503 });

  const project = request.nextUrl.searchParams.get("project") || "";
  const file = request.nextUrl.searchParams.get("file") || "";
  if (!safeSegment.test(project) || !safePackageName.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "Invalid build selection." }, { status: 400 });
  }

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents`;
  try {
    const infoResponse = await fetch(`${apiBase}/builds/${encodeURIComponent(project)}/build_info.json?ref=${encodeURIComponent(ref)}`, { headers, cache: "no-store" });
    if (!infoResponse.ok) return NextResponse.json({ error: "Build metadata was not found." }, { status: 404 });
    const infoFile = await infoResponse.json();
    const info = JSON.parse(Buffer.from(infoFile.content, "base64").toString("utf8"));
    if (!Object.prototype.hasOwnProperty.call(info.packages || {}, file)) {
      return NextResponse.json({ error: "That package is not listed as a current build artifact." }, { status: 404 });
    }

    const fileResponse = await fetch(`${apiBase}/builds/${encodeURIComponent(project)}/${encodeURIComponent(file)}?ref=${encodeURIComponent(ref)}`, {
      headers: { ...headers, Accept: "application/vnd.github.raw" },
      cache: "no-store",
    });
    if (!fileResponse.ok || !fileResponse.body) return NextResponse.json({ error: "The package could not be retrieved from GitHub." }, { status: 502 });
    return new NextResponse(fileResponse.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file)}`,
        "Cache-Control": "private, no-store",
        ...(fileResponse.headers.get("content-length") ? { "Content-Length": fileResponse.headers.get("content-length")! } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "The download service encountered an unexpected error." }, { status: 502 });
  }
}
