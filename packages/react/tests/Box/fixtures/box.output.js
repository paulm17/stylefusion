import { sx as _sx } from '@stylefusion/react';
import Box from '@stylefusion/react/Box';
export function App(props) {
  return (
    <Box
      as="ul"
      aria-label={props.label}
      {..._sx(
        {
          className: 'bc1d15y',
          vars: {
            'bc1d15y-0': [props.color, false],
          },
        },
        {},
      )}
    >
      Hello Box
    </Box>
  );
}
