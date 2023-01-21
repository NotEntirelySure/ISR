import React, { Component } from 'react'
import { w3cwebsocket } from "websocket";
import {
  Button,
  Content,
  InlineLoading,
  Tile,
  Toggle,
  Pagination,
  ComboBox
} from '@carbon/react';
import { ArrowLeft, ArrowRight, Renew } from '@carbon/react/icons';

var client;

class VoteDashboardPage extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      connectionMessage:"",
      connectionStatus:"inactive",
      projects:[],
      graphData: [],
      remainingVoters:[],
      voteData:[],
      totalItems:0,
      currentProject: {},
      votingEnabledProjects: [],
      reconnectAttempts:0,
      reconnectButtonDisplay:"none",
      toggleChecked:false,
      nextButtonDisabled:false,
      previousButtonDisabled:true
    }
  }
    
  componentDidMount = async() => {
    const projectsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/projects`, {mode:'cors'});
    const projectsResponse = await projectsRequest.json();

    let objProjects = [];  
    
    for (var i=0; i<projectsResponse.rowCount; i++) {
      objProjects.push({
        "projectIndex":i,
        "projectID":projectsResponse.rows[i].projectid,
        "projectDescription": projectsResponse.rows[i].projectdescription,
        "projectDomain":projectsResponse.rows[i].projectdomainname,
        "projectDomainColor":projectsResponse.rows[i].projectdomaincolorhex
      })
    }
    this.setState({
      projects: objProjects,
      totalItems:projectsResponse.rowCount,
      currentProject: objProjects[0]
    });
    this.connectWebSocket();
  }

  connectWebSocket = () => {
    this.setState({
      connectionStatus:"active",
      connectionMessage:"Connecting...",
      reconnectButtonDisplay:"none"
    });
    
    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/adminDash`);

    client.onopen = () => {
      this.setState({
        connectionStatus:"finished",
        connectionMessage:"Connected to server",
        reconnectAttempts:0
      })

      client.send(JSON.stringify({
        sender:"adminDash",
        action: "getVotingEnabledProjects",
      }))
    };
    
    client.onmessage = (message) => {
      const messageData = JSON.parse(message.data);
      let payload;
      let votingProjects = [];
      switch (messageData.source) {

        case "getVotingEnabledProjects":
          payload = JSON.parse(messageData.payload);
          for (let i=0; i<payload.length;i++) {votingProjects.push({projectID:payload[i].id})}
          this.setState({votingEnabledProjects: votingProjects});
          break;
        
        case "getRemainingVoters":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) this.setState({remainingVoters: JSON.parse(messageData.payload)});
          break;
        
        case "addProject":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) this.setState({remainingVoters: JSON.parse(messageData.payload)});
          break;

        case "removeProject":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) {
            payload = JSON.parse(messageData.payload);
            for (let i=0; i<payload.length;i++) {votingProjects.push({projectID:payload[i].id})}
            this.setState({votingEnabledProjects: votingProjects});
          }
          break;

        case "clientVoted":
          this.setState({remainingVoters: JSON.parse(messageData.payload)})
          break;
      }
    };
    
    client.onclose = () => {
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Disconnected from server"
      })
      if (this.state.reconnectAttempts <= 2) {
        this.setState({reconnectAttempts: this.state.reconnectAttempts + 1}, () => {
          console.log("attempt:",this.state.reconnectAttempts)
          setTimeout(() => {this.connectWebSocket()}, 1500);
        })
      }
      if (this.state.reconnectAttempts >= 3) {
        this.setState({
          connectionStatus:"error",
          connectionMessage:"Failed to connect to server",
          reconnectButtonDisplay:"block"
        })
      }
    }

    client.onerror = (event) => {
      console.log(event);
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Failed to connect to server"
      },console.log("the websocket server is down"))
    }
  }

  HandlePageChange = (changeSource, comboboxValue) => {
    
    if (this.state.toggleChecked) {
      this.setState({toggleChecked:false})
      client.send(JSON.stringify({
        sender:"adminDash",
        source:"dashboard",
        action: "removeProject",
        payload: `{"id":"${this.state.currentProject.projectID}","description":"${this.state.currentProject.projectDescription}"}`
      }));
    }

    switch (changeSource) {
      case "previousButton":
        let prevIndex = this.state.currentProject.projectIndex - 1;
        if (prevIndex <= 0) {this.setState({previousButtonDisabled:true})}
        if (this.state.currentProject.projectIndex > 0) {
          this.setState({
            nextButtonDisabled:false,
            remainingVoters:[],
            currentProject:this.state.projects[prevIndex]
          })
        }
        break;
      case "nextButton":
        let nextIndex = this.state.currentProject.projectIndex + 1
        if (nextIndex >= this.state.totalItems - 1) this.setState({nextButtonDisabled:true})
        if (nextIndex <= this.state.totalItems - 1) {
        this.setState({
          remainingVoters:[],
          previousButtonDisabled:false,
          currentProject:this.state.projects[nextIndex]
        })
        }
        break;
      case "combobox":
        if (comboboxValue === this.state.totalItems - 1) this.setState({nextButtonDisabled:true})
        else if (this.state.nextButtonDisabled) this.setState({nextButtonDisabled:false})
        if (comboboxValue === 0 ) this.setState({previousButtonDisabled:true})
        else if (this.state.previousButtonDisabled) this.setState({previousButtonDisabled:false})
        this.setState({
          remainingVoters:[],
          currentProject:this.state.projects[comboboxValue]
        })
    }

    for (let i=0;i<this.state.votingEnabledProjects.length; i++){
      if (this.state.votingEnabledProjects[i].projectID === this.state.currentProject.projectID) {
        client.send(JSON.stringify({
          sender:"adminDash",
          action: "getRemainingVoters"
        }))
      }
    }
  }

  render() {
      return (
        <>
          <Content>
            <div  className="bx--grid bx--grid--full-width adminPageBody">
              <div className='bx--row vote-dashboard-page__banner'>
                <div><h1 className="vote-dashboard-page__heading">Voting Dashboard</h1></div>
                <div>
                  <div>
                    <InlineLoading
                    style={{ marginLeft: '1rem'}}
                    description={this.state.connectionMessage}
                    status={this.state.connectionStatus}
                  />
                  </div>
                  <div>
                    <button style={{display:this.state.reconnectButtonDisplay}} className='reconnectButton' onClick={() => this.connectWebSocket()}><Renew size={20}/></button>
                  </div>
                </div>
              </div>
              <div className='bx--row' style={{backgroundColor:this.state.currentProject.projectDomainColor, textAlign:'center'}}>
                <div className='bx--col'>
                  <p style={{fontWeight:'bold'}}>{this.state.currentProject.projectDomain}</p>
                </div>
              </div>
              <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r1'>
                <div className="bx--col ideaNameAndToggle">
                  <div>
                    <h1 style={{fontWeight:'bold', paddingLeft:'1rem'}}>{`${this.state.currentProject.projectID}: ${this.state.currentProject.projectDescription}`}</h1>
                  </div>
                  <div style={{paddingRight:"10%"}}>
                    <Toggle
                      id='voteControlToggle'
                      labelText="Idea Voting"
                      size="sm"
                      labelA="Disabled"
                      labelB="Enabled"
                      toggled={this.state.toggleChecked}
                      onToggle={(state) => {
                        this.setState({toggleChecked:state})
                        client.send(JSON.stringify({
                          sender:"adminDash",
                          source:"dashboard",
                          action: state ? "addProject":"removeProject",
                          payload: `{"id":"${this.state.currentProject.projectID}","description":"${this.state.currentProject.projectDescription}"}`
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r2'>
                <div className="vote-dashboard-page-voter-list">
                  {this.state.remainingVoters.map(office => {
                    return <div key={office}>
                      <Tile>
                        <div className='officeTile'>
                          <div id='office-icon-div'>
                            <img
                              className='office-icon'
                              src={`${process.env.PUBLIC_URL}/office_symbols/${office}.png`}
                              onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                              alt=''
                            />
                          </div>
                          <br/>
                          <div id='office-name-div'>{office}</div>
                        </div>
                      </Tile>
                    </div>
                  })}
                </div>
                <div style={{zIndex:'2'}}>
                  {this.state.remainingVoters.length > 0 ? <p>Remaining Voters: {this.state.remainingVoters.length}</p>:null}
                </div>
              </div>
            <div className='vote-dashboard-page__r4'>
              <div className='navControls'>
                <div style={{marginRight:'auto'}}>
                  <Button
                    iconDescription="Previous Idea"
                    disabled={this.state.previousButtonDisabled}
                    hasIconOnly={true}
                    renderIcon={ArrowLeft}
                    onClick={() => this.HandlePageChange("previousButton")}
                  />
                </div>
                <div style={{maxWidth:'75%',minWidth:'50%'}}>
                  <ComboBox
                    id="navigationCombo"
                    items={this.state.projects}
                    itemToString={(item) => item ? `${item.projectID}: ${item.projectDescription}` : ''}
                    onChange={(event) => {event.selectedItem && this.HandlePageChange("combobox",event.selectedItem.projectIndex)}}
                    direction="top"
                    selectedItem={this.state.currentProject}
                    helperText={`Idea ${this.state.currentProject.projectIndex + 1} of ${this.state.totalItems}`}
                    />
                </div>
                <div style={{marginLeft:'auto'}}>
                  <Button
                    iconDescription="Next Idea"
                    disabled={this.state.nextButtonDisabled}
                    hasIconOnly={true}
                    renderIcon={ArrowRight}
                    onClick={() => this.HandlePageChange("nextButton")}
                  />
                </div>
              </div>
            </div>
          </div>
          </Content>
        </>
      )
  }
}
export default VoteDashboardPage;