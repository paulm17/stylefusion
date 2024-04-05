import { css } from "@stylefusion/react";

const styles = css({
  base: "font-bold text-blue-500"
})

const styles2 = css({
  base: "bg-red-200 z-1 text-green-200"
})

const styles3 = css({
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
