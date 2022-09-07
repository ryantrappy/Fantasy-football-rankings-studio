const domain = "dev-voqmvc1s.us.auth0.com";
export const getUserInfo = async (getAccessTokenSilently, user) => {
  try {
    return await getAccessTokenSilently({
      audience: `https://${domain}/api/v2/`,
      scope: "read:current_user",
    });
  } catch (e) {
    console.log(e.message);
  }
};

export default getUserInfo;
