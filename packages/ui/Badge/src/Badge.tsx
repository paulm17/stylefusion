import React from "react";
import {css} from "@stylefusion/react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const styles1 = css({
  base: [
    "font-size-[40px]",
    "leading-[4]",
    "text-[green]",
  ]
});

const Badge = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button className={`${styles1} ${className}`} ref={ref}>
        {children}
      </button>
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
