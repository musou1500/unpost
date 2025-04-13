export const parseStr = (
  v: unknown,
  {
    minLength,
    maxLength,
    pattern,
  }: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }
): string => {
  if (
    typeof v !== "string" ||
    (minLength !== undefined && v.length < minLength) ||
    (maxLength !== undefined && v.length > maxLength) ||
    (pattern !== undefined && !pattern.test(v))
  ) {
    throw new Response("Invalid value", { status: 400 });
  }

  return v;
};

export const parseDateStr = (v: unknown): Date => {
  if (typeof v !== "string") {
    throw new Response("Invalid value", { status: 400 });
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw new Response("Invalid value", { status: 400 });
  }

  return d;
};

const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const parseEmail = (v: unknown) => {
  return parseStr(v, {
    pattern: emailRegex,
  });
};
export const parseArray = <T>(
  v: unknown,
  validateItem: (v: unknown) => T
): T[] => {
  if (!Array.isArray(v)) {
    throw new Response("Invalid value", { status: 400 });
  }

  return v.map(validateItem);
};

export const parseIntStr = (
  v: unknown,
  options: Partial<{ min: number; max: number }>
): number => {
  if (typeof v !== "string") {
    throw new Response("Invalid value", { status: 400 });
  }

  const intValue = parseInt(v, 10);
  if (Number.isNaN(intValue)) {
    throw new Response("Invalid value", { status: 400 });
  }

  if (
    (options.min !== undefined && intValue < options.min) ||
    (options.max !== undefined && intValue > options.max)
  ) {
    throw new Response("Invalid value", { status: 400 });
  }

  return intValue;
};

export const parsePositiveInt = (v: unknown) => {
  if (typeof v !== "string") {
    throw new Response("Invalid value", { status: 400 });
  }

  const intValue = parseInt(v, 10);
  if (Number.isNaN(intValue) || intValue < 1) {
    throw new Response("Invalid value", { status: 400 });
  }

  return intValue;
};

export const parseMonthStr = (
  v: unknown
): {
  year: number;
  month: number;
} => {
  if (typeof v !== "string") {
    throw new Response("Invalid value", { status: 400 });
  }

  const monthRegex = /^(\d{4})-(\d{2})$/;
  const match = v.match(monthRegex);
  if (!match) {
    throw new Response("Invalid value", { status: 400 });
  }

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
  };
};

export const parseCheckbox = (v: unknown): boolean => v === "on";

export const ifEmpty = <T, S>(
  value: unknown,
  defaultValue: T,
  nonEmpty: (v: unknown) => S
) => {
  if (value === "" || value === null || value === undefined) {
    return defaultValue;
  } else {
    return nonEmpty(value);
  }
};
