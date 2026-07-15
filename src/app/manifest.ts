import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Future Physicians",
    short_name: "FP",
    description:
      "Verified healthcare opportunities and application tools for students.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAFE",
    theme_color: "#2F6FED",
  };
}
