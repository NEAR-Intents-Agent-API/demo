import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));
/** Bare feature imports resolve to the feature's `index.ts`; named entries are deliberate surfaces. */
const publicEntries = new Set(["index", "data", "model"]);

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

function imports(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest);
  return source.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) return [];
    const specifier = statement.moduleSpecifier;
    return specifier && ts.isStringLiteral(specifier) ? [specifier.text] : [];
  });
}

function violationsFor(file: string): string[] {
  const relative = path.relative(root, file);
  const [folder, owner] = relative.split("/");
  return imports(file).flatMap((target) => {
    if (!target.startsWith("@/features/")) return [];
    const [, , feature, ...segments] = target.split("/");
    if (["lib", "components", "hooks"].includes(folder ?? ""))
      return [`${relative}: shared import ${target}`];
    // The existing shared feature namespace is domain-free infrastructure.
    if (feature === "shared" || (folder === "features" && feature === owner)) return [];
    if (segments.length === 0 || publicEntries.has(segments.join("/"))) return [];
    return [`${relative}: private feature import ${target}`];
  });
}

test("demo routes and cross-feature callers use public entries; shared code never imports features", () => {
  const violations = ["app", "features", "components", "hooks", "lib"]
    .flatMap((folder) => files(path.join(root, folder)))
    .flatMap(violationsFor);
  assert.deepEqual(violations, []);
});
