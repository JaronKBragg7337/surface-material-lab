# Export Format

The browser export creates a ZIP package containing:

```text
MAT-CONCRETE-0001.zip
├── material.json
├── provenance.json
├── validation.json
├── three-material.js
├── README.md
├── source/
└── maps/
```

The generated Three.js example configures sRGB base color, repeat wrapping, real-world-derived repeat values, roughness, metalness, and estimated relief. Consumers should replace estimated channels with authored maps when available.
