"use client";

import type { Schedule, ScheduleWindow } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import type { Rules } from "./rules";
import { RulesAddButton } from "./rules-add-button";
import { RulesSection } from "./rules-section";
import {
  crossesMidnight,
  MAX_SCHEDULE_WINDOWS,
  newWindow,
  SCHEDULE_DAYS,
  SCHEDULE_MODE_COPY,
  SCHEDULE_PRESETS,
  type ScheduleMode,
  scheduleForMode,
  schedulePreview,
  timeZoneOptions,
} from "./schedule";

/** When the agent may move money, on the owner's clock. The API enforces it. */
export function ScheduleRules({
  rules,
  onChange,
  embedded = false,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  embedded?: boolean;
}) {
  const { schedule } = rules;
  const setSchedule = (next: Schedule | null) => onChange({ ...rules, schedule: next });
  const mode: ScheduleMode = schedule?.mode ?? "off";
  return (
    <RulesSection
      embedded={embedded}
      title="Schedule"
      description="Limit swaps, transfers and withdrawals to hours on your clock. A request is judged when it would run, after the execution delay. Deposits are never held."
    >
      <div className="grid gap-3 @xl/rules:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="policy-schedule-mode">Money actions run</Label>
          <NativeSelect
            id="policy-schedule-mode"
            className="w-full"
            value={mode}
            onChange={(event) =>
              setSchedule(scheduleForMode(schedule, event.target.value as ScheduleMode))
            }
          >
            {(Object.keys(SCHEDULE_MODE_COPY) as ScheduleMode[]).map((option) => (
              <NativeSelectOption key={option} value={option}>
                {SCHEDULE_MODE_COPY[option]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {schedule ? (
          <div className="space-y-2">
            <Label htmlFor="policy-schedule-zone">Time zone</Label>
            <NativeSelect
              id="policy-schedule-zone"
              className="w-full"
              value={schedule.time_zone}
              onChange={(event) => setSchedule({ ...schedule, time_zone: event.target.value })}
            >
              {timeZoneOptions(schedule.time_zone).map((zone) => (
                <NativeSelectOption key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : null}
      </div>
      {schedule ? <ScheduleWindows schedule={schedule} onChange={setSchedule} /> : null}
    </RulesSection>
  );
}

function ScheduleWindows({
  schedule,
  onChange,
}: {
  schedule: Schedule;
  onChange: (schedule: Schedule) => void;
}) {
  const preview = schedulePreview(schedule);
  const setWindows = (windows: ScheduleWindow[]) => onChange({ ...schedule, windows });
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Presets</span>
        {SCHEDULE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            size="xs"
            variant="outline"
            onClick={() =>
              onChange({ ...schedule, mode: preset.mode, windows: structuredClone(preset.windows) })
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {schedule.windows.map((window, index) => (
          <WindowRow
            // Windows have no identity besides their position in the signed list.
            // biome-ignore lint/suspicious/noArrayIndexKey: position is the window's identity
            key={index}
            index={index}
            window={window}
            removable={schedule.windows.length > 1}
            onChange={(next) =>
              setWindows(schedule.windows.map((item, at) => (at === index ? next : item)))
            }
            onRemove={() => setWindows(schedule.windows.filter((_, at) => at !== index))}
          />
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {schedule.windows.length < MAX_SCHEDULE_WINDOWS ? (
          <RulesAddButton
            label="Add window"
            onClick={() => setWindows([...schedule.windows, newWindow()])}
          />
        ) : (
          <span />
        )}
        {preview ? (
          <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            Now {preview.clock} ·{" "}
            <span className={preview.open ? "text-foreground" : "text-warning"}>
              {preview.open ? "money actions allowed" : "money actions held"}
            </span>
          </p>
        ) : null}
      </div>
    </>
  );
}

function WindowRow({
  index,
  window,
  removable,
  onChange,
  onRemove,
}: {
  index: number;
  window: ScheduleWindow;
  removable: boolean;
  onChange: (window: ScheduleWindow) => void;
  onRemove: () => void;
}) {
  const allDay = window.start === "00:00" && window.end === "24:00";
  const endOfDay = window.end === "24:00";
  const id = `policy-schedule-${index}`;
  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-input/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <fieldset className="grid flex-1 grid-cols-7 gap-1" aria-label={`Window ${index + 1} days`}>
          {SCHEDULE_DAYS.map(({ day, label }) => {
            const selected = window.days.includes(day);
            return (
              <Button
                key={day}
                type="button"
                size="xs"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                className={cn("px-0", !selected && "bg-transparent text-muted-foreground")}
                onClick={() =>
                  onChange({
                    ...window,
                    days: selected
                      ? window.days.filter((item) => item !== day)
                      : [...window.days, day],
                  })
                }
              >
                {label}
              </Button>
            );
          })}
        </fieldset>
        {removable ? (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="text-muted-foreground"
            onClick={onRemove}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-start`} className="text-xs">
            From
          </Label>
          <Input
            id={`${id}-start`}
            type="time"
            step={60}
            required
            disabled={allDay}
            value={window.start}
            onChange={(event) => onChange({ ...window, start: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-end`} className="text-xs">
            Until
          </Label>
          <Input
            id={`${id}-end`}
            type="time"
            step={60}
            required
            disabled={endOfDay}
            value={endOfDay ? "" : window.end}
            placeholder="24:00"
            onChange={(event) => onChange({ ...window, end: event.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex flex-wrap gap-x-4 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={allDay}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? { ...window, start: "00:00", end: "24:00" }
                    : { ...window, start: "09:00", end: "17:00" },
                )
              }
            />
            All day
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={endOfDay}
              disabled={allDay}
              onChange={(event) =>
                onChange({ ...window, end: event.target.checked ? "24:00" : "23:00" })
              }
            />
            Until midnight
          </label>
        </span>
        {crossesMidnight(window) ? <span>Runs past midnight into the next day.</span> : null}
      </div>
    </li>
  );
}
