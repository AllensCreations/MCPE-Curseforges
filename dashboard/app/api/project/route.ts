import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const owner = process.env.GITHUB_OWNER || "AllensCreations";
const repo = process.env.GITHUB_REPO || "MCPE-Curseforges";
const ref = process.env.GITHUB_REF || "main";
const folders = ["Addons", "Maps", "Minigame", "Script"] as const;

type Entry = { path: string; sha: string; type: string };
type BuildInfo = { manifest_version?: string; changelog_version?: string; packages?: Record<string, string>; source_sha256?: string };
type Manifest = { header?: { name?: string; description?: string; version?: number[] } };

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured.");
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
}

async function readBlob<T>(sha: string): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`, { headers: githubHeaders(), cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub file request failed (${response.status}).`);
  const blob = await response.json();
  return JSON.parse(Buffer.from(blob.content, "base64").toString("utf8")) as T;
}

async function readText(entry: Entry | undefined): Promise<string> {
  if (!entry) return "";
  return readBlob<string>(entry.sha).catch(async () => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${entry.sha}`, { headers: githubHeaders(), cache: "no-store" });
    if (!response.ok) return "";
    const blob = await response.json();
    return Buffer.from(blob.content, "base64").toString("utf8");
  });
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(slug)) return NextResponse.json({ error: "Invalid project selection." }, { status: 400 });
  try {
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`, { headers: githubHeaders(), cache: "no-store" });
    if (!treeResponse.ok) return NextResponse.json({ error: "Project catalog could not be read from GitHub." }, { status: 502 });
    const treeData = await treeResponse.json();
    if (treeData.truncated) return NextResponse.json({ error: "The repository tree is too large to inspect completely." }, { status: 502 });
    const tree = treeData.tree as Entry[];
    const buildPrefix = `builds/${slug}/`;
    const infoEntry = tree.find((entry) => entry.type === "blob" && entry.path === `${buildPrefix}build_info.json`);
    if (!infoEntry) return NextResponse.json({ error: "Project build was not found." }, { status: 404 });
    const info = await readBlob<BuildInfo>(infoEntry.sha);
    const source = folders.map((folder) => ({ folder, prefix: `MCPEDL/${folder}/${slug}/` })).find(({ prefix }) => tree.some((entry) => entry.path.startsWith(prefix)));
    const sourcePrefix = source?.prefix || "";
    const findSourceFile = (name: string) => tree.find((entry) => entry.type === "blob" && entry.path === `${sourcePrefix}${name}`);
    const manifestEntry = findSourceFile("behavior_pack/manifest.json");
    const manifest = manifestEntry ? await readBlob<Manifest>(manifestEntry.sha) : null;
    const packageEntries = Object.entries(info.packages || {}).map(([name, sha256]) => ({
      name,
      sha256,
      format: name.split(".").pop()?.toUpperCase() || "FILE",
    }));
    const versionPrefix = `${buildPrefix}versions/`;
    const versionNames = [...new Set(tree.filter((entry) => entry.type === "blob" && entry.path.startsWith(versionPrefix) && /\/build_info\.json$/.test(entry.path)).map((entry) => entry.path.slice(versionPrefix.length).split("/")[0]))]
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    const versions = versionNames.map((name) => name.replace(/^V/i, ""));
    const category = source?.folder === "Addons" ? "Add-ons" : source?.folder === "Minigame" ? "Minigames" : source?.folder === "Script" ? "Scripts" : "Maps";
    const [changelog, description, readme] = await Promise.all([
      readText(findSourceFile("CHANGELOG.md")),
      readText(findSourceFile("DESCRIPTION.md")),
      readText(findSourceFile("README.md")),
    ]);
    return NextResponse.json({
      project: {
        slug,
        name: manifest?.header?.name?.replace(/\s*\(v\d+(?:\.\d+){1,3}\)$/i, "") || slug.replace(/[-_]/g, " "),
        category,
        version: info.manifest_version || info.changelog_version || manifest?.header?.version?.join(".") || "Unknown",
        description: manifest?.header?.description || "",
        sourcePath: sourcePrefix.replace(/\/$/, ""),
        packages: packageEntries,
        versions,
        changelog,
        descriptionDocument: description,
        readme,
        sourceSha256: info.source_sha256 || "",
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected project detail error.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
