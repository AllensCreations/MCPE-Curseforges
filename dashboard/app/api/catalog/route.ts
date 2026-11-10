import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const owner = process.env.GITHUB_OWNER || "AllensCreations";
const repo = process.env.GITHUB_REPO || "MCPE-Curseforges";
const ref = process.env.GITHUB_REF || "main";
const categories = ["Addons", "Maps", "Minigame", "Script"] as const;

type TreeEntry = { path: string; sha: string; type: string };
type BuildInfo = { manifest_version?: string; changelog_version?: string; packages?: Record<string, string> };
type Manifest = { header?: { name?: string; description?: string; version?: number[] } };

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured in the Vercel project environment.");
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
}

async function readBlob<T>(sha: string): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub metadata request failed (${response.status}).`);
  const blob = await response.json();
  return JSON.parse(Buffer.from(blob.content, "base64").toString("utf8")) as T;
}

export async function GET() {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`, { headers: headers(), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `GitHub catalog request failed (${response.status}).` }, { status: 502 });
    const treeData = await response.json();
    if (treeData.truncated) return NextResponse.json({ error: "The repository tree is too large to scan completely." }, { status: 502 });
    const tree = treeData.tree as TreeEntry[];
    const infoEntries = tree.filter((entry) => entry.type === "blob" && /^builds\/[^/]+\/build_info\.json$/.test(entry.path));
    const builds = await Promise.all(infoEntries.map(async (entry) => {
      const slug = entry.path.split("/")[1];
      const info = await readBlob<BuildInfo>(entry.sha);
      const sourcePrefix = categories.map((folder) => ({ folder, prefix: `MCPEDL/${folder}/${slug}/` })).find(({ prefix }) => tree.some((item) => item.path.startsWith(prefix)));
      const manifestEntry = sourcePrefix && tree.find((item) => item.type === "blob" && item.path === `${sourcePrefix.prefix}behavior_pack/manifest.json`);
      const manifest = manifestEntry ? await readBlob<Manifest>(manifestEntry.sha) : null;
      const category = sourcePrefix?.folder === "Addons" ? "Add-ons" : sourcePrefix?.folder === "Minigame" ? "Minigames" : sourcePrefix?.folder === "Script" ? "Scripts" : "Maps";
      const packages = Object.entries(info.packages || {}).map(([name, sha256]) => ({
        name,
        sha256,
        format: name.split(".").pop()?.toUpperCase() || "FILE",
      }));
      return {
        slug,
        name: manifest?.header?.name?.replace(/\s*\(v\d+(?:\.\d+){1,3}\)$/i, "") || slug.replace(/[-_]/g, " "),
        category,
        version: info.manifest_version || info.changelog_version || manifest?.header?.version?.join(".") || "Unknown",
        description: manifest?.header?.description || "",
        iconUrl: manifestEntry && tree.some((item) => item.path === `${sourcePrefix?.prefix}resource_pack/pack_icon.png` || item.path === `${sourcePrefix?.prefix}behavior_pack/pack_icon.png`) ? `/api/icon?project=${encodeURIComponent(slug)}` : null,
        packages,
      };
    }));
    builds.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ builds, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected catalog error.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
