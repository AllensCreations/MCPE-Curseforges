"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Build = {
  slug: string;
  name: string;
  category: string;
  version: string;
  description: string;
  iconUrl?: string | null;
  packages: { name: string; format: string; sha256: string }[];
};

const categories = ["All", "Add-ons", "Maps", "Minigames", "Scripts"];

export default function Home() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || "The build catalog could not be loaded.");
        return response.json();
      })
      .then((data: { builds: Build[] }) => { if (active) setBuilds(data.builds); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => builds.filter((build) => {
    const matchesCategory = category === "All" || build.category === category;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [build.name, build.slug, build.description, build.version, build.category].join(" ").toLowerCase().includes(needle);
    return matchesCategory && matchesQuery;
  }), [builds, category, query]);

  const packageCount = builds.reduce((total, build) => total + build.packages.length, 0);

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="ALNStudios Build Center">
          <span className="brand-mark">A</span>
          <span><strong>ALNStudios</strong><small>BUILD CENTER</small></span>
        </a>
        <div className="side-label">LIBRARY</div>
        <button className={category === "All" ? "nav-item active" : "nav-item"} onClick={() => setCategory("All")}> <span className="nav-symbol">▦</span> All projects <span className="nav-count">{builds.length}</span></button>
        {categories.slice(1).map((item) => (
          <button key={item} className={category === item ? "nav-item active" : "nav-item"} onClick={() => setCategory(item)}>
            <span className="nav-symbol">{item === "Maps" ? "◇" : item === "Scripts" ? "⌘" : item === "Minigames" ? "◈" : "▣"}</span>{item}
          </button>
        ))}
        <div className="sidebar-bottom"><span className="status-dot" /> Private workspace<small>ALNStudios · Minecraft Bedrock</small></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Build library</div><div className="secure"><span className="status-dot" /> Protected workspace</div></header>
        <section className="hero">
          <div className="eyebrow">PERSONAL BUILD LIBRARY</div>
          <h1>Your builds.<br /><span>One place.</span></h1>
          <p>Browse the latest Minecraft Bedrock projects, inspect package versions, and download verified build artifacts.</p>
          <div className="hero-meta"><span><i className="status-dot" /> Live repository catalog</span><span>·</span><span>ALNStudios</span></div>
        </section>

        <section className="stats" aria-label="Library summary">
          <div className="stat"><span>PROJECTS</span><strong>{loading ? "—" : builds.length}</strong><small>Available in the catalog</small></div>
          <div className="stat"><span>DOWNLOAD FILES</span><strong>{loading ? "—" : packageCount}</strong><small>Built packages detected</small></div>
          <div className="stat"><span>REPOSITORY</span><strong className="repo-value">MCPE-CURSEFORGES</strong><small>Synced from GitHub</small></div>
        </section>

        <section className="library">
          <div className="section-heading"><div><div className="eyebrow">COLLECTION</div><h2>{category === "All" ? "All projects" : category}</h2><p>Latest available build artifacts from the repository.</p></div><span className="result-count">{visible.length} PROJECTS</span></div>
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, versions, or descriptions..." /><kbd>/</kbd></label>
          <div className="mobile-filters">{categories.map((item) => <button key={item} className={category === item ? "filter active" : "filter"} onClick={() => setCategory(item)}>{item}</button>)}</div>
          {loading && <div className="empty"><div className="loader" /><strong>Loading your library</strong><p>Reading the latest build catalog from GitHub.</p></div>}
          {!loading && error && <div className="empty error"><strong>Catalog unavailable</strong><p>{error}</p><button className="retry" onClick={() => window.location.reload()}>Try again</button></div>}
          {!loading && !error && visible.length === 0 && <div className="empty"><strong>No matching projects</strong><p>Try another search or category.</p></div>}
          {!loading && !error && <div className="project-grid">{visible.map((build) => (
            <Link className="project-card" key={build.slug} href={`/projects/${encodeURIComponent(build.slug)}`}>
              <div className="card-top"><div className="project-icon">{build.iconUrl ? <img src={build.iconUrl} alt="" /> : build.category === "Maps" ? "WORLD" : build.category === "Scripts" ? "CODE" : build.category === "Minigames" ? "PLAY" : "PACK"}</div><span className="category-tag">{build.category}</span></div>
              <h3>{build.name}</h3><p className="description">{build.description || "Minecraft Bedrock project by ALNStudios."}</p>
              <div className="version-line"><span>Latest build</span><strong>v{build.version}</strong></div>
              <div className="card-open">View project details <span>→</span></div>
            </Link>
          ))}</div>}
        </section>
        <footer><span>ALNStudios Build Center</span><span>Private · Repository-synced · Minecraft Bedrock</span></footer>
      </section>
    </main>
  );
}
