export type BrowserAction =
  | "navigate"
  | "search"
  | "extract"
  | "screenshot"
  | "submit_form"
  | "send_message"
  | "post"
  | "purchase"
  | "upload"
  | "delete"
  | "change_permissions"
  | "enter_sensitive_data";

const AUTOMATIC_ACTIONS = new Set<BrowserAction>(["navigate", "search", "extract", "screenshot"]);

export function classifyBrowserAction(action: BrowserAction): "automatic" | "approval_required" {
  return AUTOMATIC_ACTIONS.has(action) ? "automatic" : "approval_required";
}
