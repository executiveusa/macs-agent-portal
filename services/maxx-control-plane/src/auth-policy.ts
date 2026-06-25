export function parseAllowedEmails(value = ""): string[] {
  return [...new Set(value.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

export function isAllowedOperator(email: string | undefined, allowedEmails: string[]): boolean {
  return Boolean(email && allowedEmails.includes(email.trim().toLowerCase()));
}
