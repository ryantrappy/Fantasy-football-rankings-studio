import getUserToken from "./GetUserToken";
import axios from "axios";

const domain = "http://localhost:3000";

export const getLeagueInfo = async (
  getAccessTokenSilently,
  user,
  leagueId,
  season
) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);

  const options = {
    method: "GET",
    url: `${domain}/leagues/${leagueId}/seasons/${season}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  };
  return await axios.request(options);
};

export const getLeagueTeams = async (
  getAccessTokenSilently,
  user,
  leagueId,
  season,
  scoringPeriodId
) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);

  const options = {
    method: "GET",
    url: `https://${domain}/leagues/${leagueId}/seasons/${season}/weeks/${scoringPeriodId}/teams`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  };
  return await axios.request(options);
};

export const createNewLeague = async (
  getAccessTokenSilently,
  user,
  leagueObject
) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);

  const options = {
    method: "GET",
    url: `https://${domain}/leagues`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    data: leagueObject,
  };
  return await axios.request(options);
};
