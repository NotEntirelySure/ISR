import React, { Component } from 'react'
import * as FileSaver from 'file-saver';
import * as XLSX from "xlsx";
import { w3cwebsocket } from "websocket";
import {
    Button,
    ComboBox,
    Content,
    ContentSwitcher,
    Dropdown,
    Switch,
    DataTable,
    InlineLoading,
    Table,
    TableHead,
    TableHeader,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
    TableCell,
    TableBody,
    TableRow,
    TableContainer,
} from '@carbon/react';
import { DocumentExport, Renew, Share } from '@carbon/react/icons';
import { SimpleBarChart } from "@carbon/charts-react";

const rankHeaders = [
  {key:'rank', header:'Rank'},
  {key:'projectID', header:'Project ID'},
  {key:'projectDescription', header:'Project Description'},
  {key:'totalScore', header:'Total Priority Score'},
  {key:'averageScore', header:'Average Priority Score'}
];

const voteHeaders = [
  {key:'projectID', header:'Project ID'},
  {key:'projectDescription', header:'Project Description'},
  {key:'participantName', header:'Participant Name'},
  {key:'office', header:'Office'},
  {key:'voteValue', header:'Vote Value'}
];

class StatisticsPage extends Component {

  constructor(props) {
    super(props)
    this.chartDataRef = React.createRef(null)
    this.state = {
      projects:[{
        id:"0",
        rank:"-",
        projectID:"-",
        projectDescription:"-",
        totalScore:"-",
        averageScore:"-"
      }],
      voteData:[{
        id:"0",
        projectID:"-",
        name:"-",
        office:"-",
        voteVaue:"-"
      }],
      offices:[],
      selectedChart:"start",
      selectedOffice:"",
      comboBoxInvalid:false,
      chartData:null,
      chartOptions:{},
      domainList:[],
      exportButtonText:'',
      exportButtonDisplay:'none',
      exportLoading:'none'
    }
  }

  componentDidMount = async() => {
    const projectsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/projects/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const projectsResponse = await projectsRequest.json();
    let projectList = [];
    for (let i=0; i<projectsResponse.rows.length; i++) {
      projectList.push({
        "id":String(i+1),
        "rank":0,
        "projectID": projectsResponse.rows[i].projectid,
        "projectDescription": projectsResponse.rows[i].projectdescription,
        "projectdomaincolorhex":projectsResponse.rows[i].projectdomaincolorhex,
        "totalScore":0
      }); 
    }
    this.setState({projects: projectList}, () => this.UpdateStatTable());

  }

