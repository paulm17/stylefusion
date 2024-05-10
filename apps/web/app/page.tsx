import { css } from "@stylefusion/react";

const styles = css({
  base: {
    display: "block",
    color: "red",
    fontWeight: "bold",
  }
})

export default function Page() {
  return (
    <div className={styles}>
      hello
    </div>
  );
}
