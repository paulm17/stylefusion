import { css } from "@stylefusion/react";

const styles = css({
  base: "font-bold"
})

export default function Page() {
  return (
    <div className={`bg-red-200 text-blue-500 ${styles}`} classNames={{
      "base": "z-10"
    }}>hello 2</div>
  );
}
