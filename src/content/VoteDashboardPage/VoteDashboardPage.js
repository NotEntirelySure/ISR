import React, { useState, useEffect, useRef } from 'react'
import { w3cwebsocket } from "websocket";
import {
  Button,
  ComboBox,
  InlineLoading,
  Modal,
  Toggle
} from '@carbon/react';
import { ArrowLeft, ArrowRight, Renew } from '@carbon/react/icons';

var client;

export default function VoteDashboardPage() {

  const [toggleChecked, setToggleChecked] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("inactive");
  const [remainingVoters, setRemainingVoters] = useState([]);
  const [currentIdea, setCurrentIdea] = useState({});
  const [votingEnabledIdeas, setVotingEnabledIdeas] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectButtonDisplay, setReconnectButtonDisplay] = useState("none");
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [previousButtonDisabled, setPreviousButtonDisabled] = useState(true);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState({heading:"", message:""});
  const [ideas, setIdeas] = useState([{
    "ideaIndex":0,
    "ideaId":'0000',
    "ideaDescription": null,
    "ideaDomain":"none",
    "ideaDomainColor":'#FFFFFF'
  }]);
  
  useEffect(() => {GetIdeas();},[])

  useEffect(() => {
    if (connectionStatus !== "finished") return;
    //this is setup to prevent a race condition that seems to be happening, where the websocket opens and data is being sent, but the socket is still in the connecting status.
    if (client && client.readyState === WebSocket.OPEN) GetEnabledIdeas();
    else {setTimeout(GetEnabledIdeas,1000)}
  },[connectionStatus]);

  async function GetIdeas() {
    const ideasRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const ideasResponse = await ideasRequest.json();
    if (ideasResponse.code !== 200) {
      setErrorInfo({heading:`Error ${ideasResponse.code}`, message:ideasResponse.message});
      setModalErrorOpen(true);
      return;
    }
    if (ideasResponse.data.rowCount === 0) {
      setModalErrorOpen(true);
      setErrorInfo(
        {
          heading:"No Ideas Registered",
          message:"There are no ideas registered in the database. At least one idea must be registered before the dashboard can be used."
        }
      );
    }
    if (ideasResponse.data.rowCount > 0) {

      const ideasArray = ideasResponse.data.rows.map((idea, index) => {
        return {
          "ideaIndex":index,
          "ideaId":idea.ideaid,
          "ideaDescription":idea.ideadescription,
          "ideaDomain":idea.ideadomainname,
          "ideaDomainColor":idea.ideadomaincolorhex
        }
      });
      setIdeas(ideasArray);
      setCurrentIdea(ideasArray[0]);
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
    };
    
    client.onmessage = (message) => {
      const messageData = JSON.parse(message.data);
      const payload = JSON.parse(messageData.payload);
      let votingIdeas = [];

      switch (messageData.source) {
        case "getVotingEnabledIdeas":
          for (let i=0; i<payload.length;i++) votingIdeas.push({ideaId:payload[i].id});
          setVotingEnabledIdeas(votingIdeas);
          break;
        
        case "getRemainingVoters":
          if (payload.length > 0) setRemainingVoters(payload);
          break;
        
        case "addIdea":
          if (payload.length > 0) setRemainingVoters(payload);
          break;

        case "removeIdea":
          if (payload.length > 0) {
            for (let i=0; i<payload.length;i++) votingIdeas.push({ideaId:payload[i].id});
            setVotingEnabledIdeas(votingIdeas);
          }
          break;

        case "clientVoted":
          setRemainingVoters(payload);
          break;
      }
    };
    
    client.onclose = () => {
      
      setConnectionStatus("error");
      setConnectionMessage("Disconnected from server");

      if (reconnectAttempts <= 2) {
        setReconnectAttempts(reconnectAttempts + 1);
        console.log("connection attempt:",reconnectAttempts)
        setTimeout(() => {ConnectWebSocket()}, 1500);
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

  function GetEnabledIdeas() {
    client.send(
      JSON.stringify({
        sender:"adminDash",
        action: "getVotingEnabledIdeas",
      })
    );
  }

  function HandlePageChange(changeSource, comboboxValue) {
    if (toggleChecked) {
      setToggleChecked(false);
      client.send(
        JSON.stringify({
          sender:"adminDash",
          source:"dashboard",
          action:"removeIdea",
          payload:`{"id":"${currentIdea.ideaId}","description":"${currentIdea.ideaDescription}"}`
        })
      );
    }

    switch (changeSource) {
      case "previousButton":
        let prevIndex = currentIdea.ideaIndex - 1;
        if (prevIndex <= 0) setPreviousButtonDisabled(true);
        if (currentIdea.ideaIndex > 0) {
          setNextButtonDisabled(false);
          setRemainingVoters([]);
          setCurrentIdea(ideas[prevIndex])
        }
        break;
      case "nextButton":
        let nextIndex = currentIdea.ideaIndex + 1
        if (nextIndex >= ideas.length - 1) setNextButtonDisabled(true);
        if (nextIndex <= ideas.length - 1) {
          setRemainingVoters([]);
          setPreviousButtonDisabled(false);
          setCurrentIdea(ideas[nextIndex]);
        }
        break;
      case "combobox":
        if (comboboxValue === ideas.length - 1) setNextButtonDisabled(true);
        else if (nextButtonDisabled) setNextButtonDisabled(false);
        if (comboboxValue === 0 ) setPreviousButtonDisabled(true);
        else if (previousButtonDisabled) setPreviousButtonDisabled(false);
        setRemainingVoters([]);
        setCurrentIdea(ideas[comboboxValue]);
    }

    for (let i=0;i<votingEnabledIdeas.length; i++){
      if (votingEnabledIdeas[i].ideaId === currentIdea.ideaId) {
        client.send(
          JSON.stringify({
            sender:"adminDash",
            action: "getRemainingVoters"
          })
        );
      };
    };
  };

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
      <div className="adminPageBody">
        <div className='vote-dashboard-page__banner'>
          <div><h1 className="vote-dashboard-page__heading">Voting Dashboard</h1></div>
          <div className='headingToolBar'>
            <div style={{display:'flex'}}>
              <div>
                <InlineLoading
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
            <div className='votingToggle'>
              <Toggle
                id='voteControlToggle'
                size="sm"
                labelA="Voting Disabled"
                labelB="Voting Enabled"
                toggled={toggleChecked}
                onToggle={state => {
                  setToggleChecked(state);
                  client.send(
                    JSON.stringify({
                      sender:"adminDash",
                      source:"dashboard",
                      action: state ? "addIdea":"removeIdea",
                      payload: `{"id":"${currentIdea.ideaId}","description":"${currentIdea.ideaDescription}"}`
                    })
                  );
                }}
              />
            </div>
          </div>
        </div>
        <div style={{backgroundColor:currentIdea.ideaDomainColor, textAlign:'center'}}>
          <div>
            <p style={{fontWeight:'bold'}}>{currentIdea.ideaDomain}</p>
          </div>
        </div>
        
        <div className='vote-dashboard-page__row'>
          <div className="ideaName">
            <div>
              <h1 className='ideaTitle'>{`${currentIdea.ideaId}: ${currentIdea.ideaDescription}`}</h1>
            </div>
          </div>
        </div>
        <div className='vote-dashboard-page__row'>
          <div className="vote-dashboard-page-voter-list">
            {
              remainingVoters.map(office => {
                return <>
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
                </>
              })
            }
          </div>
        </div>
        <div className='vote-dashboard-page__row'>
          <div style={{position:'absolute', bottom:'2rem'}}>
            {remainingVoters.length > 0 ? <p className='remainingVoters'>Remaining Voters: {remainingVoters.length}</p>:null}
          </div>
          <div className='navControls'>
            <div>
              <Button
                iconDescription="Previous Idea"
                disabled={previousButtonDisabled}
                hasIconOnly={true}
                renderIcon={ArrowLeft}
                onClick={() => HandlePageChange("previousButton")}
              />
            </div>
            <div style={{minWidth:'50vw'}}>
              <ComboBox
                id="navigationCombo"
                items={ideas}
                itemToString={item => item ? `${item.ideaId}: ${item.ideaDescription}` : ''}
                onChange={event => {event.selectedItem && HandlePageChange("combobox",event.selectedItem.ideaIndex)}}
                direction="top"
                selectedItem={currentIdea}
                helperText={`Idea ${currentIdea.ideaIndex + 1} of ${ideas.length}`}
              />
            </div>
            <div>
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
    </>
  )
}