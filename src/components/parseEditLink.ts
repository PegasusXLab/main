/** Accepts a full edit URL or just its path; returns `/edit/<id>?key=<key>` or null. */
export function parseEditLink(input: string): string | null {
  const m = input
    .trim()
    .match(/(?:^|\/\/[^/\s]+)\/edit\/([\w-]+)\?(?:[^#\s]*&)?key=([\w-]+)/);
  return m ? `/edit/${m[1]}?key=${m[2]}` : null;
}
