import type { SVGProps } from "react";

export function CompoundCanvasMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M25 9h14" />
        <path d="M25 9h-5" />
        <path d="M39 9h5" />
        <path d="M21.5 9v12.5L9.5 42.5C5.5 49.5 10.4 58 18.5 58h27c8.1 0 13-8.5 9-15.5l-12-21V9" />
        <path d="M34 24.5a9.5 9.5 0 1 0 0 15" />
        <path d="M43 31.5a9.5 9.5 0 1 0 0 15" />
      </g>
      <circle cx="40.5" cy="22.5" r="3.2" fill="currentColor" />
      <circle cx="46.5" cy="29" r="2.2" fill="currentColor" />
      <circle cx="50.5" cy="34.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
