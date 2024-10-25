import { css } from '@stylefusion/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

const divCss = css({
  background: "green",
  color: "white",
  fontSize: "2rem",
  padding: "2rem",
})

function HomeComponent() {
  return (
    <>
      <div
        style={{
          padding: 40,
          display: 'flex',
          gap: '1rem',
          background: 'rgba(0, 0, 0, 0.05)',
          flexWrap: 'wrap',
        }}
      >        
        <div className={divCss}>Home</div>
      </div>
    </>
  );
}
