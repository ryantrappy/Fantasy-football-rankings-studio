import axios from "axios";

export const updateUserMetadata = async (
  getAccessTokenSilently,
  user,
  leaguesString
) => {
  const domain = "dev-voqmvc1s.us.auth0.com";
  const leaguesObject = JSON.parse(leaguesString);

  try {
    const accessToken = await getAccessTokenSilently({
      audience: `https://${domain}/api/v2/`,
      scope: "read:current_user",
    });
    const options = {
      method: "PATCH",
      url: `https://${domain}/api/v2/users/${user?.sub}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      data: {
        user_metadata: {
          leagues: leaguesObject,
        },
      },
    };
    return await axios.request(options);
  } catch (e) {
    console.log(e.message);
  }
};
export default updateUserMetadata;
