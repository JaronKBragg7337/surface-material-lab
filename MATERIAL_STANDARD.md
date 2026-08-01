# Surface Material Standard

Surface Material Lab separates four things:

- **Texture:** an individual image map.
- **Material:** the complete visual and physical surface definition.
- **Material card:** the structured reusable record for one material.
- **Material package:** maps, metadata, variants, previews, provenance, validation, and Three.js configuration.

Every material receives a stable `MAT-*` ID. Every map path is explicit. Missing maps are `null`, never silently substituted. A map derived from a photograph is labeled an estimate until it is replaced by authored or measured data.

The initial material is `MAT-CONCRETE-0001`; the current urban source batch expands the library without changing the stable-card rules. The system is intentionally independent from game and cinematic repositories.
