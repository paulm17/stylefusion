import { css } from "@stylefusion/react";

const styles = css({
  root: {
    "--badge-color": "text-magnolia-200",
    "--badge-highlight": "bg-purple-200",
  },
  base: "font-bold text-blue-500"
})

const styles2 = css({
  root: {
    "--badge-bg": "text-magnolia-200"
  },
  base: "bg-red-200 z-1 text-green-200"
})

const styles3 = css({
  root: {
    "--badge-border": "text-magnolia-200"
  },
  base: "text-green-900"
})

export default function Page() {
  return (
    <>
      <div className={styles}>hello 2</div>
      <div className={styles2}>hello 3</div>
      <div className={`${styles3} data-[active]:font-bold`}>hello 4</div>
    </>
    
  );
}
