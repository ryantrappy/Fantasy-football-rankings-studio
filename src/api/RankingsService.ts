import getUserToken from "./GetUserToken";
import axios from "axios";
import { WeeklyRanking } from "../Types/WeeklyRanking";

const domain = "http://localhost:3000";

export const getRankingById = async (getAccessTokenSilently, user, rankId) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);

  const options = {
    method: "GET",
    url: `${domain}/rankings/${rankId}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  };
  return await axios.request(options);
};

export const getRankingByLeagueId = async (
  getAccessTokenSilently,
  user,
  leagueId
) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);
  console.log(`${domain}}/rankings/leagues/${leagueId}`);
  const options = {
    method: "GET",
    url: `${domain}/rankings/leagues/${leagueId}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  };
  return await axios.request(options);
};

export const createNewRanking = async (
  getAccessTokenSilently,
  user,
  rankingObject
) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);

  const options = {
    method: "POST",
    url: `${domain}/rankings`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    data: rankingObject,
  };
  return await axios.request(options);
};

export const updateRanking = async (
  getAccessTokenSilently,
  user,
  rankingObject: WeeklyRanking
) => {
  const accessToken = await getUserToken(getAccessTokenSilently, user);

  const options = {
    method: "PUT",
    url: `${domain}/rankings/${rankingObject._id}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    data: rankingObject,
  };
  return await axios.request(options);
};
