// This file is explicitly .cjs so Vercel's Node wrapper executes it as CommonJS,
// avoiding conflicts with the "type": "module" in our root package.json.

// The @vercel/node builder will intercept this require and bundle the TS file.
const app = require("../server/index");

// esbuild puts the default export under the .default property
module.exports = app.default || app;
