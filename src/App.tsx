import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import "./App.css";
import { Home } from "./components/Home";
import { Auth0Provider } from "@auth0/auth0-react";

function App() {
  return (
    <Auth0Provider
      domain="dev-voqmvc1s.us.auth0.com"
      clientId="E8azhNaQOAsuhzGeTruCcDaqtdDTQYcW"
      redirectUri={window.location.origin}
      audience="https://dev-voqmvc1s.us.auth0.com/api/v2/"
      scope="read:current_user update:current_user_metadata"
    >
      <ChakraProvider>
        <Home />
      </ChakraProvider>
    </Auth0Provider>
  );
}

export default App;
