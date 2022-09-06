import { extendTheme } from "@chakra-ui/react";

const colors = {
  espn: {
    0: "#f2f2e8",
    25: "#f8f8f2",
    50: "#888",
    100: "#6dbb75",
    200: "#1d7225",
    300: "#225db7",
  },
};
export const theme = extendTheme({
  colors: colors,
  components: {
    Table: {
      variants: {
        striped: {
          thead: { tr: { background: colors.espn["100"] } },
          tbody: {
            tr: {
              background: colors.espn["25"],
              "&:nth-of-type(odd)": {
                background: colors.espn["0"],
                td: {
                  // background: mode(`${c}.100`, `${c}.700`)(props),
                },
              },
            },
          },
        },
      },
    },
  },
});
