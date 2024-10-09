import { css } from '@stylefusion/react';

const cls1 = css`
  color: ${({ theme }) => theme.palette.primary.main};
  font-size: ${({ theme }) => theme.size.font.h1};
`;
