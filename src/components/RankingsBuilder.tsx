import React from "react";
import styled from "styled-components";
import { Table } from "./Table";
import { WeeklyRanking } from "../Types/WeeklyRanking";
import { League } from "../Types/League";
import { Input } from "@chakra-ui/react";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

export interface RankingsBuilderProps {
  ranking: WeeklyRanking;
  updateRankingsObject: (weeklyRanking: WeeklyRanking) => void;
}

const EditableCell = ({
  value: initialValue,
  row: row,
  column: { id },
  updateDescription, // This is a custom function that we supplied to our table instance
}) => {
  // We need to keep and update the state of the cell normally
  const [value, setValue] = React.useState(initialValue);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  // We'll only update the external data when the input is blurred
  const onBlur = () => {
    updateDescription(row.values["teamName"], id, value);
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return <Input value={value} onChange={onChange} onBlur={onBlur} />;
};

export const RankingsBuilder: React.FunctionComponent<any> = (
  props: RankingsBuilderProps
) => {
  const [teams, setTeams] = React.useState(props.ranking.teams);
  const [skipPageReset, setSkipPageReset] = React.useState(false);

  const rankings = props.ranking;
  const onChangeDescription = (value) => {
    console.log(value);
  };
  const columns = React.useMemo(
    () => [
      {
        Header: "Ranking",
        id: "index",
        accessor: (_row: any, i: number) => i + 1,
      },
      {
        Header: "Team Name",
        accessor: "teamName",
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: EditableCell,
      },
    ],
    []
  );

  const updateDescription = (teamName, columnId, value) => {
    // We also turn on the flag to not reset the page
    setSkipPageReset(true);
    setTeams((old) =>
      old.map((row) => {
        if (row.teamName === teamName) {
          return {
            ...old.find((cur) => cur.teamName === teamName),
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  const updateTeams = (teamsArray) => {
    rankings.teams = teamsArray;
    props.updateRankingsObject(rankings);
  };

  React.useEffect(() => {
    updateTeams(teams);
    setSkipPageReset(false);
  }, [teams]);

  return (
    <Styles>
      <Table
        columns={columns}
        data={teams}
        updateTeams={updateTeams}
        updateDescription={updateDescription}
        skipPageReset={skipPageReset}
      />
    </Styles>
  );
};
