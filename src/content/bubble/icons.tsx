export function Pin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      {...props}
    >
      <path
        fill="currentColor"
        d="M208 96a16 16 0 0 1-16 16h-4.28l-32.19 80.48a8 8 0 0 1-15.06 0L120.31 112H56a16 16 0 0 1-16-16V64a16 16 0 0 1 16-16h136a16 16 0 0 1 16 16Zm-29.41-32H73.41L96.2 128l21.21-53a8 8 0 0 1 15.18 0l21.21 53Z"
      />
    </svg>
  );
}

export function Close(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      {...props}
    >
      <path
        fill="currentColor"
        d="M208.49 191.51a12 12 0 0 1-17 17L128 145l-63.51 63.49a12 12 0 0 1-17-17L111 128L47.51 64.49a12 12 0 0 1 17-17L128 111l63.51-63.52a12 12 0 0 1 17 17L145 128Z"
      />
    </svg>
  );
}