  publishResults = () => {

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

  UpdateStatTable = async() => {

    const votesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getallvotes/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const votesResponse = await votesRequest.json();
    //create hashmap of projects and total scores.
    let votesHashmap = {};
    let objVoteCount = {};
      
    for (let i=0; i<votesResponse.length; i++) {
      //omit any 0 values from the calculation. This prevents abstain votes from skewing the average down.
      if(votesResponse[i].votevalue !== 0){
        if (votesResponse[i].voteprojectid in votesHashmap) {
          votesHashmap[votesResponse[i].voteprojectid] = votesHashmap[votesResponse[i].voteprojectid] + votesResponse[i].votevalue;
          objVoteCount[votesResponse[i].voteprojectid]++;
        }
        else {
          votesHashmap[votesResponse[i].voteprojectid] = votesResponse[i].votevalue;
          objVoteCount[votesResponse[i].voteprojectid] = 1;
        }  
      }
    }
    //update state with score values of voteshashmap
    let projectList = [];

    for (let i=0; i<this.state.projects.length; i++) {
      let average = (votesHashmap[this.state.projects[i].projectID]/objVoteCount[this.state.projects[i].projectID]).toFixed(2);
      if (isNaN(average)) {average = 0;}
      projectList.push({
        "id":this.state.projects[i].id,
        "rank":0,
        "projectID":this.state.projects[i].projectID,
        "projectDescription":this.state.projects[i].projectDescription,
        "totalScore":votesHashmap[this.state.projects[i].projectID],
        "averageScore":average,
        "projectdomaincolorhex":this.state.projects[i].projectdomaincolorhex
      })
    }

    //sort highest score to lowest
    projectList.sort((a, b) => b.averageScore - a.averageScore);
    //set rank order value based on previous sorting
    for (let i=0;i<projectList.length;i++){projectList[i].rank = i+1}

    this.setState({projects: projectList});
  }

  ExportData = async() => {
    //get most recent rankings before exporting.
    this.setState({exportLoading:'block'});
    this.UpdateStatTable();

    const participantResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getallvoters/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const participantList = await participantResponse.json();

    let objParticipants = [];
    for (let i=0; i<participantList.rows.length; i++){
      objParticipants.push({
        "Participant ID":participantList.rows[i].participantid,
        "Title":participantList.rows[i].participanttitle,
        "First Name":participantList.rows[i].participantfname,
        "Last Name":participantList.rows[i].participantlname,
        "Office":participantList.rows[i].officename
      });
    }

    const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getallvotes/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const voteResponse = await voteRequest.json();
    
    let objVotes = [];
    for (let i=0; i<voteResponse.length; i++){
      objVotes.push({
        "Vote ID":voteResponse[i].voteid,
        "Project ID":voteResponse[i].voteprojectid,
        "Participant ID":voteResponse[i].participantid,
        "Participant Office":voteResponse[i].officename,
        "Vote Value":voteResponse[i].votevalue
      });
    }

    let objRankings = [];
    for (let i=0; i<this.state.projects.length; i++){
      objRankings.push({
        "Rank":this.state.projects[i].rank,
        "Project ID":this.state.projects[i].projectID,
        "Project Description":this.state.projects[i].projectDescription,
        "Total Priority Score":this.state.projects[i].totalScore,
        "Average Priority Score":this.state.projects[i].averageScore
      });
    }
    
    const logRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getallchangelogs/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const logResponse = await logRequest.json();
    let objLogs = [];
    for (let i=0;i<logResponse.rowCount;i++) {
      objLogs.push({
        "Change ID":logResponse.rows[i].changeid,
        "Vote ID":logResponse.rows[i].changevoteid,
        "Voter":`${logResponse.rows[i].participanttitle} ${logResponse.rows[i].participantfname} ${logResponse.rows[i].participantlname}`,
        "Office":logResponse.rows[i].voteparticipantoffice,
        "Idea":`${logResponse.rows[i].projectid}: ${logResponse.rows[i].projectdescription}`,
        "Previous Value":logResponse.rows[i].changepreviousvalue,
        "New Value":logResponse.rows[i].votevalue,
        "Time of Change":logResponse.rows[i].changetime,
        "Admin Comments":logResponse.rows[i].changecomment,
        "Change Type":logResponse.rows[i].changeaction
      })
    }

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
    this.setState({exportLoading:'none'});
  }

  ExportChart = async() => {

    this.setState({exportLoading:'block'});
    const chartResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exportexcel/${this.state.selectedChart}`, {mode:'cors'});
    const chartData = await chartResponse.arrayBuffer();
    this.setState({exportLoading:'none'});
    
    let fileName;
    
    switch (this.state.selectedChart) {
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
    let data = new Blob([chartData], { type: fileType });
    FileSaver.saveAs(data, fileName);

  }

  ProcessChartData = (action) => {
    
    let chartSlice = [];
    if (this.chartDataRef.current.sliceValue === "all") chartSlice = this.state.projects;
    if (this.chartDataRef.current.sliceValue !== "all") chartSlice = this.state.projects.slice(
      this.chartDataRef.current.sliceValue[0], this.chartDataRef.current.sliceValue[1]
    );
    
    if (action === "update") {
      
      let dataArray = [];
      let scaleObj = {};
      
      for (let i=0;i<chartSlice.length;i++){
        let name = `#${chartSlice[i].rank}) ${chartSlice[i].projectID}: ${chartSlice[i].projectDescription}`;
        dataArray.push({
          "group":name,
          "value":isNaN(chartSlice[i].averageScore) ? 0:parseFloat(chartSlice[i].averageScore)
        });
        scaleObj[name] = chartSlice[i].projectdomaincolorhex;
      }

      this.setState({
        chartData:dataArray.reverse(),
        chartOptions:{
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
          "height":this.chartDataRef.current.sliceValue === "all"?"3000px":"1000px",
          "bars":{"width":this.chartDataRef.current.sliceValue === "all"? 5:15}
        }
      });
    }
    
    if (action === "publish") {
      console.log("publish")
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

  SwitchTabs = (tabName) => {
    switch (tabName) {
      case "ranktable":
        document.getElementById("charts").style.display = 'none';
        document.getElementById("byoffice").style.display = 'none';
        document.getElementById("ranktable").style.display = 'block';
        break;
      
      case "charts":
        this.UpdateStatTable();
        document.getElementById("ranktable").style.display = 'none';
        document.getElementById("byoffice").style.display = 'none';
        document.getElementById("charts").style.display = 'block';
        break;
      
      case "byoffice":
        this.GetOffices();
        document.getElementById("ranktable").style.display = 'none';
        document.getElementById("charts").style.display = 'none';
        document.getElementById("byoffice").style.display = 'block';
        break;
    }
  }

  UpdateChart = async() => {
    
    if (this.state.domainList.length === 0) await this.GetDomains();
    if (this.state.exportButtonDisplay === "none") this.setState({exportButtonDisplay:'block'});

    switch (this.state.selectedChart) {
      case "all":
        this.setState({exportButtonText:"Export All Projects"});
        this.chartDataRef.current = {
          sliceValue:"all",
          title:"All Ranked Projects"
        }
        this.ProcessChartData("update");
        break;

      case "first":
        this.setState({exportButtonText:"Export Top 25"});
        this.chartDataRef.current = {
          sliceValue:[0,25],
          title:"Top 25 Ranked Projects"
        }
        this.ProcessChartData("update");
        break;

      case "second":
        this.setState({exportButtonText:"Export Second 25"});
        this.chartDataRef.current = {
          sliceValue:[25, 50],
          title:"#26 - #50 Ranked Projects"
        }
        this.ProcessChartData("update");
        break;

      case "third":
        this.setState({exportButtonText:"Export Third 25"});
        this.chartDataRef.current = {
          sliceValue:[50,75],
          title:"#51 - #75 Ranked Projects"
        }
        this.ProcessChartData("update");
        break;

      case "fourth":
        this.setState({exportButtonText:"Export Fourth 25"})
        this.chartDataRef.current = {
          sliceValue:[75,100],
          title:"#76 - #100 Ranked Projects"
        };
        this.ProcessChartData("update");
        break;

      case "fifth":
        
        this.setState({exportButtonText:"Export Fifth 25"});
        this.chartDataRef.current = {
          sliceValue:[100, 125],
          title:"#101 - #125 Ranked Projects"
        }
        this.ProcessChartData("update");
        break;

      case "sixth":
        this.setState({exportButtonText:"Export Sixth 25"});
        this.chartDataRef.current = {
          sliceValue:[125, 150],
          title:"Sixth 25 Ranked (#126 - #150)"
        }
        this.ProcessChartData("update");
        break;

      case "remainder":
        this.setState({exportButtonText:"Export Remainder"})
        this.chartDataRef.current = {
          sliceValue:[150],
          title:"Remaining Ranked Projects (#151...)"
        }
        this.ProcessChartData("update");
        break;
    }
  }

  GetOffices = () => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/offices`, {mode:'cors'})
      .then(response => response.json())
      .then(data => {
        let objOffices = []  
        for (let i=0; i<data.rows.length; i++){
          objOffices.push({id:data.rows[i].officename, text:data.rows[i].officename})
        }
        this.setState({offices: objOffices})
    })
  }

  GetDomains = async() => {
    const domainRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getdomains`, {mode:'cors'});
    const domainResponse = await domainRequest.json();
    this.setState({domainList:domainResponse});
  }

  GetVotesByOffice = async() => {
    
    let office = document.getElementById("combobox").value;
    if (office === '') {this.setState({comboBoxInvalid:true})}
    if (office !== '') {
      const votesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getvotesbyoffice/${office}`, {mode:'cors'})
      const votesResponse = await votesRequest.json();
      let objVotes = [];
      if (votesResponse.length === 0) {
        objVotes.push({
          id:"0",
          projectID:"no records found",
          projectDescription:"no records found",
          participantName:"no records found",
          office:"no records found",
          voteValue:"no records found"
        });
      }
      
      for (let i=0; i<votesResponse.length; i++) {
        objVotes.push({
          id:String(i),
          projectID:votesResponse[i].voteprojectid,
          projectDescription:votesResponse[i].projectdescription,
          participantName:`${votesResponse[i].participanttitle} ${votesResponse[i].participantfname} ${votesResponse[i].participantlname}`,
          office:votesResponse[i].officename,
          voteValue:votesResponse[i].votevalue
        });
      }
      this.setState({voteData: objVotes});
    }

  }

  render () {
    return (
      <>
        <Content>
          <div className="bx--grid bx--grid--full-width adminPageBody">
            <div className="bx--row bx--offset-lg-1 statistics-page__r1" >
              <ContentSwitcher onChange={(tab) => {this.SwitchTabs(tab.name)}}>
                <Switch name="ranktable" text="Project Ranks" />
                <Switch name="charts" text="Vote Breakdown Charts" />
                <Switch name="byoffice" text="Vote Breakdown by Office" />
              </ContentSwitcher>
            </div>
            <div id="ranktable" className="bx--row bx--offset-lg-1 statistics-page__r2">
              <div className="bx--col-lg-15">
                <DataTable
                  rows={this.state.projects}
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
                    <TableContainer title="Project Ranks" description="Displays a rank-ordered list of projects">
                      <TableToolbar>
                        <TableToolbarContent>
                          <TableToolbarSearch onChange={onInputChange} />
                        </TableToolbarContent>
                        <Button renderIcon={Renew} hasIconOnly iconDescription='Refresh Table' onClick={() => this.UpdateStatTable()} />
                        <Button
                          renderIcon={DocumentExport}
                          kind="secondary" 
                          hasIconOnly
                          iconDescription='Export to Excel Spreadsheet'
                          onClick={() => this.ExportData()}
                        />
                        <div style={{marginTop:'0.5%', marginLeft:'1%', display:this.state.exportLoading}}>
                          <InlineLoading description="Exporting..." status='active'></InlineLoading>
                        </div>
                      </TableToolbar>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map((header) => (<TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                        {rows.map((row) => (
                          <TableRow {...getRowProps({ row })}>{row.cells.map((cell) => (<TableCell key={cell.id}>{cell.value}</TableCell>))}</TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                />
              </div>
            </div>
            <div id="charts" style={{display:'none'}} className="bx--row bx--offset-lg-1 statistics-page__r3">
              <div className='chartContainer'>
                <div id='chartOptions'>
                  <div id='chartDropdown'>
                    <Dropdown
                      id="chartDropdown"
                      label="Select rank segment"
                      items={[
                        {id:"all", text:"All Projects"},
                        {id:"first", text:"Top 25 Ranked (#1 - #25)"},
                        {id:"second", text:"Second 25 Ranked (#26 - #50)"},
                        {id:"third", text:"Third 25 ranked (#51 - #75)"},
                        {id:"fourth", text:"Fourth 25 Ranked (#76 - #100)"},
                        {id:"fifth", text:"Fifth 25 Ranked (#101 - #125)"},
                        {id:"sixth", text:"Sixth 25 Ranked (#126 - #150)"},
                        {id:"remainder", text:"Remaining Ranked Projects (#151...)"},
                      ]}
                      itemToString={(item) => (item ? item.text : '')}
                      onChange={(item) => this.setState({selectedChart:item.selectedItem.id}, this.UpdateChart)}
                    />
                  </div>
                  <div>
                    <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                      <div style={{display:this.state.exportButtonDisplay}}>
                        <Button
                          id="chartExportButton"
                          hasIconOnly={true}
                          renderIcon={DocumentExport}
                          iconDescription={this.state.exportButtonText}
                          description={this.state.exportButtonText}
                          onClick={() => this.ExportChart()}
                        />
                      </div>
                      <div style={{display:this.state.exportLoading}}>
                        <InlineLoading
                          style={{ marginLeft: '1rem'}}
                          description='Exporting chart...'
                          status='active'
                        />
                      </div>
                      <div style={{display:this.state.exportButtonDisplay}}>
                          <Button 
                            id="publishResultsButton"
                            kind="secondary"
                            hasIconOnly={true}
                            renderIcon={Share}
                            description='Publishes the rusults of the ISR voting'
                            iconDescription='Publish Results'
                            onClick={() => this.ProcessChartData("publish")}
                          />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='statsBarChart'>
                {
					        this.state.chartData && this.state.chartOptions ?
							      <SimpleBarChart data={this.state.chartData} options={this.state.chartOptions}/>:null
                }
              </div>
              
            </div>
            <div id="byoffice" style={{display:'none'}} className="bx--row bx--offset-lg-1 statistics-page__r4">
              <div id="byOfficeContainer">
                <div id="byOfficeOptions">
                  <div>
                    {this.state.offices ? <ComboBox
                      onChange={() => this.setState({comboBoxInvalid:false})}
                      id="combobox"
                      invalid={this.state.comboBoxInvalid}
                      invalidText="This is a required field." 
                      items={this.state.offices}
                      itemToString={(office) => (office ? office.text : '')}
                      titleText="Office"
                      helperText="Select an office"
                    />:null}</div>
                  <div className="bx--col-lg-4 officeButton"><Button kind='primary' onClick={() => this.GetVotesByOffice()}>Get Votes</Button></div>
                </div>
                <div className="bx--row">
                <div className="bx--col-lg-15 officeTable">
                  <DataTable rows={this.state.voteData} headers={voteHeaders} isSortable>
                    {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
                      <TableContainer>
                        <Table {...getTableProps()}>
                          <TableHead>
                            <TableRow>
                              {headers.map((header) => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows.map((row) => (
                              <TableRow key={row.id} {...getRowProps({ row })}>{
                                row.cells.map((cell) => (
                                  <TableCell key={cell.id}>{cell.value}</TableCell>
                              ))}
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
  }
}

export default StatisticsPage;