import { styled, css, keyframes, useTheme } from '@stylefusion/react';

const newDiv = css(({ theme, id }: any) =>({
  [`${id} > :where(img)`]: {
    objectFit: "cover",
  }, 
  color: theme.colors.primary,
  backgroundColor: 'orange',
  fontSize: '2rem',
})); 

export default function Home() {
  return (
    <div className={newDiv}>
      hello
      <img src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-5.png" />
    </div>
  );
}
