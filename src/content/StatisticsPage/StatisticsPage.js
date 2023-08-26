import React, { useState, useEffect, useRef } from 'react'
import * as FileSaver from 'file-saver';
import * as XLSX from "xlsx";
import { w3cwebsocket } from "websocket";
import {
  Button,
  ComboBox,
  Content,
  ContentSwitcher,
  DataTable,
  InlineLoading,
  Modal,
  Switch,
  Table,
  TableHead,
  TableHeader,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableCell,
  TableBody,
  TableRow,
  TableContainer
} from '@carbon/react';
import { DocumentExport, Renew, Share } from '@carbon/react/icons';
import { SimpleBarChart } from "@carbon/charts-react";

const rankHeaders = [
  {key:'rank', header:'Rank'},
  {key:'ideaId', header:'Idea ID'},
  {key:'ideaDescription', header:'Idea Description'},
  {key:'totalScore', header:'Total Priority Score'},
  {key:'averageScore', header:'Average Priority Score'}
];

const voteHeaders = [
  {key:'ideaId', header:'Idea ID'},
  {key:'ideaDescription', header:'Idea Description'},
  {key:'participantName', header:'Participant Name'},
  {key:'office', header:'Office'},
  {key:'voteValue', header:'Vote Value'}
];

export default function StatisticsPage() {

  
  const chartDataRef = useRef(null);
  const selectedOffice = useRef();
  const errorInfo = useRef({heading:"", message:""});
  const sharedChart = useRef();

  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [showRankTable, setShowRankTable] = useState('block');
  const [showCharts, setShowCharts] = useState('none');
  const [showByOffice, setShowByOffice] = useState('none');
  const [offices, setOffices] = useState([]);
  const [selectedChart, setSelectedChart] = useState("start");
  const [comboBoxInvalid, setComboBoxInvalid] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({
    "title": "Select Rank Segment",
        "axes": {
          "left": {
            "mapsTo": "group",
            "scaleType": "labels",
            "truncation": {
              "type": "end_line",
              "threshold": 56,
              "numCharacter": 56
            }
          },
          "bottom": {"mapsTo":"value"},
          "legend": {"enabled":false},
        }
  });
  const [domainList, setDomainList] = useState([]);
  const [exportButtonDisplay, setExportButtonDisplay] = useState('none');
  const [exportLoading, setExportLoading] = useState('none');
  const [ideas, setIdeas] = useState([]);
  const [ideaRankings, setIdeaRankings] = useState(
    [
      {
        id:"0",
        rank:"-",
        ideaId:"-",
        ideaDescription:"-",
        totalScore:"-",
        averageScore:"-"
      }
    ]
  );
  const [voteData, setVoteData] = useState(
    [
      {
        id:"0",
        ideaId:"-",
        name:"-",
        office:"-",
        voteVaue:"-"
      }
    ]
  );

  useEffect(() => {GetIdeas();},[]);
  useEffect(() => {
    UpdateStatTable();
    UpdateChart();
  },[ideas]);
  useEffect(() => {UpdateChart()},[selectedChart]);

  async function GetIdeas() {
    const ideasRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const ideasResponse = await ideasRequest.json();
    if (ideasResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${ideasResponse.code}`, message:ideasResponse.message}
      setModalErrorOpen(true);
      return;
    }
    if (ideasResponse.code === 200) {
      const ideaList = ideasResponse.data.rows.map((idea, index) => {
        return {
          "id":String(index+1),
          "rank":0,
          "ideaId": idea.ideaid,
          "ideaDescription": idea.ideadescription,
          "ideadomaincolorhex":idea.ideadomaincolorhex,
          "totalScore":0
        };
      });
      setIdeas(ideaList);
    }
  }

  async function UpdateStatTable() {

    const votesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const votesResponse = await votesRequest.json();
    if (votesResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${votesResponse.code}`, message:votesResponse.message}
      setModalErrorOpen(true);
      return;
    }
    if (votesResponse.code === 200) {
      //create hashmap of ideas and total scores.
      let votesHashmap = {};
      let objVoteCount = {};
      
      votesResponse.data.forEach((item) => {
        //omit any 0 values from the calculation. This prevents abstain votes from skewing the average down.
        if(item.votevalue !== 0) {
          if (item.voteideaid in votesHashmap) {
            votesHashmap[item.voteideaid] = votesHashmap[item.voteideaid] + item.votevalue;
            objVoteCount[item.voteideaid]++;
          }
          else {
            votesHashmap[item.voteideaid] = item.votevalue;
            objVoteCount[item.voteideaid] = 1;
          }  
        }
      });

      //update state with score values of voteshashmap
      const ideaList = ideas.map(idea => {
        let average = (votesHashmap[idea.ideaId]/objVoteCount[idea.ideaId]).toFixed(2);
        if (isNaN(average)) average = 0;
        return {
          "id":idea.id,
          "rank":0,
          "ideaId":idea.ideaId,
          "ideaDescription":idea.ideaDescription,
          "totalScore":votesHashmap[idea.ideaId],
          "averageScore":average,
          "ideadomaincolorhex":idea.ideadomaincolorhex
        }
      });

      //sort highest score to lowest
      ideaList.sort((a, b) => b.averageScore - a.averageScore);
      //set rank order value based on previous sorting
      for (let i=0;i<ideaList.length;i++){ideaList[i].rank = i+1}
      setIdeaRankings(ideaList);
    }
  }

  async function ExportExcel() {
    //get most recent rankings before exporting.
    setExportLoading('flex');
    UpdateStatTable();

    const participantResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const participantList = await participantResponse.json();
    const objParticipants = participantList.data.rows.map(participant => {
      return {
        "Participant ID":participant.participantid,
        "Title":participant.participanttitle,
        "First Name":participant.participantfname,
        "Last Name":participant.participantlname,
        "Office":participant.officename
      }
    });

    const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const voteResponse = await voteRequest.json();
    if (voteResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${voteResponse.code}`, message:voteResponse.message}
      setModalErrorOpen(true);
      return;
    };
    const objVotes = voteResponse.data.map(vote => {
      return {
        "Vote ID":vote.voteid,
        "Idea ID":vote.voteideaid,
        "Participant ID":vote.participantid,
        "Participant Office":vote.officename,
        "Vote Value":vote.votevalue
      };
    });
    
    const objRankings = ideaRankings.map(idea => {
      return {
        "Rank":idea.rank,
        "Idea ID":idea.ideaId,
        "Idea Description":idea.ideaDescription,
        "Total Priority Score":idea.totalScore,
        "Average Priority Score":idea.averageScore
      }
    });
    
    const logsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/changelogs/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const logsResponse = await logsRequest.json();
    if (logsResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${logsResponse.code}`, message:logsResponse.message}
      setModalErrorOpen(true);
      return;
    }
    const objLogs = logsResponse.data.rows.map(log => {
      return {
        "Change ID":log.changeid,
        "Vote ID":log.changevoteid,
        "Voter":`${log.participanttitle} ${log.participantfname} ${log.participantlname}`,
        "Office":log.voteparticipantoffice,
        "Idea":`${log.ideaid}: ${log.ideadescription}`,
        "Previous Value":log.changepreviousvalue,
        "New Value":log.votevalue,
        "Time of Change":log.changetime,
        "Admin Comments":log.changecomment,
        "Change Type":log.changeaction
      }
    })

    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const worksheetParticipants = XLSX.utils.json_to_sheet(objParticipants);
    const worksheetVotes = XLSX.utils.json_to_sheet(objVotes);
    const worksheetRankings = XLSX.utils.json_to_sheet(objRankings);
    const worksheetLogs = XLSX.utils.json_to_sheet(objLogs);
    //sheets keys and sheet names must match exactly
    const workbook = { 
      Sheets: {
        "Rankings":worksheetRankings,
        "Votes":worksheetVotes,
        "Participants":worksheetParticipants,
        "Change Logs":worksheetLogs
      }, 
      SheetNames: [
        "Rankings",
        "Votes",
        "Participants",
        "Change Logs"
      ]
    };
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, `ISR_${new Date().getFullYear()}_Vote_Results.xlsx`);
    setExportLoading('none');
  }

  async function ExportChart() {

    setExportLoading('flex');
    const chartRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/export/excelchart/${selectedChart}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const chartResponse = await chartRequest.arrayBuffer();
    
    let fileName;
    
    switch (selectedChart) {
      case "all":
        fileName = `ISR_${new Date().getFullYear()}_Chart.xlsx`;
        break;

      case "first":
        fileName = `ISR_${new Date().getFullYear()}_Top_25_Chart.xlsx`;
        break;
    
      case "second":
        fileName = `ISR_${new Date().getFullYear()}_Second_25_Chart.xlsx`;
        break;
    
      case "third":
        fileName = `ISR_${new Date().getFullYear()}_Third_25_Chart.xlsx`;
        break;

      case "fourth":
        fileName = `ISR_${new Date().getFullYear()}_Fourth_25_Chart.xlsx`;
        break;
      
      case "fifth":
        fileName = `ISR_${new Date().getFullYear()}_Fifth_25_Chart.xlsx`;
        break;

      case "sixth":
        fileName = `ISR_${new Date().getFullYear()}_Sixth_25_Chart.xlsx`;
        break;

      case "remainder":
        fileName = `ISR_${new Date().getFullYear()}_Remainder_Chart.xlsx`;    
        break;
      
      default:
        fileName = `ISR_${new Date().getFullYear()}_Chart.xlsx`;  
        break;
    }
    
    let fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    let data = new Blob([chartResponse], { type: fileType });
    FileSaver.saveAs(data, fileName);
    setExportLoading('none');
  }

  function ProcessChartData(action, share) {
    
    let chartSlice = [];
    switch (chartDataRef.current.sliceValue) {
      case "init": break;
      case "all":
        chartSlice = ideaRankings;
        break;
      default: chartSlice = ideaRankings.slice(chartDataRef.current.sliceValue[0], chartDataRef.current.sliceValue[1]);
    }
    if (chartDataRef.current.sliceValue === "all") chartSlice = ideaRankings;
    if (chartDataRef.current.sliceValue !== "all") {
      chartSlice = ideaRankings.slice(chartDataRef.current.sliceValue[0], chartDataRef.current.sliceValue[1]);
    };
    
    let scaleObj = {};

    let dataArray = [];
    if (chartDataRef.current.sliceValue !== "init") {
      for (let i=0;i<chartSlice.length;i++){
        let name = `#${chartSlice[i].rank}) ${chartSlice[i].ideaId}: ${chartSlice[i].ideaDescription}`;
        dataArray.push({
          "group":name,
          "value":isNaN(chartSlice[i].averageScore) ? 0:parseFloat(chartSlice[i].averageScore)
        });
        scaleObj[name] = chartSlice[i].ideadomaincolorhex ? chartSlice[i].ideadomaincolorhex:'#7F7F7F';
      }
    if (action === "update") {
        setChartData(dataArray.reverse());
      }
    }
    
    if (action === "publish") {
      let client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/adminStat`);
      client.onopen = () => {
        client.send(
          JSON.stringify({
            sender:"adminStat",
            action: "publishResults",
            chartData:share ? chartSlice:[]
          })
        );
      };
    };

    setChartOptions({
      "title": chartDataRef.current.title,
      "axes": {
        "left": {
          "mapsTo": "group",
          "scaleType": "labels",
          "truncation": {
            "type": "end_line",
            "threshold": 56,
            "numCharacter": 56
          }
        },
        "bottom": {"mapsTo":"value"}
      },
      "color": {
        "pairing": {"option": 2},
        "scale":scaleObj,
      }, 
      "legend": {"enabled":false},
      "height":chartDataRef.current.sliceValue === "all" ? "3000px":"1000px",
      "bars":{"width":15},
      "toolbar": {
        "enabled": true,
        "numberOfIcons":4,
        "controls": [
          {
            "type": "Custom",
            "clickFunction":() => {
              sharedChart.current = '';
              ProcessChartData("publish",false);},
            "shouldBeDisabled":() => {
              if (sharedChart.current === selectedChart) return false;
              else {return true}
            },
            "text": "Unpublish Results",
            "id":"unpublish",
            "iconSVG": {
              "content": `
              <svg
                id="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
              >
                <defs>
                    <style>.cls-1{fill:none;}</style>
                </defs>
                <title>Unpublish Results</title>
                <path d="M59.5,62.9L49.4,49.2l-4-5.4l0,0L16.7,5l-2.8,2.1L27.1,25l-3.7,2.1C22,25.8,20.2,25,18.1,25c-4.2,0-7.6,3.4-7.6,7.6   c0,4.2,3.4,7.6,7.6,7.6c2.1,0,3.9-0.8,5.3-2.2l18.2,10.5c-0.2,0.6-0.3,1.3-0.3,1.9c0,4.2,3.4,7.6,7.6,7.6c0.8,0,1.6-0.1,2.3-0.4   l5.4,7.3L59.5,62.9z M25.5,34.5c0.2-0.6,0.3-1.3,0.3-1.9c0-0.7-0.1-1.3-0.3-2l4.1-2.3l11.1,15L25.5,34.5z"/>
                <path d="M56.3,52.6c0.2-0.7,0.3-1.4,0.3-2.2c0-4.2-3.4-7.6-7.5-7.6L56.3,52.6z"/>
                <path d="M35.6,24.7l8.1-4.7c1.4,1.3,3.2,2.1,5.2,2.1c4.2,0,7.6-3.4,7.6-7.6c0-4.2-3.4-7.6-7.6-7.6s-7.6,3.4-7.6,7.6   c0,0.7,0.1,1.4,0.3,2.1l-8.5,4.9L35.6,24.7z"/>
                <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="128" height="128" transform="translate(0 64) rotate(-90)"/>
              </svg>`
            }
          },
          {
            "type": "Custom",
            "clickFunction":() => {
              sharedChart.current = selectedChart;
              ProcessChartData("publish",true);},
            "shouldBeDisabled":() => {
              if (sharedChart.current === selectedChart) return true;
              if (chartDataRef.current.sliceValue === "init") return true;
              else {return false}
            },
            "text": "Publish Results",
            "id":"publish",
            "iconSVG": {
              "content": `
                <svg
                  id="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                >
                  <defs>
                    <style>.cls-1{fill:none;}</style>
                  </defs>
                  <title>Publish Chart</title>
                  <path d="M23,20a5,5,0,0,0-3.89,1.89L11.8,17.32a4.46,4.46,0,0,0,0-2.64l7.31-4.57A5,5,0,1,0,18,7a4.79,4.79,0,0,0,.2,1.32l-7.31,4.57a5,5,0,1,0,0,6.22l7.31,4.57A4.79,4.79,0,0,0,18,25a5,5,0,1,0,5-5ZM23,4a3,3,0,1,1-3,3A3,3,0,0,1,23,4ZM7,19a3,3,0,1,1,3-3A3,3,0,0,1,7,19Zm16,9a3,3,0,1,1,3-3A3,3,0,0,1,23,28Z"/>
                  <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32" transform="translate(0 32) rotate(-90)"/>
                </svg>`
            }
          },
          {
            "type": "Custom",
            "clickFunction":() => {ExportChart()},
            "shouldBeDisabled":() => {return chartDataRef.current.sliceValue === "init" ? true:false},
            "text": "Export",
            "id":"export",
            "iconSVG": {"content": '<svg id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>Export Chart</title><polygon points="13 21 26.17 21 23.59 23.59 25 25 30 20 25 15 23.59 16.41 26.17 19 13 19 13 21"/><path d="M22,14V10a1,1,0,0,0-.29-.71l-7-7A1,1,0,0,0,14,2H4A2,2,0,0,0,2,4V28a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V26H20v2H4V4h8v6a2,2,0,0,0,2,2h6v2Zm-8-4V4.41L19.59,10Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>'}
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "all" ? true:false;},
            "clickFunction":() => {setSelectedChart("all");},
            "text": "All Ideas",
            "id":"allIdeas"
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "first" ? true:false;},
            "clickFunction":() => {setSelectedChart("first");},
            "text": "Top 25",
            "id":"first"
          }, 
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "second" ? true:false;},
            "clickFunction":() => {setSelectedChart("second");},
            "text": "Rank #26 - #50",
            "id":"second"
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "third" ? true:false;},
            "clickFunction":() => {setSelectedChart("third");},
            "text": "Rank #51 - #75",
            "id":"third"
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "fourth" ? true:false;},
            "clickFunction":() => {setSelectedChart("fourth");},
            "text": "Rank #76 - #100",
            "id":"fourth"
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "fifth" ? true:false;},
            "clickFunction":() => {setSelectedChart("fifth");},
            "text": "Rank #101 - #125",
            "id":"fifth"
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "sixth" ? true:false;},
            "clickFunction":() => {setSelectedChart("sixth");},
            "text": "Rank #126 - #150",
            "id":"sixth"
          },
          {
            "type": "Custom",
            "shouldBeDisabled":() => {return selectedChart === "remainder" ? true:false;},
            "clickFunction":() => {setSelectedChart("remainder");},
            "text": "Rank #151+",
            "id":"remainder"
          },
        ]
      }
    });
  };

  function SwitchTabs(tabName) {
    switch (tabName) {
      case "ranktable":
        if (showCharts !== "none") setShowCharts("none");
        if (showByOffice !== "none") setShowByOffice("none");
        if (showRankTable === "none") setShowRankTable("block");
        break;
      
      case "charts":
        UpdateStatTable();
        if (showCharts === "none") setShowCharts("block");
        if (showByOffice !== "none") setShowByOffice("none");
        if (showRankTable !== "none") setShowRankTable("none");

        break;
      
      case "byoffice":
        GetOffices();
        if (showCharts !== "none") setShowCharts("none");
        if (showByOffice === "none") setShowByOffice("block");
        if (showRankTable !== "none") setShowRankTable("none");
        break;
    }
  }

  async function UpdateChart() {
    
    if (domainList.length === 0) await GetDomains();
    if (exportButtonDisplay === "none") setExportButtonDisplay('block');

    switch (selectedChart) {
      case "all":
        chartDataRef.current = {
          sliceValue:"all",
          title:"All Ranked Ideas"
        }
        ProcessChartData("update");
        break;

      case "first":
        chartDataRef.current = {
          sliceValue:[0,25],
          title:"Vote Results Ranking: Top 25 Ideas"
        }
        ProcessChartData("update");
        break;

      case "second":
        chartDataRef.current = {
          sliceValue:[25, 50],
          title:"Vote Results Ranking: Ideas #26 - #50"
        }
        ProcessChartData("update");
        break;

      case "third":
        chartDataRef.current = {
          sliceValue:[50,75],
          title:"Vote Results Ranking: Ideas #51 - #75"
        }
        ProcessChartData("update");
        break;

      case "fourth":
        chartDataRef.current = {
          sliceValue:[75,100],
          title:"Vote Results Ranking: Ideas #76 - #100"
        };
        ProcessChartData("update");
        break;

      case "fifth":
        chartDataRef.current = {
          sliceValue:[100, 125],
          title:"Vote Results Ranking: Ideas #101 - #125"
        }
        ProcessChartData("update");
        break;

      case "sixth":
        chartDataRef.current = {
          sliceValue:[125, 150],
          title:"Vote Results Ranking: Ideas #126 - #150"
        }
        ProcessChartData("update");
        break;

      case "remainder":
        chartDataRef.current = {
          sliceValue:[150],
          title:"Remaining Ranked Ideas: #151+"
        }
        ProcessChartData("update");
        break;
      default:
        chartDataRef.current = {
          sliceValue:"init",
          title:"(Select Rank Segment)"
        }
        ProcessChartData("update");
    }
  }

  async function GetOffices() {
    const officesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/offices/getall`, {mode:'cors'});
    const officesResponse = await officesRequest.json();
    const objOffices = officesResponse.data.rows.map(office => {
      return {id:office.officename, text:office.officename}
    });
    setOffices(objOffices);
  };

  async function GetDomains() {
    const domainRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const domainResponse = await domainRequest.json();
    if (domainResponse.code !== 200) {
      errorInfo.current = {"heading":`Error ${domainResponse.code}`,"message":domainResponse.message};
      setModalErrorOpen(true);
      return;
    }
    setDomainList(domainResponse);
  }

  async function GetVotesByOffice() {
    
    if (selectedOffice.current.value === '') setComboBoxInvalid(true);
    if (selectedOffice.current.value !== '') {
      const votesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/getbyoffice/${selectedOffice.current.value}&${localStorage.getItem('adminjwt')}`, {mode:'cors'})
      const votesResponse = await votesRequest.json();
      if (votesResponse.code !== 200) {
        errorInfo.current = {"heading":`Error ${votesResponse.code}`,"message":votesResponse.message};
        setModalErrorOpen(true);
      }
      if (votesResponse.code === 200) {
        if (votesResponse.data.length === 0) {
          const votes = [{
            id:"0",
            ideaId:"no records found",
            ideaDescription:"no records found",
            participantName:"no records found",
            office:"no records found",
            voteValue:"no records found"
          }];
          setVoteData(votes);
          return;
        }
        const votes = votesResponse.data.map((vote,index) => {
          return {
            id:String(index),
            ideaId:vote.voteideaid,
            ideaDescription:vote.ideadescription,
            participantName:`${vote.participanttitle} ${vote.participantfname} ${vote.participantlname}`,
            office:vote.officename,
            voteValue:vote.votevalue
          };
        });
        setVoteData(votes);
      };
    };
  };

  return (
    <>
      <Modal
        id='modalError'
        modalHeading={errorInfo.current.heading}
        primaryButtonText="Ok"
        open={modalErrorOpen}
        onRequestClose={() => {
          setModalErrorOpen(false);
          errorInfo.current = ({heading:"", message:""});
        }}
        onRequestSubmit={() => {
          setModalErrorOpen(false);
          errorInfo.current = ({heading:"", message:""});
        }}
        children={<div>{errorInfo.current.message}</div>}
      />
      <div className="adminPageBody">
        <div className="statistics-page__r1" >
          <ContentSwitcher onChange={(tab) => {SwitchTabs(tab.name)}}>
            <Switch name="ranktable" text="Idea Ranks" />
            <Switch name="charts" text="Vote Breakdown Charts" />
            <Switch name="byoffice" text="Vote Breakdown by Office" />
          </ContentSwitcher>
        </div>
        <div id="ranktable" style={{display:showRankTable}} className="statistics-page__r2">
          <div className="bx--col-lg-15">
            <DataTable
              rows={ideaRankings}
              headers={rankHeaders}
              isSortable={true}
              render={({
                rows,
                headers,
                getHeaderProps,
                getRowProps,
                getTableProps,
                onInputChange
              }) => (
                <TableContainer title="Idea Ranks" description="Displays a rank-ordered list of ideas">
                  <TableToolbar>
                    <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                    </TableToolbarContent>
                    <Button renderIcon={Renew} hasIconOnly iconDescription='Refresh Table' onClick={() => UpdateStatTable()} />
                    <Button
                      renderIcon={DocumentExport}
                      kind="secondary" 
                      hasIconOnly
                      iconDescription='Export to Excel Spreadsheet'
                      onClick={() => ExportExcel()}
                    />
                    <div style={{marginTop:'0.5%', marginLeft:'1%', display:exportLoading}}>
                      <InlineLoading description="Exporting..." status='active'></InlineLoading>
                    </div>
                  </TableToolbar>
                  <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headers.map(header => (<TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map(row => (
                        <TableRow {...getRowProps({ row })}>
                          {row.cells.map(cell => (<TableCell key={cell.id}>{cell.value}</TableCell>))}
                        </TableRow>
                      ))}
                  </TableBody>
                  </Table>
                </TableContainer>
              )}
            />
          </div>
        </div>
        <div id="charts" style={{display:showCharts}} className="statistics-page__r3">
          <div className='chartContainer'>
            <div style={{display:exportLoading,justifyContent:'end'}}>
              <div><InlineLoading description='Exporting chart...' status='active'/></div>
            </div>
          </div>
          <div className='statsBarChart'>
            {chartData && chartOptions && (<SimpleBarChart data={chartData} options={chartOptions}/>)}
          </div>
        </div>
        <div 
          id="byoffice"
          style={{display:showByOffice}}
          className="statistics-page__r4"
        >
          <div id="byOfficeContainer">
            <div id="byOfficeOptions" style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
              <div>
                {
                  offices && (
                    <ComboBox
                      onChange={() => {if(comboBoxInvalid) setComboBoxInvalid(false)}}
                      id="combobox"
                      placeholder="Select Office"
                      invalid={comboBoxInvalid}
                      ref={selectedOffice}
                      invalidText="This is a required field." 
                      items={offices}
                      itemToString={(office) => (office ? office.text : '')}
                    />
                  )
                }
              </div>
              <div><Button kind='primary' onClick={() => GetVotesByOffice()}>Get Votes</Button></div>
            </div>
            <div>
              <div className="officeTable">
                <DataTable rows={voteData} headers={voteHeaders} isSortable>
                  {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                    <TableContainer>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map(header => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map(row => (
                            <TableRow key={row.id} {...getRowProps({ row })}>
                              {row.cells.map(cell => (<TableCell key={cell.id}>{cell.value}</TableCell>))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DataTable>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
};