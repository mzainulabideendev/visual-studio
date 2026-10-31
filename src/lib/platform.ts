/**
 * Best-effort shell name for the integrated terminal prompt, per platform.
 * The browser runs the UI; the backend picks the actual shell (pwsh on Windows,
 * $SHELL/bash on Unix) — this only affects how the prompt is rendered.
 */
export function terminalShellName(): string {
  if (typeof navigator === "undefined") return "bash";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("windows")) return "pwsh";
  if (ua.includes("mac") || ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "zsh";
  return "bash";
}
