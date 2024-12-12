import { createFileRoute } from '@tanstack/react-router';
import { css } from "@stylefusion/react";

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

const div1 = css({
  backgroundColor: 'blue',
  color: 'red',
  fontWeight: 'bold'
});

function HomeComponent() {
  return (
    <div className={div1}>
      hello
    </div>
  );
}
