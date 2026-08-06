# Pixel Divers Docs (source)

Docusaurus source for https://pixeldivers.world/docs. The built output is committed to
`../docs/`, which GitHub Pages serves from the repo root.

```
npm install         # once
npm start           # local preview at http://localhost:3000/docs/
npm run build -- --out-dir ../docs    # rebuild the published site
```

Doc pages live in `docs/`; sidebar order is `sidebars.js`; theme is
`src/css/custom.css`.
