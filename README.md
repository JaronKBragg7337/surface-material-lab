# Surface Material Lab

**Live Pages preview:** <https://jaronkbragg7337.github.io/surface-material-lab/>

Surface Material Lab is a standalone, public browser tool for turning real-world surface sources into reusable, inspectable material packages for Three.js and compatible 3D workflows.

The project is intentionally independent from game and cinematic repositories. It is a material intelligence layer: simple geometry becomes a repeatable test instrument, while source imagery, physical scale, mapping, lighting, variation, validation, provenance, and export stay together in a machine-readable material card.

## Current vertical slice

The first reusable card is `MAT-CONCRETE-0001`, an exposed-aggregate concrete surface based on the supplied sidewalk photograph. The live prototype currently supports:

- sidewalk, wall, cube, sphere, cylinder, large-plane, and all-object test stages
- neutral, overcast, sunlight, and grazing-light inspection presets
- close-up, medium, and far camera presets with orbit controls
- final, base-color, roughness estimate, generated normal/relief estimate, height estimate, and UV-checker modes
- real-world source dimensions, derived repeat calculation, ruler overlay, and scale references
- deterministic macro variation and seam/repetition inspection
- structured validation issues, runtime state JSON, screenshot capture, and ZIP package export
- touch-friendly controls and low/medium/high preview quality

The source dimensions and CC0 declaration are explicitly provisional until the photograph’s physical coverage and rights are confirmed. Original and processed source files remain preserved.

## Repository layout

```text
materials/concrete/concrete-pebble-001/
  source/       original and processed source images
  maps/         authored or derived material maps
  variants/     future inherited variant overrides
  previews/     future approved preview captures
  material.json provenance.json validation.json README.md
schemas/        JSON Schema for material cards
src/materials/  runtime material-card definitions
src/lib/        derived maps, downloads, and validation helpers
MATERIAL_*.json registry, issues, validation, and export indexes
```

## Run locally

```bash
npm install
npm run dev
```

For a production build and package checks:

```bash
npm run validate:materials
npm run build
npm run preview
```

The original source photo is preserved at `materials/concrete/concrete-pebble-001/source/original-photo.jpg`. The initial app assets in `src/assets/` are kept for the original prototype’s continuity; the material package is the canonical reusable record.

## AI-readable controls

The command palette accepts commands such as:

```text
LOAD MAT-CONCRETE-0001
GEOMETRY SPHERE
LIGHT GRAZING
CAMERA CLOSEUP
SHOW ROUGHNESS
SET SCALE 0.22
ENABLE ANTITILING
VALIDATE
EXPORT
```

The current scene state can also be downloaded as JSON. This lets a human or an AI reproduce an inspection setup without inferring it from a screenshot.

## Documentation

- [MATERIAL_STANDARD.md](MATERIAL_STANDARD.md) — shared vocabulary and package principles
- [MATERIAL_SCHEMA.md](MATERIAL_SCHEMA.md) — material-card fields and stable IDs
- [VALIDATION_RULES.md](VALIDATION_RULES.md) — deterministic and heuristic QA checks
- [EXPORT_FORMAT.md](EXPORT_FORMAT.md) — portable package and Three.js configuration
- [CAPTURE_GUIDE.md](CAPTURE_GUIDE.md) — useful source-photograph workflow
- [ROADMAP.md](ROADMAP.md) — incremental vertical slices
- [LICENSES.md](LICENSES.md) — source-code, user-authored, and third-party rights policy

## Deployment

Every push to `main` builds and deploys the Vite site through GitHub Pages. The project site is independently deployable at the live URL above.

## License

Source code is MIT. The supplied user-authored material source is marked CC0-1.0 provisionally at the owner’s direction. Any future third-party source must retain its actual license and provenance.
