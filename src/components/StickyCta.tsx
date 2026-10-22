import { useEffect, useState } from "react";

export function StickyCta({ paused }: { paused: boolean }) {
  const [calculatorVisible, setCalculatorVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const calculator = document.getElementById("calculator");
    const form = document.getElementById("request");
    if (!calculator || !form) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === "calculator") setCalculatorVisible(entry.isIntersecting);
          if (entry.target.id === "request") setFormVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(calculator);
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (paused || calculatorVisible || formVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur lg:hidden">
      <a href="#calculator" className="btn btn-primary w-full">
        Изчисли цена
      </a>
    </div>
  );
}
