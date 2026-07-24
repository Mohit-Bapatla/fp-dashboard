import { cn } from "@/lib/utils";

export type SocialPlatform = "instagram" | "linkedin" | "substack" | "tiktok";

export function SocialIcon({
  className,
  platform,
}: {
  className?: string;
  platform: SocialPlatform;
}) {
  if (platform === "substack") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-5", className)}
        data-substack-mark=""
        focusable="false"
        viewBox="0 0 1000 1000"
      >
        <path
          d="M764.166 348.371H236.319V419.402H764.166V348.371Z"
          fill="#FF6719"
        />
        <path
          d="M236.319 483.752V813.999L500.231 666.512L764.19 813.999V483.752H236.319Z"
          fill="#FF6719"
        />
        <path d="M764.166 213H236.319V284.019H764.166V213Z" fill="#FF6719" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-5", className)}
        fill="none"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <rect
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
          width="18"
          x="3"
          y="3"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.4" cy="6.7" fill="currentColor" r="1.15" />
      </svg>
    );
  }

  if (platform === "tiktok") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-5", className)}
        fill="none"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <path
          d="M15.1 4v11.15a4.35 4.35 0 1 1-3.55-4.28"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
        />
        <path
          d="M15.1 4c.45 2.82 2.15 4.38 4.9 4.62"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={cn("size-5", className)}
      fill="currentColor"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="M6.55 8.2H3.3v12.5h3.25V8.2ZM4.92 3.25a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM9.25 8.2h3.12v1.72h.05c.43-.82 1.5-2.12 3.63-2.12 3.88 0 4.6 2.55 4.6 5.87v7.03H17.4v-6.23c0-1.49-.03-3.4-2.08-3.4-2.08 0-2.4 1.62-2.4 3.29v6.34H9.67V8.2h-.42Z" />
    </svg>
  );
}
