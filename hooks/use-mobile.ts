import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // 1. Initialize state immediately using a lazy initializer function
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Guard for Server-Side Rendering (SSR) environments like Next.js
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      // Use the media query event's matches property for accuracy
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);

    // 2. Remove the synchronous setIsMobile call that was here!

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

// import * as React from "react"

// const MOBILE_BREAKPOINT = 768

// export function useIsMobile() {
//   const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

//   React.useEffect(() => {
//     const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
//     const onChange = () => {
//       setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
//     }
//     mql.addEventListener("change", onChange)
//     setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
//     return () => mql.removeEventListener("change", onChange)
//   }, [])

//   return !!isMobile
// }
