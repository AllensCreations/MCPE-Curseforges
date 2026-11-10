"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Project = {
  slug: string; name: string; category: string; version: string; description: string; sourcePath: string;
  packages: { name: string; format: string; sha256: string }[]; versions: string[];
  changelog: string; descriptionDocument: string; readme: string; sourceSha256: string;
};
type DocTab = "changelog" | "description" | "readme";

function MarkdownContent({ content }: { content: string }) {
  return <div className="markdown-content">{content.split(/\r?\n/).map((line, index) => {
    const value = line.trim();
    if (!value || value === "---") return <div className="md-space" key={index} />;
    const heading = value.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const text = heading[2].replace(/\*\*/g, "");
      const Tag = heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4";
      return <Tag key={index}>{text}</Tag>;
    }
    if (/^[-*]\s+/.test(value)) return <div className="md-list-item" key={index}><span>•</span><p>{value.replace(/^[-*]\s+/, "").replace(/\*\*/g, "")}</p></div>;
    if (/^\d+\.\s+/.test(value)) return <div className="md-list-item" key={index}><span>{value.match(/^\d+/)?.[0]}.</span><p>{value.replace(/^\d+\.\s+/, "").replace(/\*\*/g, "")}</p></div>;
    return <p key={index}>{value.replace(/\*\*/g, "")}</p>;
  })}</div>;
}

export default function ProjectDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<DocTab>("changelog");

  useEffect(() => {
    let active = true;
    fetch(\`/api/project?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Project details could not be loaded.");
        return data.project as Project;
      })
      .then((data) => { if (active) setProject(data); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const doc = project ? (tab === "changelog" ? project.changelog : tab === "description" ? project.descriptionDocument : project.readme) : "";
  const docTitle = tab === "changelog" ? "Changelog" : tab === "description" ? "Project description" : "README";

  return (
    <main className="detail-shell">
      <header className="detail-topbar">
        <Link className="detail-brand" href="/"><span className="brand-mark">A</span><span><strong>ALNStudios</strong><small>BUILD CENTER</small></span></Link>
        <div className="secure"><span className="status-dot" /> Protected workspace</div>
      </header>
      <div className="detail-content">
        <Link className="back-link" href="/">← Back to project library</Link>
        {loading && <div className="empty detail-empty"><div className="loader" /><strong>Loading project details</strong><p>Reading project documentation and build history from GitHub.</p></div>}
        {!loading && error && <div className="empty error detail-empty"><strong>Project unavailable</strong><p>{error}</p><Link className="retry" href="/">Return to library</Link></div>}
        {!loading && project && <>
          <section className="detail-hero">
            <div className="eyebrow">{project.category.toUpperCase()} / PROJECT DETAILS</div>
            <h1>{project.name}</h1>
            <p>{project.description || "Minecraft Bedrock project by ALNStudios."}</p>
            <div className="detail-meta"><span className="category-tag">{project.category}</span><span>Latest version <strong>v{project.version}</strong></span><span>{project.packages.length} downloadable package{project.packages.length === 1 ? "" : "s"}</span></div>
          </section>
          <div className="detail-layout">
            <section className="detail-main">
              <div className="doc-panel">
                <div className="doc-tabs" role="tablist" aria-label="Project documents">
                  <button className={tab === "changelog" ? "doc-tab active" : "doc-tab"} onClick={() => setTab("changelog")}>Changelog</button>
                  <button className={tab === "description" ? "doc-tab active" : "doc-tab"} onClick={() => setTab("description")}>Description</button>
                  <button className={tab === "readme" ? "doc-tab active" : "doc-tab"} onClick={() => setTab("readme")}>README</button>
                </div>
                <div className="doc-body"><div className="doc-heading"><div className="eyebrow">PROJECT DOCUMENTATION</div><h2>{docTitle}</h2></div>
                  {doc ? <MarkdownContent content={doc} /> : <div className="doc-empty">No {docTitle.toLowerCase()} is available in this project folder.</div>}
                </div>
              </div>
            </section>
            <aside className="detail-side">
              <section className="side-panel">
                <div className="eyebrow">AVAILABLE BUILDS</div><h2>Downloads</h2>
                {project.packages.length ? <div className="detail-packages">{project.packages.map((file) => <a className="download" key={file.name} href={\`/api/download?project=\${encodeURIComponent(project.slug)}&file=\${encodeURIComponent(file.name)}\`}><span>{file.format}</span><span>Download ↓</span></a>)}</div> : <p className="side-muted">No current build packages are listed.</p>}
              </section>
              <section className="side-panel">
                <div className="eyebrow">RELEASE HISTORY</div><h2>Build versions</h2>
                {project.versions.length ? <ul className="version-list">{project.versions.map((version, index) => <li key={version}><span className={index === 0 ? "version-indicator current" : "version-indicator"} /> <span>v{version}</span>{index === 0 && <small>Latest</small>}</li>)}</ul> : <p className="side-muted">No archived version snapshots found.</p>}
              </section>
              <section className="side-panel project-source"><div className="eyebrow">SOURCE</div><h2>Repository folder</h2><p>{project.sourcePath || \`builds/\${project.slug}\`}</p></section>
            </aside>
          </div>
        </>}
      </div>
      <footer className="detail-footer"><span>ALNStudios Build Center</span><span>Private · Repository-synced · Minecraft Bedrock</span></footer>
    </main>
  );
}
