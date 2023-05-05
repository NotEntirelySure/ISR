import React, { useState, useEffect, useRef } from 'react'
import * as FileSaver from 'file-saver';
import * as XLSX from "xlsx";
import { w3cwebsocket } from "websocket";
import {
  Button,
  ComboBox,
  Content,
  ContentSwitcher,
  Dropdown,
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

  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [showRankTable, setShowRankTable] = useState('block');
  const [showCharts, setShowCharts] = useState('none');
  const [showByOffice, setShowByOffice] = useState('none');
  const [offices, setOffices] = useState([]);
  const [selectedChart, setSelectedChart] = useState("start");
  const [comboBoxInvalid, setComboBoxInvalid] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  const [domainList, setDomainList] = useState([]);
  const [exportButtonText, setExportButtonText] = useState('');
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

  useEffect(() => GetIdeas(),[]);
  useEffect(() => UpdateStatTable(),[ideas]);
  useEffect(() => UpdateChart(),[selectedChart]);

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

  function PublishResults() { //this function is unused. Consider deleting or seperating the publishing code into here.
    this.setState({
      connectionStatus:"active",
      connectionMessage:"Connecting...",
      reconnectButtonDisplay:"none"
    });
    
    let client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/adminStat`);

    client.onopen = () => {
      client.send(JSON.stringify({
        sender:"adminStat",
        action: "publishResults",
      }))
    };
    
    client.onmessage = (message) => {
      const messageData = JSON.parse(message.data);
    };
    
    client.onclose = () => {}

    client.onerror = (event) => {}

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
    setExportLoading('block');
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

    setExportLoading('block');
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

  function ProcessChartData(action) {
    
    let chartSlice = [];
    if (chartDataRef.current.sliceValue === "all") chartSlice = ideaRankings;
    if (chartDataRef.current.sliceValue !== "all") {
      chartSlice = ideaRankings.slice(chartDataRef.current.sliceValue[0], chartDataRef.current.sliceValue[1]);
    };
    
    if (action === "update") {
      
      let dataArray = [];
      let scaleObj = {};
      
      for (let i=0;i<chartSlice.length;i++){
        let name = `#${chartSlice[i].rank}) ${chartSlice[i].ideaId}: ${chartSlice[i].ideaDescription}`;
        dataArray.push({
          "group":name,
          "value":isNaN(chartSlice[i].averageScore) ? 0:parseFloat(chartSlice[i].averageScore)
        });
        scaleObj[name] = chartSlice[i].ideadomaincolorhex;
      }
      
      setChartData(dataArray.reverse());
      setChartOptions({
        "title": "",
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
        "bars":{"width":15}
      });
    }
    
    if (action === "publish") {
      let client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/adminStat`);
      client.onopen = () => {
        client.send(
          JSON.stringify({
            sender:"adminStat",
            action: "publishResults",
            chartData:chartSlice
          })
        )
      };
    }
  }

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
        setExportButtonText("Export All Ideas");
        chartDataRef.current = {
          sliceValue:"all",
          title:"All Ranked Ideas"
        }
        ProcessChartData("update");
        break;

      case "first":
        setExportButtonText("Export Top 25");
        chartDataRef.current = {
          sliceValue:[0,25],
          title:"Top 25 Ranked Ideas"
        }
        ProcessChartData("update");
        break;

      case "second":
        setExportButtonText("Export Second 25");
        chartDataRef.current = {
          sliceValue:[25, 50],
          title:"#26 - #50 Ranked Ideas"
        }
        ProcessChartData("update");
        break;

      case "third":
        setExportButtonText("Export Third 25");
        chartDataRef.current = {
          sliceValue:[50,75],
          title:"#51 - #75 Ranked Ideas"
        }
        ProcessChartData("update");
        break;

      case "fourth":
        setExportButtonText("Export Fourth 25");
        chartDataRef.current = {
          sliceValue:[75,100],
          title:"#76 - #100 Ranked Ideas"
        };
        ProcessChartData("update");
        break;

      case "fifth":
        setExportButtonText("Export Fifth 25");
        chartDataRef.current = {
          sliceValue:[100, 125],
          title:"#101 - #125 Ranked Ideas"
        }
        ProcessChartData("update");
        break;

      case "sixth":
        setExportButtonText("Export Sixth 25");
        chartDataRef.current = {
          sliceValue:[125, 150],
          title:"Sixth 25 Ranked (#126 - #150)"
        }
        ProcessChartData("update");
        break;

      case "remainder":
        setExportButtonText("Export Remainder");
        chartDataRef.current = {
          sliceValue:[150],
          title:"Remaining Ranked Ideas (#151...)"
        }
        ProcessChartData("update");
        break;
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
      >
        <div>{errorInfo.current.message}</div>
      </Modal>
      <Content>
        <div className="bx--grid bx--grid--full-width adminPageBody">
          <div className="bx--row bx--offset-lg-1 statistics-page__r1" >
            <ContentSwitcher onChange={(tab) => {SwitchTabs(tab.name)}}>
              <Switch name="ranktable" text="Idea Ranks" />
              <Switch name="charts" text="Vote Breakdown Charts" />
              <Switch name="byoffice" text="Vote Breakdown by Office" />
            </ContentSwitcher>
          </div>
          <div id="ranktable" style={{display:showRankTable}} className="bx--row bx--offset-lg-1 statistics-page__r2">
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
          <div id="charts" style={{display:showCharts}} className="bx--row bx--offset-lg-1 statistics-page__r3">
            <div className='chartContainer'>
              <div id='chartOptions' style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center'}}>
                <div id='chartDropdown'>
                  <Dropdown
                    id="chartDropdown"
                    label="Select rank segment"
                    items={[
                      {id:"all", text:"All Ideas"},
                      {id:"first", text:"Top 25 Ranked (#1 - #25)"},
                      {id:"second", text:"Second 25 Ranked (#26 - #50)"},
                      {id:"third", text:"Third 25 ranked (#51 - #75)"},
                      {id:"fourth", text:"Fourth 25 Ranked (#76 - #100)"},
                      {id:"fifth", text:"Fifth 25 Ranked (#101 - #125)"},
                      {id:"sixth", text:"Sixth 25 Ranked (#126 - #150)"},
                      {id:"remainder", text:"Remaining Ranked Ideas (#151...)"},
                    ]}
                    itemToString={(item) => (item ? item.text : '')}
                    onChange={(item) => setSelectedChart(item.selectedItem.id)}
                  />
                </div>
                <div style={{display:exportButtonDisplay}}>
                  <Button
                    id="chartExportButton"
                    hasIconOnly={true}
                    renderIcon={DocumentExport}
                    iconDescription={exportButtonText}
                    description={exportButtonText}
                    onClick={() => ExportChart()}
                  />
                </div>
                <div style={{display:exportLoading}}>
                  <InlineLoading
                    style={{ marginLeft: '1rem'}}
                    description='Exporting chart...'
                    status='active'
                  />
                </div>
                <div style={{display:exportButtonDisplay}}>
                    <Button 
                      id="publishResultsButton"
                      kind="secondary"
                      hasIconOnly={true}
                      renderIcon={Share}
                      description='Publishes the rusults of the ISR voting'
                      iconDescription='Publish Results'
                      onClick={() => ProcessChartData("publish")}
                    />
                </div>
    
              </div>
            </div>
            <div className='statsBarChart'>
              {chartData && chartOptions ? <SimpleBarChart data={chartData} options={chartOptions}/>:null}
            </div>
          </div>
          <div 
            id="byoffice"
            style={{display:showByOffice}}
            className="bx--row bx--offset-lg-1 statistics-page__r4"
          >
            <div id="byOfficeContainer">
              <div id="byOfficeOptions" style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                <div>
                  {
                    offices ? <ComboBox
                      onChange={() => {if(comboBoxInvalid) setComboBoxInvalid(false)}}
                      id="combobox"
                      placeholder="Select Office"
                      invalid={comboBoxInvalid}
                      ref={selectedOffice}
                      invalidText="This is a required field." 
                      items={offices}
                      itemToString={(office) => (office ? office.text : '')}
                    />:null
                  }
                </div>
                <div><Button kind='primary' onClick={() => GetVotesByOffice()}>Get Votes</Button></div>
              </div>
              <div className="bx--row">
              <div className="bx--col-lg-15 officeTable">
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
      </Content>
    </>
  )
};