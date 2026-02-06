const SENSITIVE_KEYS = [
  "password",
  "passcode",
  "pin",
  "secret",
  "token",
  "key",
  "mnemonic",
  "phrase",
];

type Redactable = Record<string, unknown> | unknown[] | string | number | null;

function redactString(value: string): string {
  return value.replace(
    /(password|passcode|pin|secret|token|key)=([^&\s]+)/gi,
    "$1=[redacted]",
  );
}

export function redact(value: Redactable): Redactable {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item)) as Redactable;
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey),
        )
          ? "[redacted]"
          : redact(entry as Redactable),
      ]),
    ) as Redactable;
  }

  return value;
}

type LogMeta = Record<string, unknown> | Error | string | number | null;

export const log = {
  info(message: string, meta?: LogMeta) {
    if (meta === undefined) {
      console.info(message);
      return;
    }
    console.info(message, redact(meta as Redactable));
  },
  warn(message: string, meta?: LogMeta) {
    if (meta === undefined) {
      console.warn(message);
      return;
    }
    console.warn(message, redact(meta as Redactable));
  },
  error(message: string, meta?: LogMeta) {
    if (meta === undefined) {
      console.error(message);
      return;
    }
    console.error(message, redact(meta as Redactable));
  },
  redact,
};
