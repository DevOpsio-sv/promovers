export function scrollToId(event: { preventDefault(): void }, id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
