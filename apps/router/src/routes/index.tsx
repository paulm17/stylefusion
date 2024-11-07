import { css } from '@stylefusion/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

const divCss = css(({ theme }) => ({
  "--foo": "10px",
  background: "green",
  color: "lighten(#00ff89, 0.8)",
  fontSize: "2rem",
  padding: "2rem",

  ...theme.applyStyles("light", {
    "--input-disabled-bg": theme.colors.gray[1],
    "--input-disabled-color": theme.colors.gray[6],

    "&[data-variant='default']": {
      "--input-bd": theme.colors.gray[4],
      "--input-bg": theme.colors.white,
      "--input-bd-focus": "var(--raikou-primary-color-filled)",
    },

    "&[data-variant='filled']": {
      "--input-bd": "transparent",
      "--input-bg": theme.colors.gray[1],
      "--input-bd-focus": "var(--raikou-primary-color-filled)",
    },
  }),

  ...theme.applyMixin("hover", {
    "&:hover": {
      "--tab-bg": "var(--tab-hover-color)",
    },

    "&:hover:_where(:not([data-active]))": {
      borderColor: "var(--tab-border-color)",
    },
  }),
}))

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
