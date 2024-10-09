import path from 'node:path';
import { runTransformation, expect } from '../testUtils';

const theme = {
  palette: {
    mode: 'light',
    primary: {
      main: 'red',
    },
  },
  size: {
    font: {
      h1: '3rem',
    },
  },
  components: {
    MuiSlider: {
      styleOverrides: {
        rail: {
          fontSize: '1.5rem',
        },
      },
    },
  },
};

describe('Pigment CSS - styled', () => {
  it('basics', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled.input.js'),
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should work with theme', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-theme.input.js'),
      {
        themeArgs: {
          theme,
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should work with theme and rtl', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-rtl.input.js'),
      {
        themeArgs: {
          theme,
        },
        css: {
          defaultDirection: 'ltr',
          generateForBothDir: true,
          getDirSelector(dir) {
            return `:dir(${dir})`;
          },
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should work with variants', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-variants.input.js'),
      {
        themeArgs: {
          theme,
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should work with theme styleOverrides', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-theme-styleOverrides.input.js'),
      {
        themeArgs: {
          theme: {
            components: {
              MuiOutlinedInput: {
                styleOverrides: {
                  notchedOutline: {
                    border: 'none',
                  },
                },
              },
            },
          },
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should work with theme styleOverrides and variants', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-theme-styleOverrides2.input.js'),
      {
        themeArgs: {
          theme: {
            components: {
              MuiOutlinedInput: {
                styleOverrides: {
                  input: {
                    paddingLeft: 10,
                    variants: [
                      {
                        props: {
                          size: 'small',
                        },
                        style: {
                          padding: '9px 14.5px',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should replace the import paths to the ones specific in packageMap', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-import-replacement.input.js'),
      {
        packageMap: {
          '@stylefusion/react': '@mui/material-pigment-css',
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });

  it('should properly transform a pre-transform tagged-template styled call', async () => {
    const { output, fixture } = await runTransformation(
      path.join(__dirname, 'fixtures/styled-swc-transformed-tagged-string.input.js'),
      {
        themeArgs: {
          theme: {
            transitions: {
              easing: {
                easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
                easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
                easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
                sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
              },
              duration: {
                shortest: 150,
                shorter: 200,
                short: 250,
                standard: 300,
                complex: 375,
                enteringScreen: 225,
                leavingScreen: 195,
              },
            },
          },
        },
      },
    );

    expect(output.js).to.equal(fixture.js);
    expect(output.css).to.equal(fixture.css);
  });
});
