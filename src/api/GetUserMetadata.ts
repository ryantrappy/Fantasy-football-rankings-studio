export const getUserMetadata = async (getAccessTokenSilently, user) => {
  const domain = "dev-voqmvc1s.us.auth0.com";

  try {
    const accessToken = await getAccessTokenSilently({
      audience: `https://${domain}/api/v2/`,
      scope: "read:current_user",
    });

    const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user?.sub}`;

    const metadataResponse = await fetch(userDetailsByIdUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { user_metadata } = await metadataResponse.json();

    return user_metadata;
  } catch (e) {
    console.log(e.message);
  }
};
export default getUserMetadata;
