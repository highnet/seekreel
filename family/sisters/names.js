/*
 * Who the film is about. These placeholders are what the repository ships;
 * to make it about your own family, copy stage.html to stage.private.html
 * (git-ignored), set window.SISTERS_NAMES there, and build with a
 * *.private.config.json that points at it. Real names never get committed.
 */
export const DEFAULT_NAMES = { big: "Rosie", little: "Pip", grandma: "Grandma Bea" };

export const NAMES = { ...DEFAULT_NAMES, ...(window.SISTERS_NAMES || {}) };
