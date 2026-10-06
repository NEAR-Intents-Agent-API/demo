import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StepProgress } from "../../components/shared/step-progress.js";
import { PhaseBar } from "../../features/funds/operations/operation-phase-bar.js";

test("step progress names every stage and marks only the current unfinished stage", () => {
  const markup = renderToStaticMarkup(
    createElement(StepProgress, {
      label: "Progress",
      current: 1,
      steps: [
        { label: "Name", done: true },
        { label: "Review and sign", done: false },
      ],
    }),
  );
  assert.equal((markup.match(/aria-current="step"/g) ?? []).length, 1);
  assert.ok(markup.includes("Name"));
  assert.ok(markup.includes("Review and sign"));
  const complete = renderToStaticMarkup(
    createElement(StepProgress, {
      label: "Progress",
      current: -1,
      steps: [{ label: "Done", done: true }],
    }),
  );
  assert.ok(!complete.includes("aria-current"));
});

test("failed operations mark the reached processing phase, preserving all phase labels", () => {
  const markup = renderToStaticMarkup(
    createElement(PhaseBar, {
      reached: 2,
      tone: "bad",
      settled: true,
    }),
  );
  assert.ok(markup.includes("bg-destructive"));
  for (const label of ["Submitted", "Processing", "Settled"]) assert.ok(markup.includes(label));
  assert.ok(!markup.includes("animate-pulse"));
  assert.ok(!markup.includes("aria-current"));
});
