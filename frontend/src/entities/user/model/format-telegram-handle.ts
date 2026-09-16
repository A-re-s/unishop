// Users may type their handle with or without a leading "@" — normalize it
// so display text never doubles it up and t.me links always get a bare handle.
export function formatTelegramHandle(value: string): string {
	return value.trim().replace(/^@+/, "");
}
