import React from "react";
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
} from "@chakra-ui/react";
import LoginButton from "./LoginButton";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./LogoutButton";
import Profile from "./Profile";

export const Header: React.FunctionComponent<any> = (props) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box>
      <span>Fantasy Power Rankings Generator</span>
      {/*<Spacer>Spacer</Spacer>*/}
      {/*<span style="padding-right: 5px">Hello*/}
      {/*<span *ngIf="user">{{user.email}}</span>*/}
      {/*<span *ngIf="!user">Guest</span>*/}
      {/*<Button >Logout</Button>*/}
      {!isAuthenticated && <LoginButton />}
      {isAuthenticated && (
        <>
          <Button onClick={onOpen}>Profile</Button>
          <LogoutButton />
        </>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
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
    </Box>
  );
};
