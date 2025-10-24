import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function AppLogo(props: Partial<ComponentProps<typeof Image>>) {
  const { className, ...rest } = props;
  return (
    <Image
      src="/LOGO.png"
      alt="Raghav Tailors Logo"
      width={100}
      height={100}
      className={cn("rounded-full", className)}
      data-ai-hint="logo"
      {...rest}
    />
  );
}
