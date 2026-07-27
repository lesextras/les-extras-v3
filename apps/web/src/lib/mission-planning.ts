import { format, isValid } from "date-fns";

export const RENFORT_PUBLICATION_MODES = [
  "MULTI_MISSION_BATCH",
  "MULTI_DAY_SINGLE_BOOKING",
] as const;

export type RenfortPublicationMode = (typeof RENFORT_PUBLICATION_MODES)[number];

export type MissionPlanningLine = {
  dateStart: string;
  heureDebut: string;
  dateEnd: string;
  heureFin: string;
};

type LegacyMissionSlot = {
  date: string;
  heureDebut: string;
  heureFin: string;
};

export type MissionPlanningSource = {
  dateStart?: string | null;
  dateEnd?: string | null;
  planning?: unknown;
  slots?: unknown;
};

export type NormalizedMissionPlanningLine = MissionPlanningLine & {
  start: Date;
  end: Date;
  key: string;
};

export type MissionPlanningValidationIssue = {
  index: number;
  field: keyof MissionPlanningLine;
  message: string;
};

function isLegacyMissionSlot(value: unknown): value is LegacyMissionSlot {
  if (!value || typeof value !== "object") return false;

  const slot = value as Record<string, unknown>;
  return (
    typeof slot.date === "string" &&
    typeof slot.heureDebut === "string" &&
    typeof slot.heureFin === "string"
  );
}

function isMissionPlanningLine(value: unknown): value is MissionPlanningLine {
  if (!value || typeof value !== "object") return false;

  const line = value as Record<string, unknown>;
  return (
    typeof line.dateStart === "string" &&
    typeof line.heureDebut === "string" &&
    typeof line.dateEnd === "string" &&
    typeof line.heureFin === "string"
  );
}

function toMissionPlanningLine(value: unknown): MissionPlanningLine | null {
  if (isMissionPlanningLine(value)) {
    return value;
  }

  if (isLegacyMissionSlot(value)) {
    return {
      dateStart: value.date,
      heureDebut: value.heureDebut,
      dateEnd: value.date,
      heureFin: value.heureFin,
    };
  }

  return null;
}

export function toNormalizedMissionPlanningLine(
  line: MissionPlanningLine,
): NormalizedMissionPlanningLine | null {
  const start = new Date(`${line.dateStart}T${line.heureDebut}`);
  const end = new Date(`${line.dateEnd}T${line.heureFin}`);

  if (!isValid(start) || !isValid(end) || end <= start) {
    return null;
  }

  return {
    ...line,
    start,
    end,
    key: `${line.dateStart}|${line.heureDebut}|${line.dateEnd}|${line.heureFin}`,
  };
}

