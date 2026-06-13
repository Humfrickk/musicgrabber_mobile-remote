const MAX_SUMMARY_LENGTH = 140;
const MAX_DETAIL_LENGTH = 200;

function truncate(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function capitalizeSource(source: string): string {
  if (!source) return source;
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export interface FormattedJobError {
  message: string;
  detail?: string;
  isInfo?: boolean;
}

/** Turn raw server job errors into short, readable queue messages. */
export function formatJobError(error: string): FormattedJobError {
  const trimmed = error.trim();
  if (!trimmed) return { message: '' };

  if (trimmed.startsWith('Already exists')) {
    return { message: 'Bereits in der Bibliothek', isInfo: true };
  }

  const fallbackMatch = trimmed.match(
    /^(\w+) source unavailable:\s*(.+?)\s*Trying alternate source:\s*(\w+)/is
  );
  if (fallbackMatch) {
    const [, failedSource, reason, altSource] = fallbackMatch;
    return {
      message: `${capitalizeSource(failedSource)} nicht verfügbar — versuche ${capitalizeSource(altSource)}`,
      detail: truncate(reason, MAX_DETAIL_LENGTH),
      isInfo: true,
    };
  }

  const unavailableMatch = trimmed.match(/^(\w+) source unavailable:\s*(.+)$/is);
  if (unavailableMatch) {
    return {
      message: `${capitalizeSource(unavailableMatch[1])} derzeit nicht verfügbar`,
      detail: truncate(unavailableMatch[2], MAX_DETAIL_LENGTH),
    };
  }

  if (/trying alternate source/i.test(trimmed)) {
    const altMatch = trimmed.match(/trying alternate source:\s*(\w+)/i);
    return {
      message: altMatch
        ? `Wechsle Quelle: ${capitalizeSource(altMatch[1])}`
        : 'Wechsle Download-Quelle…',
      isInfo: true,
    };
  }

  const firstLine = trimmed.split('\n').find((line) => line.trim()) ?? trimmed;
  if (firstLine.length > MAX_SUMMARY_LENGTH) {
    return { message: truncate(firstLine, MAX_SUMMARY_LENGTH) };
  }

  return { message: firstLine };
}
