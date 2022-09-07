import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  useDisclosure,
  HStack,
  Heading,
} from "@chakra-ui/react";
import LoginButton from "./LoginButton";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./LogoutButton";
import Profile from "./Profile";
import getUserMetadata from "../api/GetUserMetadata";
import updateUserMetadata from "../api/UpdateUserMetadata";

export interface HeaderProps {
  updateValues: string;
}

export const MenuHeader: React.FunctionComponent<any> = (props) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [userMetadata, setUserMetadata] = useState(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      getUserMetadata(getAccessTokenSilently, user).then((data) => {
        setUserMetadata(data);
        setInput(JSON.stringify(data["leagues"]));
      });
    }
  }, [isAuthenticated, user?.sub]);

  return (
    <HStack>
      <Heading>Fantasy Power Rankings Generator</Heading>
      <Spacer />
      {!isAuthenticated && <LoginButton />}
      {isAuthenticated && (
        <>
          {/*<FormControl>*/}
          {/*  <FormLabel>Leagues</FormLabel>*/}
          {/*  /!*<Input value={input} onChange={handleInputChange} />*!/*/}
          {/*  /!*<Button onClick={updateUserMetadataSubmit}>Submit</Button>*!/*/}
          {/*</FormControl>*/}
          <Button onClick={onOpen}>Profile</Button>
          <LogoutButton />
        </>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Profile />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </HStack>
  );
};