export function sortMissionPlanning<T extends MissionPlanningLine>(lines: T[]): T[] {
  return [...lines].sort((left, right) => {
    const leftStart = new Date(`${left.dateStart}T${left.heureDebut}`).getTime();
    const rightStart = new Date(`${right.dateStart}T${right.heureDebut}`).getTime();

    if (leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return (
      new Date(`${left.dateEnd}T${left.heureFin}`).getTime() -
      new Date(`${right.dateEnd}T${right.heureFin}`).getTime()
    );
  });
}

export function coerceMissionPlanning(value: unknown): MissionPlanningLine[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(toMissionPlanningLine)
    .filter((line): line is MissionPlanningLine => line !== null);
}

function fallbackMissionPlanning(source: MissionPlanningSource): NormalizedMissionPlanningLine[] {
  if (!source.dateStart || !source.dateEnd) return [];

  const start = new Date(source.dateStart);
  const end = new Date(source.dateEnd);
  if (!isValid(start) || !isValid(end) || end <= start) return [];

  return [
    {
      dateStart: format(start, "yyyy-MM-dd"),
      heureDebut: format(start, "HH:mm"),
      dateEnd: format(end, "yyyy-MM-dd"),
      heureFin: format(end, "HH:mm"),
      start,
      end,
      key: `${format(start, "yyyy-MM-dd")}|${format(start, "HH:mm")}|${format(end, "yyyy-MM-dd")}|${format(end, "HH:mm")}`,
    },
  ];
}

export function getNormalizedMissionPlanning(
  source: MissionPlanningSource,
): NormalizedMissionPlanningLine[] {
  const rawPlanning = source.planning ?? source.slots;
  const planning = coerceMissionPlanning(rawPlanning);

  if (planning.length > 0) {
    const normalized = planning
      .map(toNormalizedMissionPlanningLine)
      .filter((line): line is NormalizedMissionPlanningLine => line !== null)
      .sort((left, right) => left.start.getTime() - right.start.getTime());

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return fallbackMissionPlanning(source);
}

export function getMissionPlanning(source: MissionPlanningSource, now = new Date()) {
  const lines = getNormalizedMissionPlanning(source);
  const firstSlot = lines[0] ?? null;
  const nextSlot = lines.find((line) => line.start.getTime() >= now.getTime()) ?? null;

  return {
    lines,
    slots: lines,
    firstSlot,
    nextSlot,
    visibleSlots: lines.slice(0, 2),
    extraCount: Math.max(lines.length - 2, 0),
  };
}

export function validateMissionPlanning(
  lines: MissionPlanningLine[],
  now = new Date(),
): MissionPlanningValidationIssue[] {
  const issues: MissionPlanningValidationIssue[] = [];
  const parsedLines = lines.map((line, index) => ({
    index,
    line,
    normalized: toNormalizedMissionPlanningLine(line),
  }));

  for (const item of parsedLines) {
    const source = lines[item.index];
    if (
      !source?.dateStart ||
      !source.heureDebut ||
      !source.dateEnd ||
      !source.heureFin
    ) {
      continue;
    }

    if (!item.normalized) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: "La ligne de planning est invalide.",
      });
      continue;
    }

    if (item.normalized.start.getTime() < now.getTime()) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: "Cette plage est déjà passée.",
      });
    }
  }

  const validLines = parsedLines
    .filter(
      (
        item,
      ): item is {
        index: number;
        line: MissionPlanningLine;
        normalized: NormalizedMissionPlanningLine;
      } =>
        item.normalized !== null,
    )
    .sort((left, right) => left.normalized.start.getTime() - right.normalized.start.getTime());

  const seenKeys = new Map<string, number>();
  for (const item of validLines) {
    const previousIndex = seenKeys.get(item.normalized.key);
    if (previousIndex !== undefined) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: "Cette plage fait doublon avec une autre.",
      });
      continue;
    }
    seenKeys.set(item.normalized.key, item.index);
  }

  for (let index = 1; index < validLines.length; index += 1) {
    const current = validLines[index];
    const previous = validLines[index - 1];

    if (
      current &&
      previous &&
      current.normalized.key !== previous.normalized.key &&
      current.normalized.start.getTime() < previous.normalized.end.getTime()
    ) {
      issues.push({
        index: current.index,
        field: "dateStart",
        message: "Cette plage chevauche une autre plage.",
      });
    }
  }

  return issues;
}

export function deriveMissionEnvelopeFromPlanning(lines: MissionPlanningLine[]) {
  const normalized = getNormalizedMissionPlanning({ planning: lines });
  const firstLine = normalized[0];
  const lastLine = normalized[normalized.length - 1];

  if (!firstLine || !lastLine) {
    return null;
  }

  return {
    dateStart: firstLine.start.toISOString(),
    dateEnd: lastLine.end.toISOString(),
  };
}

export function isMissionPlanningLineMultiDay(
  line: Pick<MissionPlanningLine, "dateStart" | "dateEnd">,
) {
  return line.dateStart !== line.dateEnd;
}

export function calculateMissionPlanningHours(source: MissionPlanningSource): number | null {
  const normalized = getNormalizedMissionPlanning(source);
  if (normalized.length === 0) {
    return null;
  }

  const hours = normalized.reduce(
    (sum, line) => sum + (line.end.getTime() - line.start.getTime()) / (1000 * 60 * 60),
    0,
  );

  return Math.max(1, Math.round(hours * 100) / 100);
}

// Legacy aliases kept during transition.
export const getNormalizedMissionSlots = getNormalizedMissionPlanning;
export const validateMissionSlots = validateMissionPlanning;
export const sortMissionSlots = sortMissionPlanning;
