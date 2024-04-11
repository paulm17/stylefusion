import { css } from "@stylefusion/react";

const styles = css({
  base: "bg-blue-100 text-red-200"
})

function Server() {
  return <div className={styles}>hello server</div>
}

export default Server;