import { expect } from 'chai';
import { matchAdapterPath } from '@stylefusion/react/utils';

describe('matchAdapterPath', () => {
  it('should match adapter path', () => {
    expect(matchAdapterPath('../zero-styled')).to.equal(true);
    expect(matchAdapterPath('../zero-styled/index.js')).to.equal(true);
  });
});
