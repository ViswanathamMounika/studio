import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      className="text-primary"
      fill="currentColor"
    >
      <path
        d="M208.1,128.1a7.9,7.9,0,0,1-8,8H56a8,8,0,0,1,0-16H200.1A7.9,7.9,0,0,1,208.1,128.1Z"
        opacity="0.2"
      ></path>
      <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,152H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm112-64H40a8,8,0,0,0,0,16H152a8,8,0,0,0,0-16Zm48-32a15.9,15.9,0,0,0-11.3,4.7l-45.3,45.2a8,8,0,0,0,11.4,11.4L192,72,154.8,34.8A16,16,0,1,0,132.2,57.4l40,40a8.1,8.1,0,0,0,11.4,0l48-48A16,16,0,0,0,200,56Z"></path>
    </svg>
  );
}

    