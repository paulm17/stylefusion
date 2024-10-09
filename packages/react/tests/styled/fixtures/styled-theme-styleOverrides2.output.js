import { styled as _styled } from '@stylefusion/react';
import _theme from '@stylefusion/react/theme';
const OutlinedInputInput = /*#__PURE__*/ _styled('input', {
  name: 'MuiOutlinedInput',
  slot: 'Input',
})({
  classes: ['o1ei225m', 'o1ei225m-5'],
  variants: [
    {
      props: {
        size: 'small',
      },
      className: 'o1ei225m-1',
    },
    {
      props: ({ ownerState }) => ownerState.multiline,
      className: 'o1ei225m-2',
    },
    {
      props: ({ ownerState }) => ownerState.startAdornment,
      className: 'o1ei225m-3',
    },
    {
      props: ({ ownerState }) => ownerState.endAdornment,
      className: 'o1ei225m-4',
    },
    {
      props: {
        size: 'small',
      },
      className: 'o1ei225m-6',
    },
  ],
});
