import React from "react";
import { Box, Button, HStack, Spacer } from "@chakra-ui/react";
import { Header } from "./Header";
import { RankingsDisplay } from "./RankingsDisplay";
import { RankingsBuilder } from "./RankingsBuilder";
import { DisplayTable } from "./downloadArea/DisplayTable";
import * as testData from "../api/testRankings.json";
import { LeagueConfig } from "../Types/LeagueConfig";

export const Home: React.FunctionComponent<any> = (props) => {
  // cookie: any;
  // user: IUser;

  const currentLeague = "";
  const currentYear = 2020;
  const weeks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  let currentWeek = 2;
  let leagueConfig: LeagueConfig;
  let newLeagueConfig: LeagueConfig = new LeagueConfig();
  let leagueConfigForm: LeagueConfig = new LeagueConfig();
  let leagues: { [key: string]: Array<LeagueConfig> } = {};

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
