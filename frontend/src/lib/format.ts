const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

/** Formats a size in bytes, for example `1.5 MB`. */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value = value / 1024;
    unitIndex = unitIndex + 1;
  }
  const digits = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${BYTE_UNITS[unitIndex]}`;
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Formats an ISO date in the local time zone of the browser. */
export function formatDateTime(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate));
}

/** The extension of a file name in upper case, for example `PDF`. */
export function fileTypeLabel(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) {
    return 'File';
  }
  return filename.slice(dotIndex + 1).toUpperCase();
}

/** The file name without its extension. The upload form uses it as the default title. */
export function filenameWithoutExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) {
    return filename;
  }
  return filename.slice(0, dotIndex);
}
