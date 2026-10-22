export function scrollElementIntoView(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.focus({ preventScroll: true });
  try {
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  } catch {
    target.scrollIntoView(true);
  }
  return true;
}

export function scrollToId(event: { preventDefault(): void }, id: string): void {
  if (!document.getElementById(id)) return;
  event.preventDefault();
  scrollElementIntoView(id);
}
