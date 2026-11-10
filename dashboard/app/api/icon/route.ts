import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const owner = process.env.GITHUB_OWNER || "AllensCreations";
const repo = process.env.GITHUB_REPO || "MCPE-Curseforges";
const ref = process.env.GITHUB_REF || "main";
const sourceFolders = ["Addons", "Maps", "Minigame", "Script"];

export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  const project = request.nextUrl.searchParams.get("project") || "";
  if (!token || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(project)) {
    return NextResponse.json({ error: "Invalid icon request." }, { status: 400 });
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  try {
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`, { headers, cache: "no-store" });
    if (!treeResponse.ok) return new NextResponse(null, { status: 404 });
    const treeData = await treeResponse.json();
    if (treeData.truncated) return new NextResponse(null, { status: 404 });
    const paths = (treeData.tree as { path: string; type: string }[]).filter((entry) => entry.type === "blob").map((entry) => entry.path);
    const prefix = sourceFolders.map((folder) => `MCPEDL/${folder}/${project}/`).find((candidate) => paths.some((path) => path.startsWith(candidate)));
    if (!prefix) return new NextResponse(null, { status: 404 });
    const iconPath = [`${prefix}resource_pack/pack_icon.png`, `${prefix}behavior_pack/pack_icon.png`].find((path) => paths.includes(path));
    if (!iconPath) return new NextResponse(null, { status: 404 });
    const imageResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${iconPath.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`, {
      headers: { ...headers, Accept: "application/vnd.github.raw" },
      cache: "no-store",
    });
    if (!imageResponse.ok || !imageResponse.body) return new NextResponse(null, { status: 404 });
    return new NextResponse(imageResponse.body, { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
