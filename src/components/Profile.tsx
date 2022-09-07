import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import getUserMetadata from "../api/GetUserMetadata";
import updateUserMetadata from "../api/UpdateUserMetadata";
import { AddLeague } from "./AddLeague";
import { TeamRanking } from "../Types/TeamRanking";
import { League } from "../Types/League";
import { HStack, Spacer, Text } from "@chakra-ui/react";
import { createNewLeague } from "../api/LeaguesService";

export const Profile: React.FunctionComponent = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } =
    useAuth0();
  const [userMetadata, setUserMetadata] = useState(null);
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    getUserMetadata(getAccessTokenSilently, user).then((data) => {
      setUserMetadata(data);
      setLeagues(data["leagues"]);
    });
  }, [getAccessTokenSilently, user?.sub]);

  const addNewLeague = (league) => {
    console.log(league);
    createNewLeague(getAccessTokenSilently, user, league).then((response) => {
      const leaguesCopy = [...leagues];
      leaguesCopy.push(league.leagueId);
      setLeagues(leaguesCopy);
      updateUserMetadata(getAccessTokenSilently, user, leaguesCopy);
    });
  };
  if (isLoading) {
    return <div>Loading ...</div>;
  }
  console.log(leagues);

  return (
    <div>
      <img src={user?.picture} alt={user?.name} />
      <HStack>
        <h3>Username</h3>
        <h2>{user?.name}</h2>
      </HStack>
      <HStack>
        <h3>Email</h3>
        <p>{user?.email}</p>
      </HStack>
      <br />
      <Text>Leagues</Text>
      {leagues.map((league) => (
        <HStack key={league}>
          <Text>{league}</Text>
          <Spacer></Spacer>
          <Text>{league.length > 8 ? "Sleeper" : "ESPN"}</Text>
        </HStack>
      ))}
      <br />
      <br />
      <AddLeague onChange={addNewLeague} />
    </div>
  );
};

export default Profile;
