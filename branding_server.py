#!/usr/bin/env python3
"""
==============================================================================
MCPE Curseforges - Branding & Asset Manager Server
==============================================================================
A lightweight, zero-dependency local web server to manage repository banners,
logos, pack icons, and auto-sync README.md image references.

Usage:
    python3 branding_server.py [--port 8080] [--host 0.0.0.0]
==============================================================================
"""

import argparse
import base64
import html
import io
import json
import mimetypes
import os
import re
import shutil
import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def get_projects():
    """Discovers repository root and all sub-projects (addons, maps, scripts)."""
    projects = []

    # 1. Root project
    root_banner = "banner.jpg"
    root_logo = "assets/mcpedl.png" if os.path.exists(os.path.join(BASE_DIR, "assets/mcpedl.png")) else "mcpedl.png"
    projects.append({
        "id": "root",
        "name": "Repository Root (Master Catalog)",
        "category": "root",
        "dir": ".",
        "readmePath": "README.md",
        "bannerPath": root_banner,
        "logoPath": root_logo,
        "bannerExists": os.path.exists(os.path.join(BASE_DIR, root_banner)),
        "logoExists": os.path.exists(os.path.join(BASE_DIR, root_logo)),
        "readmeExists": os.path.exists(os.path.join(BASE_DIR, "README.md")),
    })

    # 2. Addons
    addons_dir = os.path.join(BASE_DIR, "addons")
    if os.path.exists(addons_dir):
        for name in sorted(os.listdir(addons_dir)):
            full = os.path.join(addons_dir, name)
            if os.path.isdir(full) and not name.startswith("."):
                banner_cand = None
                for b in ["banner.jpg", "banner.png"]:
                    if os.path.exists(os.path.join(full, b)):
                        banner_cand = os.path.join("addons", name, b)
                        break
                if not banner_cand:
                    # check for timestamped or preview images
                    for f in os.listdir(full):
                        if (f.endswith(".jpg") or f.endswith(".png")) and not f.startswith("pack_icon") and not f.startswith("mcpedl"):
                            banner_cand = os.path.join("addons", name, f)
                            break
                if not banner_cand:
                    banner_cand = os.path.join("addons", name, "banner.jpg")

                logo_cand = None
                for l in ["pack_icon.png", "mcpedl.png", "mcpedl.jpg"]:
                    if os.path.exists(os.path.join(full, l)):
                        logo_cand = os.path.join("addons", name, l)
                        break
                if not logo_cand:
                    logo_cand = os.path.join("addons", name, "pack_icon.png")

                readme_path = os.path.join("addons", name, "README.md")
                projects.append({
                    "id": f"addons/{name}",
                    "name": name.replace("-", " "),
                    "category": "addon",
                    "dir": os.path.join("addons", name),
                    "readmePath": readme_path,
                    "bannerPath": banner_cand,
                    "logoPath": logo_cand,
                    "bannerExists": os.path.exists(os.path.join(BASE_DIR, banner_cand)),
                    "logoExists": os.path.exists(os.path.join(BASE_DIR, logo_cand)),
                    "readmeExists": os.path.exists(os.path.join(BASE_DIR, readme_path)),
                })

    # 3. Maps
    maps_dir = os.path.join(BASE_DIR, "maps")
    if os.path.exists(maps_dir):
        for name in sorted(os.listdir(maps_dir)):
            full = os.path.join(maps_dir, name)
            if os.path.isdir(full) and not name.startswith("."):
                readme_path = os.path.join("maps", name, "README.md")
                icon_path = os.path.join("maps", name, "mcpedl.png")
                if not os.path.exists(os.path.join(BASE_DIR, icon_path)):
                    icon_path = os.path.join("maps", name, "behavior_pack/pack_icon.png")
                projects.append({
                    "id": f"maps/{name}",
                    "name": name.replace("-", " "),
                    "category": "map",
                    "dir": os.path.join("maps", name),
                    "readmePath": readme_path,
                    "bannerPath": os.path.join("maps", name, "banner.jpg"),
                    "logoPath": icon_path,
                    "bannerExists": os.path.exists(os.path.join(BASE_DIR, "maps", name, "banner.jpg")),
                    "logoExists": os.path.exists(os.path.join(BASE_DIR, icon_path)),
                    "readmeExists": os.path.exists(os.path.join(BASE_DIR, readme_path)),
                })

    # 4. Scripts
    scripts_dir = os.path.join(BASE_DIR, "script")
    if os.path.exists(scripts_dir):
        for name in sorted(os.listdir(scripts_dir)):
            full = os.path.join(scripts_dir, name)
            if os.path.isdir(full) and not name.startswith("."):
                banner_cand = os.path.join("script", name, "banner.jpg")
                for f in os.listdir(full):
                    if (f.endswith(".jpg") or f.endswith(".png")) and not f.startswith("pack_icon") and not f.startswith("mcpedl"):
                        banner_cand = os.path.join("script", name, f)
                        break
                icon_path = os.path.join("script", name, "pack_icon.png")
                if not os.path.exists(os.path.join(BASE_DIR, icon_path)):
                    icon_path = os.path.join("script", name, "mcpedl.png")
                readme_path = os.path.join("script", name, "README.md")
                projects.append({
                    "id": f"script/{name}",
                    "name": name.replace("-", " "),
                    "category": "script",
                    "dir": os.path.join("script", name),
                    "readmePath": readme_path,
                    "bannerPath": banner_cand,
                    "logoPath": icon_path,
                    "bannerExists": os.path.exists(os.path.join(BASE_DIR, banner_cand)),
                    "logoExists": os.path.exists(os.path.join(BASE_DIR, icon_path)),
                    "readmeExists": os.path.exists(os.path.join(BASE_DIR, readme_path)),
                })

    return projects

