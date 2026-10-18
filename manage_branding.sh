#!/usr/bin/env bash
# ==============================================================================
# MCPE Curseforges - Launch Branding & Asset Studio
# ==============================================================================
PORT=8080
echo "Starting MCPE Curseforges Branding Studio on http://localhost:${PORT}..."
python3 branding_server.py --port ${PORT}
