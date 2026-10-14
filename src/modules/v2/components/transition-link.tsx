"use client";
import Link from "next/link";
import { transition } from "./shell";

type Props = React.ComponentProps<typeof Link> & { href: string };

export default function TransitionLink({ href, onClick, ...props }: Props) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        transition.go(href);
      }}
      {...props}
    />
  );
}