def update_readme_content(content, target_id, banner_rel, logo_rel, cache_buster=True):
    """
    Intelligently updates banner and logo references in a README.md file
    strictly adhering to pure markdown compatibility standards.
    """
    lines = content.splitlines()
    timestamp = int(time.time())
    cache_query = f"?v={timestamp}" if cache_buster else ""
    
    # Raw github base URL
    github_raw_prefix = "https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/"

    banner_target_url = f"{github_raw_prefix}{banner_rel}{cache_query}" if banner_rel else None
    logo_target_url = f"{github_raw_prefix}{logo_rel}{cache_query}" if logo_rel else None

    new_lines = []
    banner_replaced = False
    logo_replaced = False

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for HTML logo block: <div align="center"><img ...></div> or single <img ...>
        if "<div align=\"center\">" in line and i + 2 < len(lines) and "</div>" in lines[i + 2] and "<img" in lines[i + 1]:
            if logo_target_url:
                # Update img src inside centered div or convert to markdown
                img_line = lines[i + 1]
                new_img_line = re.sub(r'src=["\'][^"\']*?["\']', f'src="{logo_target_url}"', img_line)
                new_lines.append(line)
                new_lines.append(new_img_line)
                new_lines.append(lines[i + 2])
                logo_replaced = True
                i += 3
                continue

        # Single line <img> tag for logo
        if "<img" in line and any(k in line.lower() for k in ["mcpedl", "logo"]):
            if logo_target_url:
                line = re.sub(r'src=["\'][^"\']*?["\']', f'src="{logo_target_url}"', line)
                new_lines.append(line)
                logo_replaced = True
                i += 1
                continue

        # Markdown logo or icon match
        if re.search(r'!\[.*?\]\((.*?(?:mcpedl|logo|pack_icon).*?\.(?:png|jpg)[^\)]*)\)', line, re.IGNORECASE):
            if logo_target_url and not logo_replaced:
                alt_match = re.search(r'!\[(.*?)\]', line)
                alt = alt_match.group(1) if alt_match else "MCPEDL"
                line = f'![{alt}]({logo_target_url} "{alt}")'
                logo_replaced = True
                new_lines.append(line)
                i += 1
                continue

        # Markdown banner match
        if re.search(r'!\[.*?\]\((.*?(?:banner|179\d+).*?\.(?:jpg|png|jpeg|webp)[^\)]*)\)', line, re.IGNORECASE) or (i <= 5 and re.search(r'!\[MCPEDL\]\(.*?\)', line)):
            if banner_target_url and not banner_replaced:
                alt_match = re.search(r'!\[(.*?)\]', line)
                alt = alt_match.group(1) if alt_match else "MCPEDL"
                line = f'![{alt}]({banner_target_url} "{alt}")'
                banner_replaced = True
                new_lines.append(line)
                i += 1
                continue

        new_lines.append(line)
        i += 1

    # If banner was provided but no banner pattern matched, insert it after title
    if banner_target_url and not banner_replaced:
        for idx, l in enumerate(new_lines):
            if l.startswith("# "):
                new_lines.insert(idx + 1, "")
                new_lines.insert(idx + 2, f'![MCPEDL]({banner_target_url} "MCPEDL")')
                banner_replaced = True
                break

    # If logo was provided but not found in root README, insert clean markdown logo
    if logo_target_url and not logo_replaced and target_id == "root":
        # in root, insert above or below title
        for idx, l in enumerate(new_lines):
            if l.startswith("# "):
                new_lines.insert(idx + 1, "")
                new_lines.insert(idx + 2, f'<div align="center">\n  <img src="{logo_target_url}" alt="MCPEDL" title="MCPEDL" width="150" />\n</div>')
                logo_replaced = True
                break

    return "\n".join(new_lines) + ("\n" if content.endswith("\n") else "")

class BrandingServerHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "/index.html":
            self.serve_html()
        elif path == "/api/targets":
            self.serve_targets()
        elif path == "/api/image":
            self.serve_image(parsed.query)
        elif path == "/api/readme":
            self.serve_readme(parsed.query)
        else:
            # Fallback static file serving
            local_path = os.path.join(BASE_DIR, path.lstrip("/"))
            if os.path.exists(local_path) and os.path.isfile(local_path):
                self.serve_file(local_path)
            else:
                self.send_error(404, "File Not Found")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/update":
            self.handle_update()
        elif path == "/api/restore":
            self.handle_restore()
        else:
            self.send_error(404, "Endpoint Not Found")

    def serve_html(self):
        html_file = os.path.join(BASE_DIR, "branding.html")
        if not os.path.exists(html_file):
            self.send_error(404, "branding.html not found")
            return
        with open(html_file, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_file(self, full_path):
        mime, _ = mimetypes.guess_type(full_path)
        if not mime:
            mime = "application/octet-stream"
        with open(full_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_targets(self):
        projects = get_projects()
        res = {
            "success": True,
            "hasPil": HAS_PIL,
            "baseDir": BASE_DIR,
            "targets": projects
        }
        data = json.dumps(res, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_image(self, query_str):
        params = parse_qs(query_str)
        rel_path = params.get("path", [None])[0]
        if not rel_path:
            self.send_error(400, "Missing path parameter")
            return

        full_path = os.path.normpath(os.path.join(BASE_DIR, rel_path))
        if not full_path.startswith(BASE_DIR) or not os.path.exists(full_path) or not os.path.isfile(full_path):
            self.send_error(404, "Image not found")
            return

        mime, _ = mimetypes.guess_type(full_path)
        if not mime:
            mime = "image/jpeg"
        with open(full_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_readme(self, query_str):
        params = parse_qs(query_str)
        target_id = params.get("target", ["root"])[0]
        projects = {p["id"]: p for p in get_projects()}
        proj = projects.get(target_id)
        if not proj:
            self.send_error(404, "Target not found")
            return

        full_path = os.path.join(BASE_DIR, proj["readmePath"])
        if not os.path.exists(full_path):
            self.send_error(404, "README.md not found")
            return

        with open(full_path, "r", encoding="utf-8") as f:
            text = f.read()

        res = {"success": True, "target": target_id, "readmePath": proj["readmePath"], "content": text}
        data = json.dumps(res).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_update(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            payload = json.loads(body.decode("utf-8"))
        except Exception as e:
            self.send_error(400, f"Invalid JSON payload: {e}")
            return

        target_id = payload.get("target", "root")
        banner_b64 = payload.get("bannerData")
        logo_b64 = payload.get("logoData")
        options = payload.get("options", {})
        update_readme = options.get("updateReadme", True)
        cache_buster = options.get("cacheBuster", True)
        backup_readme = options.get("backup", True)

        projects = {p["id"]: p for p in get_projects()}
        proj = projects.get(target_id)
        if not proj:
            self.send_error(404, "Specified target not found")
            return

        updated_files = []
        target_dir = os.path.join(BASE_DIR, proj["dir"])
        os.makedirs(target_dir, exist_ok=True)

        # 1. Process Banner Image
        saved_banner_rel = proj["bannerPath"]
        if banner_b64:
            try:
                # Remove data:image/...;base64, header if present
                if "," in banner_b64:
                    banner_b64 = banner_b64.split(",", 1)[1]
                raw_bytes = base64.b64decode(banner_b64)

                dest_banner_full = os.path.join(BASE_DIR, proj["bannerPath"])
                os.makedirs(os.path.dirname(dest_banner_full), exist_ok=True)

                if HAS_PIL:
                    img = Image.open(io.BytesIO(raw_bytes))
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    img.save(dest_banner_full, format="JPEG", quality=95, optimize=True)
                else:
                    with open(dest_banner_full, "wb") as f:
                        f.write(raw_bytes)

                updated_files.append(proj["bannerPath"])
            except Exception as e:
                self.send_error(500, f"Failed saving banner: {e}")
                return

        # 2. Process Logo Image
        saved_logo_rel = proj["logoPath"]
        if logo_b64:
            try:
                if "," in logo_b64:
                    logo_b64 = logo_b64.split(",", 1)[1]
                raw_bytes = base64.b64decode(logo_b64)

                dest_logo_full = os.path.join(BASE_DIR, proj["logoPath"])
                os.makedirs(os.path.dirname(dest_logo_full), exist_ok=True)

                if HAS_PIL:
                    img = Image.open(io.BytesIO(raw_bytes))
                    # Preserve alpha channel for PNG
                    if img.mode not in ("RGBA", "RGB"):
                        img = img.convert("RGBA")
                    img.save(dest_logo_full, format="PNG", optimize=True)
                else:
                    with open(dest_logo_full, "wb") as f:
                        f.write(raw_bytes)

                updated_files.append(proj["logoPath"])

                # If root, also sync mcpedl.png and assets/mcpedl.png
                if target_id == "root":
                    secondary = os.path.join(BASE_DIR, "mcpedl.png")
                    shutil.copyfile(dest_logo_full, secondary)
                    updated_files.append("mcpedl.png")

                    assets_dir = os.path.join(BASE_DIR, "assets")
                    os.makedirs(assets_dir, exist_ok=True)
                    assets_logo = os.path.join(assets_dir, "mcpedl.png")
                    shutil.copyfile(dest_logo_full, assets_logo)
                    updated_files.append("assets/mcpedl.png")
            except Exception as e:
                self.send_error(500, f"Failed saving logo: {e}")
                return

        # 3. Process README.md
        backup_file = None
        diff_info = None
        if update_readme:
            readme_full = os.path.join(BASE_DIR, proj["readmePath"])
            if os.path.exists(readme_full):
                with open(readme_full, "r", encoding="utf-8") as f:
                    old_content = f.read()

                if backup_readme:
                    backup_full = readme_full + ".bak"
                    shutil.copyfile(readme_full, backup_full)
                    backup_file = proj["readmePath"] + ".bak"

                new_content = update_readme_content(
                    old_content,
                    target_id,
                    saved_banner_rel if banner_b64 or proj["bannerExists"] else None,
                    saved_logo_rel if logo_b64 or proj["logoExists"] else None,
                    cache_buster=cache_buster
                )

                if new_content != old_content:
                    with open(readme_full, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    updated_files.append(proj["readmePath"])
                    diff_info = {"hasChanges": True, "old": old_content[:500], "new": new_content[:500]}
                else:
                    diff_info = {"hasChanges": False}

        res = {
            "success": True,
            "message": f"Successfully updated branding for {proj['name']}!",
            "target": target_id,
            "updatedFiles": updated_files,
            "backupFile": backup_file,
            "diff": diff_info
        }

        data = json.dumps(res, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_restore(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            payload = json.loads(body.decode("utf-8"))
        except Exception as e:
            self.send_error(400, f"Invalid JSON payload: {e}")
            return

        target_id = payload.get("target", "root")
        projects = {p["id"]: p for p in get_projects()}
        proj = projects.get(target_id)
        if not proj:
            self.send_error(404, "Target not found")
            return

        readme_full = os.path.join(BASE_DIR, proj["readmePath"])
        bak_full = readme_full + ".bak"
        if not os.path.exists(bak_full):
            self.send_error(404, "No backup file found to restore")
            return

        shutil.copyfile(bak_full, readme_full)
        res = {"success": True, "message": f"Restored {proj['readmePath']} from backup successfully!"}
        data = json.dumps(res).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

def main():
    parser = argparse.ArgumentParser(description="MCPE Curseforges Branding Manager Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to run on (default: 8080)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    args = parser.parse_args()

    server_address = (args.host, args.port)
    httpd = HTTPServer(server_address, BrandingServerHandler)
    url = f"http://localhost:{args.port}"
    print("=" * 70)
    print("  MCPE Curseforges - Branding & Asset Manager Server")
    print("=" * 70)
    print(f"  Live Studio:  {url}")
    print(f"  Base Directory: {BASE_DIR}")
    print(f"  Pillow (PIL):   {'Available' if HAS_PIL else 'Not installed (fallback binary writer active)'}")
    print("-" * 70)
    print("  Press Ctrl+C to stop the server.")
    print("=" * 70)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down branding server.")
        httpd.server_close()

if __name__ == "__main__":
    main()
