# Material Schema

The canonical JSON Schema is `schemas/material-card.schema.json`.

Required concepts:

- stable ID and category
- source files, source type, license, and provenance
- real-world source width and height in meters
- explicit map paths, including `null` for missing maps
- physical properties and color-space metadata
- tileability, scale, validation, and anti-tiling state
- variant IDs and lifecycle status

Runtime state may add camera, lighting, geometry, and temporary overrides, but exported cards must remain valid against the schema.
