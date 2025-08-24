import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function StitchSavvyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L12 10" />
      <path d="M12 14L12 22" />
      <path d="M17 3L7 3" />
      <path d="M17 11L7 11" />
      <path d="M9 7C7.66 7.58 6.5 8.66 6.5 10C6.5 11.34 7.66 12.42 9 13" />
      <path d="M15 11C16.34 10.42 17.5 9.34 17.5 8C17.5 6.66 16.34 5.58 15 5" />
      <path d="M3 21C4.1 20.24 5.5 20.24 6.6 21" />
      <path d="M17.4 3C18.5 3.76 19.9 3.76 21 3" />
    </svg>
  );
}
