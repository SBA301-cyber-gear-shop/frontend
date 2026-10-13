import { useEffect, useRef, useState } from "react";
import { animate, createScope, stagger } from "animejs";
import { fits, budgetPresets } from "../constants/content";

export function useLandingExperience() {
  const root = useRef(null),
    [tab, setTab] = useState(0),
    [budgetIndex, setBudgetIndex] = useState(1),
    [open, setOpen] = useState(false),
    [motion, setMotion] = useState(
      () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [imageLoaded, setImageLoaded] = useState(false),
    [imageError, setImageError] = useState(false),
    [imageRetryKey, setImageRetryKey] = useState(0),
    [activeFaqId, setActiveFaqId] = useState(null),
    [toast, setToast] = useState(null);
  useEffect(() => {
    if (!motion) return;
    const scope = createScope({ root }).add(() => {
      animate(".l-hero-copy > *", {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100),
        duration: 750,
        ease: "out(4)",
      });
      animate(".l-stage-image", {
        scale: [0.96, 1],
        opacity: [0.6, 1],
        duration: 1300,
        ease: "out(3)",
      });
      animate(".l-trust-item", {
        opacity: [0, 1],
        translateY: [15, 0],
        delay: stagger(80),
        duration: 600,
        ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, [motion]);
  const f = fits[tab];
  const b = budgetPresets[budgetIndex];
  const toggleFaq = (id) => {
    setActiveFaqId((prev) => (prev === id ? null : id));
  };
  return {
    root,
    tab,
    setTab,
    budgetIndex,
    setBudgetIndex,
    open,
    setOpen,
    motion,
    setMotion,
    imageLoaded,
    setImageLoaded,
    imageError,
    setImageError,
    imageRetryKey,
    setImageRetryKey,
    activeFaqId,
    toast,
    setToast,
    f,
    b,
    toggleFaq,
  };
}
