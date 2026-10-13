import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "espree";

const root = fileURLToPath(new URL("../src", import.meta.url));
const normalize = (value) => value.split(path.sep).join("/");
const filesIn = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? filesIn(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
const files = filesIn(root).filter((file) => /\.[jt]sx?$/.test(file));
const errors = [];
const graph = new Map();
const report = (file, message) =>
  errors.push(normalize(path.relative(root, file)) + ": " + message);
const owner = (file) =>
  normalize(path.relative(root, file)).match(/^features\/([^/]+)/)?.[1];
const resolve = (base) =>
  [
    base,
    ...[".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.js"].map(
      (ext) => base + ext,
    ),
  ].find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
const imports = (source) =>
  [
    ...source.matchAll(
      /(?:\b(?:import|export)\s+(?:type\s+)?(?:[^;"']*?\s+from\s*)?|\bimport\s*\(\s*)["']([^"']+)["']/g,
    ),
  ].map((match) => match[1]);
const visit = (node, fn) => {
  if (!node || typeof node !== "object") return;
  if (node.type) fn(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visit(child, fn));
    else if (value && typeof value === "object") visit(value, fn);
  }
};

for (const file of files) {
  const relative = normalize(path.relative(root, file));
  const source = fs.readFileSync(file, "utf8");
  const edges = [];
  for (const specifier of imports(source)) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) {
      if (
        relative.startsWith("pages/") &&
        !["react", "react-router-dom"].includes(specifier)
      ) {
        report(file, "External dependencies belong in features: " + specifier);
      }
      continue;
    }
    const base = specifier.startsWith("@/")
      ? path.join(root, specifier.slice(2))
      : path.resolve(path.dirname(file), specifier);
    const target = resolve(base);
    if (!target) {
      report(file, "Unresolved local import: " + specifier);
      continue;
    }
    if (!/\.[jt]sx?$/.test(target) || target.endsWith(".d.ts")) continue;
    edges.push(target);
    const destination = normalize(path.relative(root, target));
    const currentFeature = owner(file),
      targetFeature = owner(target);
    if (
      targetFeature &&
      targetFeature !== currentFeature &&
      destination !== "features/" + targetFeature + "/index.ts"
    )
      report(
        file,
        "Use the feature public barrel: @/features/" + targetFeature,
      );
    if (
      currentFeature &&
      /^features\//.test(destination) &&
      currentFeature === targetFeature &&
      destination === "features/" + currentFeature + "/index.ts"
    )
      report(
        file,
        "Feature internals must not import their own public barrel (cycle risk).",
      );
    if (
      /^components\/(ui|form)\//.test(destination) &&
      !relative.startsWith("components/") &&
      !/^components\/(ui|form)\/index.ts$/.test(destination)
    )
      report(file, "Use @/components/ui or @/components/form.");
    if (
      specifier.startsWith(".") &&
      !relative.endsWith("index.ts") &&
      !relative.endsWith("index.js")
    ) {
      const sameFeature = currentFeature && currentFeature === targetFeature;
      const sameLayer = relative.split("/")[0] === destination.split("/")[0];
      if (!sameFeature && !sameLayer)
        report(file, "Use @/ for cross-layer imports: " + specifier);
    }
    if (currentFeature && /^(pages|layouts|routes)\//.test(destination))
      report(file, "Features cannot depend on pages, layouts or routes.");
    if (
      /^(components|hooks|services|store|types|utils)\//.test(relative) &&
      /^(features|pages|layouts|routes)\//.test(destination)
    )
      report(
        file,
        "Shared infrastructure cannot depend on application features.",
      );
    if (
      relative.startsWith("pages/") &&
      !relative.endsWith("/index.ts") &&
      !/^(features|layouts|components)\//.test(destination)
    )
      report(
        file,
        "Pages compose feature APIs and layouts; no infrastructure imports.",
      );
    if (
      relative.startsWith("features/") &&
      destination.startsWith("services/") &&
      !relative.includes("/api/")
    )
      report(file, "Only feature api/ modules may depend on HTTP services.");
  }
  graph.set(file, edges);
  if (relative.startsWith("pages/") && !relative.endsWith("index.ts")) {
    const ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    });
    if (source.split("\n").length > 60)
      report(file, "Page exceeds the composition-only size budget.");
    visit(ast, (node) => {
      if (
        [
          "ForStatement",
          "ForOfStatement",
          "WhileStatement",
          "TryStatement",
        ].includes(node.type)
      )
        report(
          file,
          "Move control-flow/business logic into the owning feature.",
        );
      if (node.type === "CallExpression") {
        const callee = node.callee;
        const name = callee.name || callee.property?.name;
        if (
          [
            "fetch",
            "request",
            "axios",
            "useEffect",
            "useState",
            "useReducer",
            "reduce",
            "sort",
            "filter",
            "map",
          ].includes(name)
        )
          report(file, "Move " + name + "() into a feature hook/component.");
      }
    });
  }
}
// Detect cycles across all local source files, including public barrels.
const visited = new Set(),
  active = new Set(),
  stack = [];
function checkCycle(file) {
  if (active.has(file)) {
    report(
      file,
      "Import cycle: " +
        stack
          .slice(stack.indexOf(file))
          .map((p) => normalize(path.relative(root, p)))
          .join(" -> "),
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  stack.push(file);
  for (const dependency of graph.get(file) || []) checkCycle(dependency);
  stack.pop();
  active.delete(file);
  visited.add(file);
}
for (const file of files) checkCycle(file);
for (const entry of fs.readdirSync(path.join(root, "features"), {
  withFileTypes: true,
}))
  if (
    entry.isDirectory() &&
    !fs.existsSync(path.join(root, "features", entry.name, "index.ts"))
  )
    errors.push("Missing feature public API: " + entry.name);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Architecture verified: " +
      files.length +
      " source files; page boundaries, aliases, public APIs and import cycles.",
  );
