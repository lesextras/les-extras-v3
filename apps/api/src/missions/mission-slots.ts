export const RENFORT_PUBLICATION_MODES = [
  "MULTI_MISSION_BATCH",
  "MULTI_DAY_SINGLE_BOOKING",
] as const;

export type RenfortPublicationMode = (typeof RENFORT_PUBLICATION_MODES)[number];

export type MissionPlanningLineInput = {
  dateStart: string;
  heureDebut: string;
  dateEnd: string;
  heureFin: string;
};

export type LegacyMissionSlotInput = {
  date: string;
  heureDebut: string;
  heureFin: string;
};

export type ParsedMissionPlanningLine = MissionPlanningLineInput & {
  start: Date;
  end: Date;
  key: string;
};

export type MissionPlanningValidationIssue = {
  index: number;
  field: keyof MissionPlanningLineInput;
  message: string;
};

function isLegacyMissionSlotInput(value: unknown): value is LegacyMissionSlotInput {
  if (!value || typeof value !== "object") return false;

  const slot = value as Record<string, unknown>;
  return (
    typeof slot.date === "string" &&
    typeof slot.heureDebut === "string" &&
    typeof slot.heureFin === "string"
  );
}

function isMissionPlanningLineInput(value: unknown): value is MissionPlanningLineInput {
  if (!value || typeof value !== "object") return false;

  const line = value as Record<string, unknown>;
  return (
    typeof line.dateStart === "string" &&
    typeof line.heureDebut === "string" &&
    typeof line.dateEnd === "string" &&
    typeof line.heureFin === "string"
  );
}

function asPlanningLine(value: unknown): MissionPlanningLineInput | null {
  if (isMissionPlanningLineInput(value)) {
    return value;
  }

  if (isLegacyMissionSlotInput(value)) {
    return {
      dateStart: value.date,
      heureDebut: value.heureDebut,
      dateEnd: value.date,
      heureFin: value.heureFin,
    };
  }

  return null;
}

export function parseMissionPlanningLine(
  line: MissionPlanningLineInput,
): ParsedMissionPlanningLine | null {
  const start = new Date(`${line.dateStart}T${line.heureDebut}`);
  const end = new Date(`${line.dateEnd}T${line.heureFin}`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return null;
  }

  return {
    ...line,
    start,
    end,
    key: `${line.dateStart}|${line.heureDebut}|${line.dateEnd}|${line.heureFin}`,
  };
}

export function sortMissionPlanning<T extends MissionPlanningLineInput>(
  lines: T[],
): T[] {
  return [...lines].sort((left, right) => {
    const leftDate = new Date(`${left.dateStart}T${left.heureDebut}`).getTime();
    const rightDate = new Date(`${right.dateStart}T${right.heureDebut}`).getTime();

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return new Date(`${left.dateEnd}T${left.heureFin}`).getTime() -
      new Date(`${right.dateEnd}T${right.heureFin}`).getTime();
  });
}

export function normalizeMissionPlanning(
  lines: MissionPlanningLineInput[],
): ParsedMissionPlanningLine[] {
  return lines
    .map(parseMissionPlanningLine)
    .filter((line): line is ParsedMissionPlanningLine => line !== null)
    .sort((left, right) => left.start.getTime() - right.start.getTime());
}

export function validateMissionPlanning(
  lines: MissionPlanningLineInput[],
  now = new Date(),
): MissionPlanningValidationIssue[] {
  const issues: MissionPlanningValidationIssue[] = [];
  const parsedLines = lines.map((line, index) => ({
    index,
    line,
    normalized: parseMissionPlanningLine(line),
  }));

  for (const item of parsedLines) {
    if (
      !item.line.dateStart ||
      !item.line.heureDebut ||
      !item.line.dateEnd ||
      !item.line.heureFin
    ) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: `Planning line ${item.index + 1} is incomplete`,
      });
      continue;
    }

    if (!item.normalized) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: `Planning line ${item.index + 1} is invalid`,
      });
      continue;
    }

    if (item.normalized.start.getTime() < now.getTime()) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: `Planning line ${item.index + 1} is in the past`,
      });
    }
  }

  const validLines = parsedLines
    .filter(
      (
        item,
      ): item is {
        index: number;
        line: MissionPlanningLineInput;
        normalized: ParsedMissionPlanningLine;
      } => item.normalized !== null,
    )
    .sort((left, right) => left.normalized.start.getTime() - right.normalized.start.getTime());

  const seenKeys = new Set<string>();
  for (const item of validLines) {
    if (seenKeys.has(item.normalized.key)) {
      issues.push({
        index: item.index,
        field: "dateStart",
        message: `Planning line ${item.index + 1} duplicates another line`,
      });
      continue;
    }
    seenKeys.add(item.normalized.key);
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
        message: `Planning line ${current.index + 1} overlaps another line`,
      });
    }
  }

  return issues;
}

export function coerceMissionPlanning(value: unknown): MissionPlanningLineInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(asPlanningLine)
    .filter((line): line is MissionPlanningLineInput => line !== null);
}

export function deriveMissionEnvelopeFromPlanning(
  lines: MissionPlanningLineInput[],
): { dateStart: string; dateEnd: string } | null {
  const normalized = normalizeMissionPlanning(lines);
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

export function missionPlanningOverlapsDate(value: unknown, date: string): boolean {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
    return false;
  }

  return normalizeMissionPlanning(coerceMissionPlanning(value)).some(
    (line) => line.start <= dayEnd && line.end >= dayStart,
  );
}

export function calculateMissionPlanningHours(value: unknown): number | null {
  const normalized = normalizeMissionPlanning(coerceMissionPlanning(value));

  if (normalized.length === 0) {
    return null;
  }

  const rawHours = normalized.reduce(
    (sum, line) => sum + (line.end.getTime() - line.start.getTime()) / (1000 * 60 * 60),
    0,
  );

  return Math.max(1, Math.round(rawHours * 100) / 100);
}

