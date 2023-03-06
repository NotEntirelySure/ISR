import React, { useState, useEffect, useRef } from 'react'
import { w3cwebsocket } from "websocket";
import {
  Button,
  Content,
  InlineLoading,
  Tile,
  Toggle,
  Pagination,
  ComboBox,
  Modal
} from '@carbon/react';
import { ArrowLeft, ArrowRight, Renew } from '@carbon/react/icons';

var client;

export default function VoteDashboardPage() {

  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("inactive");
  const [projects, setProjects] = useState([]);
  const [remainingVoters, setRemainingVoters] = useState([]);
  const [totalItems, setTotalItems] = useState(0); // this is likely unneeded. I can probable just use projects.length instead of using a state for this.
  const [currentProject, setCurrentProject] = useState({});
  const [votingEnabledProjects, setVotingEnabledProjects] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectButtonDisplay, setReconnectButtonDisplay] = useState("none"); //this likely needs to be changed to control through the style prop
  const [toggleChecked, setToggleChecked] = useState(false); // this could probably be a ref. Its used to check if the toggle is check. Could use toggleRef.current.value maybe.
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [previousButtonDisabled, setPreviousButtonDisabled] = useState(true);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState({heading:"", message:""});

  useEffect(() => GetIdeas(),[])

  async function GetIdeas() {
    const projectsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/projects/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const projectsResponse = await projectsRequest.json();
    if (projectsResponse.code !== 200) {
      setErrorInfo({heading:`Error ${projectsResponse.code}`, message:projectsResponse.message});
      setModalErrorOpen(true);
      return;
    }
    if (projectsResponse.data.rowCount === 0) {
      setProjects(
        {
          "projectIndex":0,
          "projectID":'0000',
          "projectDescription": null,
          "projectDomain":"none",
          "projectDomainColor":'#FFFFFF'
        }
      );
      setModalErrorOpen(true);
      setErrorInfo(
        {
          heading:"No Ideas Registered",
          message:"There are no ideas registered in the database. At least one idea must be registered before the dashboard can be used."
        }
      );
    }
    if (projectsResponse.data.rowCount > 0) {

      const objProjects = projectsResponse.data.rows.map((idea, index) => {
        return {
          "projectIndex":index,
          "projectID":idea.projectid,
          "projectDescription":idea.projectdescription,
          "projectDomain":idea.projectdomainname,
          "projectDomainColor":idea.projectdomaincolorhex
        }
      })
      setProjects(objProjects);
      setTotalItems(projectsResponse.rowCount);
      setCurrentProject(objProjects[0]);
      ConnectWebSocket();
    }
  }

  function ConnectWebSocket() {
    
    setConnectionStatus("active");
    setConnectionMessage("Connecting...");
    setReconnectButtonDisplay("none");
    
    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/adminDash`);

    client.onopen = () => {
      setConnectionStatus("finished");
      setConnectionMessage("Connected to server");
      setReconnectAttempts(0);

      client.send(
        JSON.stringify({
          sender:"adminDash",
          action: "getVotingEnabledProjects",
        })
      )
    };
    
    client.onmessage = (message) => {
      const messageData = JSON.parse(message.data);
      let payload;
      let votingProjects = [];

      switch (messageData.source) {
        case "getVotingEnabledProjects":
          payload = JSON.parse(messageData.payload);
          for (let i=0; i<payload.length;i++) {votingProjects.push({projectID:payload[i].id})}
          setVotingEnabledProjects(votingProjects);
          break;
        
        case "getRemainingVoters":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) setRemainingVoters(JSON.parse(messageData.payload));
          break;
        
        case "addProject":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) setRemainingVoters(JSON.parse(messageData.payload));
          break;

        case "removeProject":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) {
            payload = JSON.parse(messageData.payload);
            for (let i=0; i<payload.length;i++) {votingProjects.push({projectID:payload[i].id})}
            setVotingEnabledProjects(votingProjects);
          }
          break;

        case "clientVoted":
          setRemainingVoters(JSON.parse(messageData.payload));
          break;
      }
    };
    
    client.onclose = () => {
      
      setConnectionStatus("error");
      setConnectionMessage("Disconnected from server");

      if (reconnectAttempts <= 2) {
        setReconnectAttempts(reconnectAttempts + 1);
        console.log("connection attempt:",reconnectAttempts)
        setTimeout(() => {this.connectWebSocket()}, 1500);
      }

      if (reconnectAttempts >= 3) {
        setConnectionStatus("error");
        setConnectionMessage("Failed to connect to server");
        setReconnectButtonDisplay("block");
      }
    }

    client.onerror = (event) => {
      console.log(event);
      setConnectionStatus("error");
      setConnectionMessage("Failed to connect to server");
      console.log("the websocket server is down");
    }
  }

  function HandlePageChange(changeSource, comboboxValue) {
    
    if (toggleChecked) {
      setToggleChecked(false);
      client.send(
        JSON.stringify({
          sender:"adminDash",
          source:"dashboard",
          action:"removeProject",
          payload:`{"id":"${currentProject.projectID}","description":"${currentProject.projectDescription}"}`
        })
      );
    }

    switch (changeSource) {
      case "previousButton":
        let prevIndex = currentProject.projectIndex - 1;
        if (prevIndex <= 0) setPreviousButtonDisabled(true);
        if (currentProject.projectIndex > 0) {
          setNextButtonDisabled(false);
          setRemainingVoters([]);
          setCurrentProject(projects[prevIndex])
        }
        break;
      case "nextButton":
        let nextIndex = currentProject.projectIndex + 1
        
        if (nextIndex >= projects.length - 1) setNextButtonDisabled(true);
        if (nextIndex <= projects.length - 1) {
          console.log("in if");
          setRemainingVoters([]);
          setPreviousButtonDisabled(false);
          setCurrentProject(projects[nextIndex]);
        }
        break;
      case "combobox":
        if (comboboxValue === totalItems - 1) setNextButtonDisabled(true);
        else if (nextButtonDisabled) setNextButtonDisabled(false);
        if (comboboxValue === 0 ) setPreviousButtonDisabled(true);
        else if (previousButtonDisabled) setPreviousButtonDisabled(false);
        setRemainingVoters([]);
        setCurrentProject(projects[comboboxValue]);
    }

    for (let i=0;i<votingEnabledProjects.length; i++){
      if (votingEnabledProjects[i].projectID === currentProject.projectID) {
        client.send(
          JSON.stringify({
            sender:"adminDash",
            action: "getRemainingVoters"
          })
        )
      }
    }
  }

  return (
    <>
      <Modal
        id='modalError'
        modalHeading={errorInfo.heading}
        primaryButtonText="Ok"
        onRequestClose={() => {
          setModalErrorOpen(false);
          setErrorInfo({heading:"", message:""});
          }
        }
        onRequestSubmit={() => {
          setModalErrorOpen(false);
          setErrorInfo({heading:"", message:""});
        }}
        open={modalErrorOpen}
      >
        <div>
          {errorInfo.message}
        </div>
      </Modal>
      <Content>
        <div  className="bx--grid bx--grid--full-width adminPageBody">
          <div className='bx--row vote-dashboard-page__banner'>
            <div><h1 className="vote-dashboard-page__heading">Voting Dashboard</h1></div>
            <div>
              <div>
                <InlineLoading
                style={{ marginLeft: '1rem'}}
                description={connectionMessage}
                status={connectionStatus}
              />
              </div>
              <div>
                <button
                  style={{display:reconnectButtonDisplay}}
                  className='reconnectButton'
                  onClick={() => ConnectWebSocket()}
                >
                  <Renew size={20}/>
                </button>
              </div>
            </div>
          </div>
          <div className='bx--row' style={{backgroundColor:currentProject.projectDomainColor, textAlign:'center'}}>
            <div className='bx--col'>
              <p style={{fontWeight:'bold'}}>{currentProject.projectDomain}</p>
            </div>
          </div>
          <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r1'>
            <div className="bx--col ideaNameAndToggle">
              <div>
                <h1 style={{fontWeight:'bold', paddingLeft:'1rem'}}>{`${currentProject.projectID}: ${currentProject.projectDescription}`}</h1>
              </div>
              <div style={{paddingRight:"10%"}}>
                <Toggle
                  id='voteControlToggle'
                  labelText="Idea Voting"
                  size="sm"
                  labelA="Disabled"
                  labelB="Enabled"
                  toggled={toggleChecked}
                  onToggle={(state) => {
                    setToggleChecked(state);
                    client.send(
                      JSON.stringify({
                        sender:"adminDash",
                        source:"dashboard",
                        action: state ? "addProject":"removeProject",
                        payload: `{"id":"${currentProject.projectID}","description":"${currentProject.projectDescription}"}`
                      })
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r2'>
            <div className="vote-dashboard-page-voter-list">
              {remainingVoters.map(office => {
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
              {remainingVoters.length > 0 ? <p>Remaining Voters: {remainingVoters.length}</p>:null}
            </div>
          </div>
        <div className='vote-dashboard-page__r4'>
          <div className='navControls'>
            <div style={{marginRight:'auto'}}>
              <Button
                iconDescription="Previous Idea"
                disabled={previousButtonDisabled}
                hasIconOnly={true}
                renderIcon={ArrowLeft}
                onClick={() => HandlePageChange("previousButton")}
              />
            </div>
            <div style={{maxWidth:'75%',minWidth:'50%'}}>
              <ComboBox
                id="navigationCombo"
                items={projects}
                itemToString={(item) => item ? `${item.projectID}: ${item.projectDescription}` : ''}
                onChange={(event) => {event.selectedItem && HandlePageChange("combobox",event.selectedItem.projectIndex)}}
                direction="top"
                selectedItem={currentProject}
                helperText={`Idea ${currentProject.projectIndex + 1} of ${projects.length}`}
              />
            </div>
            <div style={{marginLeft:'auto'}}>
              <Button
                iconDescription="Next Idea"
                disabled={nextButtonDisabled}
                hasIconOnly={true}
                renderIcon={ArrowRight}
                onClick={() => HandlePageChange("nextButton")}
              />
            </div>
          </div>
        </div>
      </div>
      </Content>
    </>
  )
}