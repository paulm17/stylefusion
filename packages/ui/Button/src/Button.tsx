import React from "react";
import {css} from "@stylefusion/react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const styles1 = css({
  base: [
    "font-[20px]",
    "leading-[2]",
    "text-[orange]",
  ]
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button className={`${styles1} ${className}`} ref={ref}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };