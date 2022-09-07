import React from "react";
import styled from "styled-components";
import {
  TableContainer,
  Table,
  Td,
  Th,
  Tr,
  Tbody,
  Thead,
  Box,
  TableCaption,
  VStack,
} from "@chakra-ui/react";
import { TeamRanking } from "../../Types/TeamRanking";
import { WeeklyRanking } from "../../Types/WeeklyRanking";
import { League } from "../../Types/League";

const Styles = styled.div`
  /* Split the screen in half */
  .split {
    //height: 100%;
    //width: 50%;
    //position: fixed;
    z-index: 1;
    top: 0;
    //overflow-x: hidden;
    padding-top: 20px;
  }

  /* Control the left side */
  .left {
    left: 0;
  }

  /* Control the right side */
  .right {
    right: 0;
    border-left: 1px solid black;
  }

  /* If you want the content centered horizontally and vertically */
  .centered {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  /* Style the image inside the centered container, if needed */
  .centered img {
    width: 150px;
    border-radius: 50%;
  }

  #rankingIntroduction {
    width: 50%;
    height: 10em;
    word-wrap: break-word;
    word-break: break-all;
  }

  #powerRanking {
    //width: 650px;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    border: 1px solid white;
    border-radius: 3px;
    font: normal 10px verdana;
  }
  #powerRanking table {
    border: 0px solid black;
    font-size: 12px;
    //width: 100%;
    border-collapse: collapse;
  }
  #powerRanking table Tr {
    background-color: #f8f8f2;
  }
  #powerRanking table Tr:nth-child(odd) {
    background-color: #f2f2e8;
  }
  #powerRanking table Tr:nth-child(3) {
    background-color: #6dbb75;
  }
  #powerRanking table Tr:first-child {
    //width: 500px;
    background-color: #1d7225;
    color: white;
    text-align: center;
  }
  Th {
    border-radius: 3px 3px 0px 0px;
  }
  #powerRanking table Th h3 {
    margin: 0px;
  }
  Tr.rank {
    height: 60px;
    vertical-align: middle;
  }
  Tr.rank Td:first-child {
    font-size: 20px;
    text-align: center;
    vertical-align: middle;
    width: 10%;
  }
  .ranking {
    border-radius: 50px;
    color: white;
    padding: 0px;
    margin: auto;
  }
  Tr.rank Td:nth-child(2) {
    width: 100px;
    vertical-align: middle;
    text-align: center;
    display: inline-block;
  }
  Tr.rank Td:nth-child(3) {
    width: 10%;
    vertical-align: middle;
  }
  Tr.rank Td:nth-child(4) {
    width: 15%;
    vertical-align: middle;
  }
  Tr.rank Td:nth-child(5) {
    width: 55%;
    vertical-align: middle;
    font-size: 10px;
    padding-left: 5px;
    padding-right: 5px;
  }
  .teamPicture {
    height: 100%;
    display: table-cell;
    padding: 5px 10px;
  }
  .teamPicture img {
    position: relative;
    max-width: 65px;
    height: 55px;
    vertical-align: middle;
    object-fit: cover;
    border-radius: 10px;
  }
  .manager-name {
    font-size: 13px;
    white-space: nowrap;
    top: -5px;
    position: relative;
  }
  .manager-name a {
    text-decoration: none !important;
    color: #225db7 !important;
  }
  .team-record {
    color: #888;
  }
  .up {
    border-bottom: 8px solid green;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    width: 0px;
    position: relative;
    left: 17px;
    top: 6px;
  }
  .down {
    border-top: 8px solid red;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    width: 0px;
    position: relative;
    top: 7px;
    left: 17px;
  }
  .no-change {
    border-top: 8px solid transparent;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
  }
  .delta-div {
    position: relative;
    right: -5px;
  }
  .delta {
    width: 25px;
    position: relative;
    font-size: 17px;
    line-height: 20px;
    top: -9px;
    left: 26px;
  }
  .delta-up {
    color: green;
  }
  .delta-down {
    color: red;
  }
  .last-weeks-position {
    color: #888;
    font-size: 10px;
    top: -5px;
    position: relative;
  }
  .center {
    text-align: center;
  }
  .manager-name-under-team {
    font-size: 10px;
    padding-top: 2px;
    padding-bottom: 2px;
    white-space: nowrap;
  }
  .team-name {
    white-space: nowrap;
    font-weight: bold;
    font-size: 11px;
  }
  .download-button {
    margin: 0 auto;
    display: block;
  }
`;

