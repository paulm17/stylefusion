import { styled, keyframes } from '@stylefusion/react';
import PropTypes from 'prop-types';

const rotateKeyframe = keyframes({
  from: {
    transform: 'rotate(360deg)',
  },
  to: {
    transform: 'rotate(0deg)',
  },
});

const Component = styled.div(({ theme }) => ({
  color: (theme.vars ?? theme).palette.primary.main,
  animation: `${rotateKeyframe} 2s ease-out 0s infinite`,
}));

const SliderRail = styled('span', {
  name: 'MuiSlider',
  slot: 'Rail',
})`
  display: block;
  position: absolute;
  border-radius: inherit;
  background-color: currentColor;
  opacity: 0.38;
  font-size: ${({ theme }) => (theme.vars ?? theme).size.font.h1};
`;

const SliderRail2 = styled.span`
  display: block;
  opacity: 0.38;
  font-size: ${({ theme }) => (theme.vars ?? theme).size.font.h1};
  ${SliderRail} {
    display: none;
  }
`;

export function App() {
  return (
    <Component>
      <SliderRail />
      <SliderRail2 />
    </Component>
  );
}

process.env.NODE_ENV !== 'production'
  ? (App.propTypes = {
      children: PropTypes.element,
    })
  : void 0;

process.env.NODE_ENV !== 'production' ? (App.muiName = 'App') : void 0;

const OutlinedInputInput = styled(InputBaseInput, {
  name: 'MuiOutlinedInput',
  slot: 'Input',
  overridesResolver: inputBaseInputOverridesResolver,
})(({ theme }) => ({
  padding: '16.5px 14px',
  ...(!theme.vars && {
    '&:-webkit-autofill': {
      WebkitBoxShadow: theme.palette.mode === 'light' ? null : '0 0 0 100px #266798 inset',
      WebkitTextFillColor: theme.palette.mode === 'light' ? null : '#fff',
      caretColor: theme.palette.mode === 'light' ? null : '#fff',
      borderRadius: 'inherit',
    },
  }),
}));

const Component2 = styled.div(({ theme }) =>
  theme.palette.mode === 'light'
    ? null
    : {
        backgroundColor: theme.palette.primary.main,
      },
);
