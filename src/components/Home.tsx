import React from "react";
import { Box, Button, HStack, Spacer } from "@chakra-ui/react";
import { Header } from "./Header";
import { RankingsDisplay } from "./RankingsDisplay";
import { RankingsBuilder } from "./RankingsBuilder";
import { DisplayTable } from "./downloadArea/DisplayTable";
import * as testData from "../api/testRankings.json";

export const Home: React.FunctionComponent<any> = (props) => {
  return (
    <Box>
      <Header />
      <HStack width={"100%"} height={"100%"}>
        <RankingsBuilder />
        {/*<RankingsDisplay />*/}
        <DisplayTable data={testData}></DisplayTable>
      </HStack>
    </Box>
  );
};
