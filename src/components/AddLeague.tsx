import React, { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
} from "@chakra-ui/react";
import { League } from "../Types/League";
export interface AddLeague {
  onChange: (league: League) => void;
}
export const AddLeague: React.FunctionComponent<any> = (props: AddLeague) => {
  const [leagueId, setLeagueId] = useState("");
  const [leagueType, setLeagueType] = useState(0);
  const handleLeagueIdChange = (e) => setLeagueId(e.target.value);

  const addLeague = () => {
    props.onChange({
      leagueId: leagueId,
      leagueType: leagueType,
    });
  };

  return (
    <FormControl>
      <FormLabel>Add League</FormLabel>
      <HStack paddingBottom={"1vh"}>
        <Input value={leagueId} onChange={handleLeagueIdChange} />
        <Select placeholder="League Type">
          <option value={0}>Sleeper</option>
          <option value={1}>ESPN</option>
        </Select>
      </HStack>

      <Button onClick={addLeague}>Add League</Button>
    </FormControl>
  );
};
