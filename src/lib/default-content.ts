import { hardware, steps } from "@/data/project";
import type { SiteContent } from "./content-types";

/** Fallback until the first publication, also used to initialize the editor. */
export function getDefaultContent(): SiteContent {
  return {
    gallery: [],
    heroImageId: null,
    components: hardware.map((item, index) => ({ ...item, id: `component-${index + 1}`, images: [] })),
    steps: steps.map((step) => ({ ...step, images: [] })),
    codeFiles: [],
    firmwareUrl: null,
  };
}
