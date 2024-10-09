import { styled } from '@stylefusion/react';

const Button = styled('button')({
  variants: [
    {
      props: { color: 'primary' },
      style: {
        color: 'tomato',
      },
    },
    {
      props: ({ ownerState }) => ownerState.color === 'secondary',
      style: {
        color: 'salmon',
      },
    },
  ],
});
