import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * The Market Mind mark. Uses currentColor — set color via `text-*`
 * on a parent element or pass a className. Tight viewBox crop of the
 * source SVG for clean rendering at small sizes.
 */
export function LogoMark({ size = 24, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="400 400 700 700"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M 1027.6875 1070.914062 L 1027.6875 685.957031 L 916.558594 750.117188 L 916.558594 1006.753906 Z" />
      <path d="M 805.421875 1070.914062 L 805.421875 685.933594 L 694.296875 750.117188 L 694.296875 1006.753906 Z" />
      <path d="M 583.167969 1070.914062 L 583.167969 685.957031 L 472.039062 750.117188 L 472.039062 1006.753906 Z" />
      <path d="M 916.558594 521.25 L 916.558594 493.472656 L 805.421875 429.308594 L 805.421875 685.957031 L 916.558594 750.117188 Z" />
      <path d="M 694.296875 676.5 L 694.296875 493.472656 L 583.167969 429.308594 L 583.167969 685.957031 L 694.296875 750.117188 Z" />
    </svg>
  );
}
