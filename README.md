# Surface Material Lab

**Live page:** https://jaronkbragg7337.github.io/surface-material-lab/

A standalone Three.js experiment for turning real photographs into reusable world surfaces.

The first material card uses a user-provided sidewalk photograph. The scene deliberately uses simple geometry so the surface treatment can be evaluated on its own:

- concrete photo mapped onto a sidewalk slab
- repeat density, roughness, and surface relief controls
- shadow-receiving road and curb geometry
- touch-friendly orbit controls for phone inspection
- GitHub Pages deployment on every push to `main`

## Run locally

```bash
npm install
npm run dev
```

The source photo is kept in `src/assets/sidewalk-source.jpg`; the cropped material-ready version is `src/assets/sidewalk-concrete.jpg`.
