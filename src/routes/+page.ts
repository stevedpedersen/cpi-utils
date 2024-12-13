// src/routes/+page.ts
import type { Load } from "@sveltejs/kit";

export const load: Load = async () => {
  return {
    title: "CPI Artifact Comparison",
  };
};
