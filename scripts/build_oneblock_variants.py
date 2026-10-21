#!/usr/bin/env python3
"""Compatibility entry point for the validated template-based OneBlock builder.

Do not generate a blank LevelDB world here. The implementation lives in
build_oneblock_variants_from_template.py and preserves a complete Bedrock world.
"""
from build_oneblock_variants_from_template import main


if __name__ == "__main__":
    raise SystemExit(main())