export interface DisplayTableProps {
  data: any;
  leagueRankings: WeeklyRanking[];
  currentRanking: WeeklyRanking;
  currentWeek: number;
}

export const DisplayTable = (props: DisplayTableProps) => {
  const { leagueRankings, data, currentWeek, currentRanking } = props;

  const currentYear = new Date().getFullYear();
  const getPreviousWeekPosition = (id: number) => {
    // tslint:disable-next-line:triple-equals
    const previousWeek = leagueRankings.find(
      (cur) => cur.year == currentYear && cur.week === currentWeek - 1
    );
    if (!previousWeek) {
      return undefined;
    }
    return (
      previousWeek.teams.findIndex((element) => {
        return element.teamId === id;
      }) + 1
    );
  };
  const getLastWeekPositionString = (id: number) => {
    const lastWeeksRanking = getPreviousWeekPosition(id);
    return lastWeeksRanking ? "Last Week: " + lastWeeksRanking : "";
  };

  const getDeltaSymbolClass = (rankingObject: TeamRanking, i: number) => {
    const delta = getDelta(rankingObject, i);
    if (delta < 0) {
      return "up";
    } else if (delta > 0) {
      return "down";
    } else {
      return "no-change";
    }
  };
  const getDelta = (rankingObject: TeamRanking, i: number): number => {
    let delta = 0;
    i++;
    const prev = getPreviousWeekPosition(rankingObject.teamId);
    if (prev === undefined) {
      delta = 0;
    } else {
      delta = i - getPreviousWeekPosition(rankingObject.teamId);
    }
    return delta;
  };

  const getDeltaClass = (rankingObject: TeamRanking, i: number) => {
    const delta = getDelta(rankingObject, i);
    if (delta < 0) {
      return "delta-up";
    } else if (delta > 0) {
      return "delta-down";
    } else {
      return "";
    }
  };

  const getDeltaString = (rankingObject: TeamRanking, i: number) => {
    const delta = getDelta(rankingObject, i);
    if (delta === 0) {
      return "---";
    } else if (delta < 0) {
      return -delta;
    } else {
      return delta;
    }
  };

  const getRankingImage = () => {
    let circleWidth = 60;
    let circleCount = 0;
    let circleMid = currentRanking.teams.length / 2;
    let circleChild = 4;
    let resultString = "";
    currentRanking.teams.forEach((ranking) => {
      console.log(circleMid, circleCount, circleChild, circleWidth);
      let backgroundColor = circleCount < circleMid ? "#1D7225;" : "firebrick;";
      resultString =
        resultString + "tr.rank:nth-child(" + circleChild + ") .ranking {";
      resultString = resultString + "  background: " + backgroundColor;
      resultString = resultString + "  width: " + circleWidth + "px;";
      resultString = resultString + "  height: " + circleWidth + "px;";
      resultString = resultString + "  line-height: " + circleWidth + "px;";
      resultString = resultString + "}";
      if (circleCount === circleMid - 1) {
      } else if (circleCount < circleMid) {
        circleWidth = circleWidth - 5;
      } else {
        circleWidth = circleWidth + 5;
      }
      circleCount++;
      circleChild++;
    });
    resultString = resultString + "";

    const head = document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(resultString));
    head.appendChild(style);
  };

  // generateScreenshot() {
  //   html2canvas(document.getElementById("powerRanking"),
  //       {
  //         width: "fit-content",
  //         allowTaint: true,
  //         scale: 2,
  //         dpi: 300
  //       }).then(function(canvas) {
  //     canvas.toBlob((blob) => {
  //       fileSaver.saveAs(blob, "rankings.png");
  //       window.alert('Saved Power Rankings');
  //     });
  //   });
  // }

  const getRecord = (rankingObject: TeamRanking) => {
    return (
      rankingObject.wins + "-" + rankingObject.loss + "-" + rankingObject.ties
    );
  };

  return (
    <>
      <Styles>
        <VStack>
          <TableContainer>
            <Box
              className="center"
              backgroundColor="espn.200"
              color={"white"}
              width={"100%"}
            >
              <h3 id="rankingTitle1">{currentRanking.rankingsTitle}</h3>
            </Box>
            <Table id="powerRankingTable1" variant={"striped"}>
              <TableCaption placement={"top"}>
                {currentRanking.introduction}
              </TableCaption>
              <Thead>
                <Tr>
                  <Td className="center">
                    <b>Rank</b>
                  </Td>
                  <Td colSpan={2} className="center">
                    <b>Team / Record</b>
                  </Td>
                  <Td className="center">
                    <b>Trending</b>
                  </Td>
                  <Td className="center">
                    <b>Comments</b>
                  </Td>
                </Tr>
              </Thead>
              <Tbody>
                {/**ngFor="let rankingObject of currentRanking.teams; index as i ">*/}
                {currentRanking.teams.map((rankingObject: TeamRanking, i) => (
                  <Tr className="rank1" key={rankingObject.teamName}>
                    <Td>
                      <div className="ranking1">{i + 1}</div>
                    </Td>
                    <Td
                      className="teamPicture1"
                      // style={{ width: "25px" }}
                    ></Td>
                    <Td>
                      <div className="manager-name1">
                        {rankingObject.teamName}
                      </div>
                      <div className="team-record1">
                        {rankingObject.managerName}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        {getRecord(rankingObject)}
                      </div>
                    </Td>
                    <Td className="center">
                      <div>
                        <div className="delta-div1">
                          <div
                            className={getDeltaSymbolClass(rankingObject, i)}
                          ></div>
                          <div className={getDeltaClass(rankingObject, i)}>
                            {getDeltaString(rankingObject, i)}
                          </div>
                          {/*  <div*/}
                          {/*  className={getDeltaClass(*/}
                          {/*    getPreviousWeekPosition(rankingObject.managerName)*/}
                          {/*      ? i -*/}
                          {/*          getPreviousWeekPosition(*/}
                          {/*            rankingObject.managerName*/}
                          {/*          )*/}
                          {/*      : 0*/}
                          {/*  )}*/}
                          {/*></div>*/}
                        </div>
                        <div className="last-weeks-position">
                          {getLastWeekPositionString(rankingObject.teamId)}{" "}
                        </div>
                      </div>
                    </Td>
                    <Td
                      className="center"
                      // style={{ width: "50%" }}
                    >
                      {rankingObject.description}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </VStack>
        {/*  </div>*/}
        {/*</div>*/}
      </Styles>
    </>
  );
};
// <TableContainer>
//         <Table id="powerRankingTable" variant={"striped"}>
//           <Thead>
//             <Tr>
//               <Th colSpan={5}>
//                 <h3 id="rankingTitle">{leagueConfig.rankingsTitle}</h3>
//               </Th>
//             </Tr>
//           </Thead>
//
//           <Thead>
//             <Tr id="introduction">
//               {/*[hidden]="leagueConfig.introduction > 0">*/}
//               <Th id="introductionRow">{leagueConfig.introduction}</Th>
//             </Tr>
//             <Tr>
//               <Td className="center">
//                 <b>Rank</b>
//               </Td>
//               <Td colSpan={2} className="center">
//                 <b>Team / Record</b>
//               </Td>
//               <Td className="center">
//                 <b>Trending</b>
//               </Td>
//               <Td className="center">
//                 <b>Comments</b>
//               </Td>
//             </Tr>
//           </Thead>
//           <Tbody>
//             {/**ngFor="let rankingObject of currentRanking.teams; index as i ">*/}
//             {currentRanking.teams.map((rankingObject, i) => (
//               <Tr className="rank" key={rankingObject.teamName}>
//                 <Td>
//                   <div className="ranking">{i + 1}</div>
//                 </Td>
//                 <Td className="teamPicture" style={{ width: "25px" }}></Td>
//                 <Td style={{ width: "20%" }}>
//                   <div className="manager-name">{rankingObject.teamName}</div>
//                   <div className="team-record">
//                     {rankingObject.managerName}
//                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
//                     {getRecord(rankingObject)}
//                   </div>
//                 </Td>
//                 <Td className="center">
//                   <div className="delta-div">
//                     <div />
//                     {/*[ngClass]='getDeltaSymbolClass (getPreviousWeekPosition(rankingObject.managerName) ? i -*/}
//                     {getPreviousWeekPosition(rankingObject.managerName)}
//                   </div>
//                   <div className="delta">
//                     {/*    [ngClass]='getDeltaClass(getPreviousWeekPosition(rankingObject.managerName) ? i -*/}
//                     {/*    getPreviousWeekPosition(rankingObject.managerName) : 0)'> {{*/}
//                     {/*    getDeltaString(getPreviousWeekPosition) {*/}
//                     {/*    }*/}
//                     {/*}(rankingObject.managerName) ? i - getPreviousWeekPosition(rankingObject.managerName) : 0})}}*/}
//                     2
//                   </div>
//                   <div className="last-weeks-position">
//                     {/*{{*/}
//                     {/*getLastWeekPositionString(rankingObject) {*/}
//                     {/*},: .managerName}})}} */}4
//                   </div>
//                 </Td>
//                 <Td
//                   className="center"
//                   // style={{ width: "50%" }}
//                 >
//                   {rankingObject.description}
//                 </Td>
//               </Tr>
//             ))}
//           </Tbody>
//         </Table>
//
//         {/*</div>*/}
//         {/*    <div style={{height: "5vh"}}></div>*/}
//         {/*    <div style={{width: "100%"}}>*/}
//         {/*        <button*/}
//         {/*        /!*(click)="generateScreenshot()" className="download-button"*!/*/}
//         {/*        >Download Rankings Image</button>*/}
//         {/*</div>*/}
//       </TableContainer>

//<div className="split left">
//               <ng-container>
//                   <label for="leagueName">
//                       League Name
//                   </label>
//                   <input id="leagueName" type="text"/> [(ngModel)]="leagueConfigForm.leagueName">
//               </ng-container>
//               <br>
//                   <ng-container>
//                       <label for="rankingsTitle">
//                           Rankings Title
//                       </label>
//                       <input id="rankingsTitle" type="text"/> [(ngModel)]="leagueConfigForm.rankingsTitle">
//                   </ng-container>
//                   <br>
//                       <ng-container>
//                           <span>Rankings Introduction</span>
//                           <textarea name="text" rows="14" cols="10" wrap="soft" id="rankingIntroduction"/>[(ngModel)]="leagueConfigForm.introduction">
//                       </textarea>
//                   </ng-container>
//                   <table>
//                       <Td>Team Name</Td>
//                       <Td>Comments</Td>
//                       <ng-container/>
//                       *ngFor="let rankingObject of currentRanking.teamsForm; index as i ">
//                       <Tr>
//                           <Td><input id="teamName" type="text"/> [(ngModel)]="currentRanking.teamsForm[i].teamName"></Td>
//                           <Td><input id="description" type="text"/> [(ngModel)]="currentRanking.teamsForm[i].description">
//                           </Td>
//                       </Tr>
//                   </ng-container>
//               </table>
//
//               <button className="button" type="submit"/>
//               (click)="regenerateRankings()">Generate Rankings
//           </button>
//       </div>
