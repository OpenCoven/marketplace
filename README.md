# OpenCoven Marketplace

First-party plugin payloads, Craft sources, knowledge packs, and harness compatibility exports for OpenCoven.

## Authoring

Edit `marketplace/catalog.json` and the relevant sources under `marketplace/craft-sources`, `marketplace/pack-sources`, or manually managed plugin directories. Preserve upstream license and provenance files.

Generate and verify:

```sh
python3 scripts/sync-marketplace.py
python3 scripts/sync-marketplace.py --check
node scripts/sync-marketplace.test.mjs
```

Register the marketplace with Codex using the `marketplace/` directory, which contains `.claude-plugin/marketplace.json`.

## Extraction provenance

Extracted without changing payload bytes from `OpenCoven/coven-cave` commit `febf36ab1cbb76f5ee58b17f6ea75aeea020c630`, as part of https://github.com/OpenCoven/coven-cave/issues/5993. Existing author, license, source revision, and third-party notice metadata is retained. Cave owns the application UI and runtime contracts; this repository owns payload authoring and distribution.

Tweet Thread Lab currently contains a generated validator and schema artifacts from Cave. Regenerate those from the matching Cave protocol sources until their protocol build is extracted separately; do not hand-edit generated validator bytes.

## Distribution

Run node scripts/package-payloads.mjs and node scripts/package-payloads.test.mjs to produce content-addressed plugin JSON assets in dist/. Each asset contains all package files and executable flags. Cave pins the asset SHA-256, byte count, and individual contract hashes in its lightweight catalog. Published releases must never replace an existing asset; update the release and Cave pins together.

The root .claude-plugin/marketplace.json supports codex plugin marketplace add OpenCoven/marketplace. Cave also supports selected-plugin installation through a command-local registry without changing a user's global Codex sources.

## Checks

Before publication run the generator check, sync tests, audited Craft content tests, payload packager, and byte-for-byte payload tests. Preserve third-party licenses and provenance. Never commit credentials or add tool/vendor co-author trailers. Commits use Val's author identity and a Coven-Harness provenance trailer.
