import { css } from "@stylefusion/react";

const styles = css({
  base: "bg-blue-100 text-black"
})

function Box() {
  return <div className={styles}>hello world</div>
}

export default Box;