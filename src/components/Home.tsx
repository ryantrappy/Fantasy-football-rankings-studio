import React from "react";
import { Box, Button, HStack, Spacer } from "@chakra-ui/react";
import { Header } from "./Header";
import { RankingsDisplay } from "./RankingsDisplay";
import { RankingsBuilder } from "./RankingsBuilder";

export const Home: React.FunctionComponent<any> = (props) => {
  return (
    <Box>
      <Header />
      <HStack width={"100%"} height={"100%"}>
        <RankingsBuilder />
        <RankingsDisplay />
      </HStack>
    </Box>
  );
};
