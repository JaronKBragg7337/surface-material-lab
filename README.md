# Surface Material Lab

**Live Pages preview:** <https://jaronkbragg7337.github.io/surface-material-lab/>

Surface Material Lab is a standalone, public browser tool for turning real-world surface sources into reusable, inspectable material packages for Three.js and compatible 3D workflows.

The project is intentionally independent from game and cinematic repositories. It is a material intelligence layer: simple geometry becomes a repeatable test instrument, while source imagery, physical scale, mapping, lighting, variation, validation, provenance, and export stay together in a machine-readable material card.

## Current vertical slice

The current library contains eighteen reusable cards spanning concrete, brick, wood, rock/soil, bark, asphalt, stone, vegetation, and fabric. The newer batch adds three asphalt scales, a broadleaf study, loop-pile carpet, pale pavers, and a folded textile. All supplied photographs are released under CC0-1.0 at the owner's direction; the lab keeps original and processed maps separate and records limitations instead of silently calling every crop seamless.

The live prototype currently supports:

- sidewalk, wall, cube, sphere, cylinder, large-plane, and all-object test stages
- neutral, overcast, sunlight, and grazing-light inspection presets
- close-up, medium, and far camera presets with orbit controls
- final, base-color, roughness estimate, generated normal/relief estimate, height estimate, and UV-checker modes
- real-world source dimensions, derived repeat calculation, ruler overlay, and scale references
- deterministic macro variation and seam/repetition inspection
- material-library switching across the current batch while keeping the same test controls
- structured validation issues, runtime state JSON, screenshot capture, and ZIP package export
- touch-friendly controls and low/medium/high preview quality

The source dimensions for the current cards are explicitly provisional. The supplied source photographs are CC0-1.0 at the owner's direction, while original and processed source files remain preserved separately.

## Repository layout

```text
materials/concrete/concrete-pebble-001/
  source/       original and processed source images
  maps/         authored or derived material maps
  variants/     future inherited variant overrides
  previews/     future approved preview captures
  material.json provenance.json validation.json README.md
materials/brick/brick-wall-001/  second architecture test material
materials/intake/urban-surface-set-001/  first preserved source-photo intake set
materials/intake/urban-surface-set-002/  asphalt, vegetation, stone, and fabric intake set
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

The original source photos are preserved under the material packages and the intake catalog. The initial app assets in `src/assets/` are kept as optimized runtime previews; the material packages remain the canonical reusable records.

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

Source code is MIT. The supplied user-authored material source is CC0-1.0 at the owner’s direction. Any future third-party source must retain its actual license and provenance.
