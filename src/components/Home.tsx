import React, { useEffect } from "react";
import { Box, Button, HStack, Spacer } from "@chakra-ui/react";
import { Header } from "./Header";
import { RankingsDisplay } from "./RankingsDisplay";
import { RankingsBuilder } from "./RankingsBuilder";
import { DisplayTable } from "./downloadArea/DisplayTable";
import * as testData from "../api/testRankings.json";
import * as previousRanking from "../api/testPreviousWeek.json";
import { WeeklyRanking } from "../Types/WeeklyRanking";
import { getLeagueInfo } from "../api/LeaguesService";
import { useAuth0 } from "@auth0/auth0-react";

export const Home: React.FunctionComponent<any> = (props) => {
  // cookie: any;
  // user: IUser;
  let leagueConfig;

  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const currentLeague = "";
  const currentYear = 2022;
  const weeks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  let currentWeek = 2;
  let newLeagueConfig: WeeklyRanking = new WeeklyRanking();
  let leagueConfigForm: WeeklyRanking = new WeeklyRanking();
  let rankings: Array<WeeklyRanking> = [];
  rankings.push(previousRanking);
  rankings.push(testData);
  //getLeagueInfo

  useEffect(() => {
    getLeagueInfo(
      getAccessTokenSilently,
      user,
      "788542563794681856",
      2022
    ).then((r) => (leagueConfig = r.data.data));
  }, []);

  return (
    <Box>
      <Header />
      <HStack width={"100%"} height={"100%"}>
        <RankingsBuilder />
        {/*<RankingsDisplay />*/}
        <DisplayTable
          data={testData}
          currentLeague={currentLeague}
          currentWeek={currentWeek}
          leagueConfig={leagueConfig}
          leagueRankings={rankings}
          currentRanking={testData}
        ></DisplayTable>
      </HStack>
    </Box>
  );
};
