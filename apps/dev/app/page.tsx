import { css } from "@stylefusion/react";
import { Button } from "@acme/server";
import Box from "./components/Box";

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
  base: "bg-red-400 z-1 text-green-200"
})

const styles3 = css({
  root: {
    "--badge-border": "text-magnolia-200"
  },
  base: "text-green-900"
})

const root = css({
  base: "bg-green-900"
 })

const selector = `not-only-child:first:[&>.${root}]`

const style4 = css({
  [selector]: [
    "bg-green-500",
    "font-bold"
  ]
});

const foo = css({
  base: "bg-red-400 p-0"
})

const bar = css({
  layer: "upper",
  base: "bg-red-800 [padding:20px]"
})

const darkStyles = css({
  base: "bg-red-200",
  dark: "bg-green-800"
})

export default function Page() {
  return (
    <>
      <div className={darkStyles}>dark hello 1</div>
      <div className={styles}>hello 2</div>
      <div className={`${styles2}`}>hello 3</div>
      <div className={`${styles3} data-[active]:font-bold`} data-active>hello 4</div>
      <div className={style4}>
        <button className={root}>hello</button>
        <button className={root}>hello</button>
        <button className={root}>hello</button>
      </div>
      <div className={`${foo} ${bar}`}>foo</div>
      <Alert classNames={{
        root: { base: ["bg-green-100", "text-red-100"] },
        section: { base: ["z-1"] },
        label: { base: ["uppercase"] }
      }}>Alert</Alert>
      <Button>hello Button</Button>
      <Box />
    </>    
  );
}

interface alertProps {
  classNames?: any;
  children: React.ReactNode;
}

function Alert({ classNames, children }: alertProps) {
  const allClassNames = Object.keys(classNames!).map((key) => classNames![key]).join(" ");

  return (
    <div className={allClassNames}>{children}</div>
  )
}