import React from "react";
import styled from "styled-components";
import { Table } from "./Table";
import { WeeklyRanking } from "../Types/WeeklyRanking";
import { League } from "../Types/League";

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

export const RankingsBuilder: React.FunctionComponent<any> = (
  props: RankingsBuilderProps
) => {
  const rankings = props.ranking;
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
      },
    ],
    []
  );

  const updateTeams = (teamsArray) => {
    rankings.teams = teamsArray;
    props.updateRankingsObject(rankings);
  };

  const data = props.ranking.teams;
  console.log(props.ranking.teams);

  return (
    <Styles>
      <Table columns={columns} data={data} updateTeams={updateTeams} />
    </Styles>
  );
};
