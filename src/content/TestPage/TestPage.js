import React from "react";

//import "@carbon/styles/css/styles.css";

//import "@carbon/charts/styles.css";
import { SimpleBarChart } from "@carbon/charts-react";

// IBM Plex should either be imported in your project by using Carbon
// or consumed manually through an import
//import "./ibm-plex-font.css";

export default function TestPage() {

  const stackedBarData = [
    {
      "group": "Qty",
      "value": 65000
    },
    {
      "group": "More",
      "value": 29123
    },
    {
      "group": "Sold",
      "value": 35213
    },
    {
      "group": "Restocking",
      "value": 51213
    },
    {
      "group": "Misc",
      "value": 16932
    }
  ];

const stackedBarOptions = {
    "title": "Vertical simple bar (discrete)",
    "axes": {
      "left": {
        "mapsTo": "value"
      },
      "bottom": {
        "mapsTo": "group",
        "scaleType": "labels"
      }
    },
    "height": "400px"
  }

return (
  <div className="App" style={{margin:'5rem'}}>
    <SimpleBarChart
      data={stackedBarData}
      options={stackedBarOptions}
    />
  </div>
);

}