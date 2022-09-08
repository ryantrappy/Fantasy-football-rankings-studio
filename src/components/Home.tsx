import React, { useEffect, useRef, useState } from "react";
import { Box, HStack, Stack } from "@chakra-ui/react";
import { MenuHeader } from "./MenuHeader";
import { RankingsBuilder } from "./RankingsBuilder";
import { DisplayTable } from "./downloadArea/DisplayTable";
import * as testData from "../api/testRankings.json";
import * as previousRanking from "../api/testPreviousWeek.json";
import { WeeklyRanking } from "../Types/WeeklyRanking";
import { getLeagueTeams, populateLeagues } from "../api/LeaguesService";
import { useAuth0 } from "@auth0/auth0-react";
import { LeagueSelector } from "./LeagueSelector";
import { League } from "../Types/League";
import getUserMetadata from "../api/GetUserMetadata";
import { Team, TeamRanking } from "../Types/TeamRanking";
import { createNewRanking, updateRanking } from "../api/RankingsService";

export const Home: React.FunctionComponent<any> = (props) => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } =
    useAuth0();
  const [userMetadata, setUserMetadata] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState<League>();
  const [currentRanking, setCurrentRanking] = useState<WeeklyRanking>();
  const [teams, setTeams] = useState<Team[]>([]);
  const throttling = useRef(false);
  let currentWeek = 2;
  let rankings: Array<WeeklyRanking> = [];
  rankings.push(previousRanking);
  rankings.push(testData);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      getUserMetadata(getAccessTokenSilently, user).then((data) => {
        setUserMetadata(data);
        if (data) {
          console.log(data);
        }
        populateLeagues(getAccessTokenSilently, user, data["leagues"]).then(
          (result) => {
            console.log("populate", result);
            setLeagues(result);
          }
        );
      });
    }
  }, [getAccessTokenSilently, user?.sub]);

  useEffect(() => {
    generateRanking();
  }, [teams]);

  const handleDebounceCall = () => {
    //Clear the previous timeout.
    // if (throttling.current) {
    //   throttling.current;
    //   return;
    // }
    throttling.current = true;

    // If there is no search term, do not make API call
    if (currentRanking === undefined) {
      return;
    }
    throttling.current = true;
    setTimeout(() => {
      throttling.current = false;
      console.log("did save", currentRanking);
      updateRanking(getAccessTokenSilently, user, currentRanking).then((r) =>
        console.log(r)
      );
    }, 2000);
  };

  useEffect(() => {
    console.log("would save");
    handleDebounceCall();
  }, [currentRanking]);

  const generateRanking = (): void => {
    if (selectedLeague === undefined || currentRanking !== undefined) return;
    const ranking = new WeeklyRanking();
    ranking.leagueId = selectedLeague.leagueId;
    ranking.week = currentWeek;
    ranking.year = new Date().getFullYear();

    for (let i = 0; i < teams.length; i++) {
      const cur = new TeamRanking(teams[i]);
      ranking.teams.push(cur);
    }
    ranking.teams.sort((a, b) => {
      return a.position - b.position;
    });
    createNewRanking(getAccessTokenSilently, user, ranking).then(
      (createResponse) => {
        ranking._id = createResponse.data._id;
        setCurrentRanking(ranking);
      }
    );
  };

  const leagueChange = (league: League) => {
    setSelectedLeague(league);
    getLeagueTeams(
      getAccessTokenSilently,
      user,
      league.leagueId,
      "2022",
      0
    ).then((result) => {
      setTeams(result.data.data);
    });
  };

  const updateCurrentRanking = (rankingObject: WeeklyRanking) => {
    const rankingCopy = Object.assign({}, rankingObject);
    setCurrentRanking(rankingCopy);
  };

  return (
    <Box>
      <MenuHeader />
      <HStack width={"100%"} height={"100%"}>
        <Stack>
          {leagues && (
            <LeagueSelector
              onChange={leagueChange}
              leagues={leagues}
            ></LeagueSelector>
          )}
          {currentRanking && (
            <RankingsBuilder
              ranking={currentRanking}
              updateRankingsObject={updateCurrentRanking}
            />
          )}
        </Stack>
        {currentRanking && (
          <DisplayTable
            data={testData}
            currentWeek={currentWeek}
            leagueRankings={[currentRanking]}
            currentRanking={currentRanking}
          ></DisplayTable>
        )}
      </HStack>
    </Box>
  );
};
