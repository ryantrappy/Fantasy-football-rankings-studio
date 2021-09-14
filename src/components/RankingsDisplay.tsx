import React from "react";
import { Box, Button, HStack, Spacer } from "@chakra-ui/react";
import * as htmlToImage from "html-to-image";

export const RankingsDisplay: React.FunctionComponent<any> = (props) => {
  const generateScreenshot = () => {
    const saveAs = (blob, fileName) => {
      const elem = window.document.createElement("a");
      elem.href = blob;
      elem.download = fileName;
      elem.style.display = "none";
      (document.body || document.documentElement).appendChild(elem);
      if (typeof elem.click === "function") {
        elem.click();
      } else {
        elem.target = "_blank";
        elem.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      }
      URL.revokeObjectURL(elem.href);
      elem.remove();
    };

    htmlToImage
      .toJpeg(document.getElementById("powerRanking"))
      .then(function (dataUrl) {
        saveAs(dataUrl, "ranking.jpeg");
      });
  };

  return (
    <Box>
      <Button onClick={generateScreenshot}>Download Rankings Image</Button>
      <Box id="powerRanking" backgroundColor={"white"}>
        Test rankings
      </Box>
    </Box>
  );
};
