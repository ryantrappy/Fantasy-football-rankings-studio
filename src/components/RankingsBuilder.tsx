import React from "react";
import styled from "styled-components";
import { Table } from "./Table";
import { Box, Button, HStack, Spacer } from "@chakra-ui/react";
import makeData from "../api/makeData";

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

export const RankingsBuilder: React.FunctionComponent<any> = (props) => {
  // Ranking
  // Team name
  // Record
  // Change from last week
  // Notes
  const columns = React.useMemo(
    () => [
      {
        Header: "Ranking",
        id: "index",
        accessor: (_row: any, i: number) => i + 1,
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Change",
        id: "change",
        accessor: (_row: any, i: number) => i - _row.ranking,
        // Cell: (row, i: number) => {
        //   return (
        //     <div>
        //       {row.row.id} {i}
        //     </div>
        //   );
        // },
      },
      {
        Header: "Notes",
        accessor: "notes",
      },
    ],
    []
  );

  const data = React.useMemo(() => makeData(8), []);

  return (
    <Styles>
      {/*<Button onClick={generateScreenshot}>Download Rankings Image</Button>*/}
      <Table columns={columns} data={data} />
      {/*<Box id="powerRanking" backgroundColor={"white"}>*/}
      {/*  Test rankings*/}
      {/*</Box>*/}
    </Styles>
  );
};
