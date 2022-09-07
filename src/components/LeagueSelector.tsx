import React from "react";
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { League } from "../Types/League";
export interface LeagueSelectorProps {
  onChange: (league: League) => void;
  leagues: League[];
}
export const LeagueSelector: React.FunctionComponent<LeagueSelectorProps> = (
  props: LeagueSelectorProps
) => {
  const handleLeagueChange = (e) => {
    const cur = props.leagues.find((obj) => obj.leagueName === e.target.value);
    props.onChange(cur);
  };

  return (
    <FormControl>
      <FormLabel>Select League</FormLabel>
      <HStack paddingBottom={"1vh"}>
        <Select placeholder="League Type" onChange={handleLeagueChange}>
          {props.leagues.map((league) => (
            <option key={league.leagueId}>{league.leagueName}</option>
          ))}
        </Select>
      </HStack>
    </FormControl>
  );
};
