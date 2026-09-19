const DRIVE_HOSTS = [
  "drive.google.com",
  "docs.google.com",
  "sheets.google.com",
  "slides.google.com",
  "forms.gle",
];

export function isValidDriveUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return DRIVE_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function requireDriveUrl(value: string) {
  if (!isValidDriveUrl(value)) {
    throw new Error("Enter a valid Google Drive or Docs link.");
  }
  return value.trim();
}
