import React, { useState, useEffect, useRef } from 'react'
import { w3cwebsocket } from "websocket";
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionItem,
  Button,
  Content,
  Dropdown,
  InlineLoading,
  InlineNotification,
  ListItem,
  Modal,
  OrderedList,
  RadioButton,
  RadioButtonGroup,
  Theme,
  ToastNotification,
} from '@carbon/react';
import { Renew, Send } from '@carbon/react/icons';
import UserGlobalHeader from '../../components/UserGlobalHeader';

var client;

export default function UserVotePage() {

  const notificationRef = useRef();
  const voteData = useRef({"idea":"","value":null});

  const navigate = useNavigate();

  const [isAuth, setIsAuth] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [voteButtonDisabled, setVoteButtonDisabled] = useState(false);
  const [showLoading, setShowLoading] = useState('none');
  const [currentTheme, setCurrentTheme] = useState("white");
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    status:"inactive",
    message:"",
    displayReconnect:'none'
  });
  const [themeValues, setThemeValues] = useState({
    headerColor:'#f4f4f4',
    tileColor:'#f4f4f4',
    shadowColor:'10px 10px 5px #d3d3d3'
  });
  const [voterInfo, setVoterInfo] = useState({
    id:"",
    title:"",
    firstName:"",
    lastName:"",
    office:null
  });
  const [modalInfo, setModalInfo] = useState({
    open:false,
    heading:"",
    message:""
  });
  const [notificationInfo, setNotificationInfo] = useState({});

  useEffect(() => {Login()},[]);
  useEffect(() => {if (voterInfo.office) ConnectWebSocket()},[voterInfo]);
  useEffect(() => {ShowToast();},[notificationInfo]);
  useEffect(() => {if (connectionAttempts > 0) ConnectWebSocket();},[connectionAttempts])

  async function Login() {

    const token = localStorage.getItem("jwt");

    if (token === null) {
      setModalInfo({
        heading:"Not Registered",
        message:<><p>You must register before you are able to vote.</p></>,
        open:true
      })
    }

    if (token !== null) {

      const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/login`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({"jwt":token})
      });
      const loginResponse = await loginRequest.json();

      switch (loginResponse.code) {
        case 200:
          const voterInfoRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/getinfo/${localStorage.getItem("jwt")}`, {mode:'cors'})
          const voterInfoResponse = await voterInfoRequest.json();
          setVoterInfo({
            id:voterInfoResponse.rows[0].participantid,
            title:voterInfoResponse.rows[0].participanttitle,
            firstName:voterInfoResponse.rows[0].participantfname,
            lastName:voterInfoResponse.rows[0].participantlname,
            office:voterInfoResponse.rows[0].officename,
          });
          setIsAuth(true)
          GetVoteHistory();
          break;
        case 401:
          setModalInfo({
            heading:"Not Registered",
            message:<><p>You must register before you are able to vote.</p></>,
            open:true
          });
          break;
        case 601:
          setModalInfo({
            heading:"Other Participant Logged In",
            message:<>
              <p>You have been registered in the system, however, another participant from your office is currently logged in.</p>
              <br/>
              <p>Only one participant from the same office may be logged in at a time. If you wish to vote in the ISR, you can do one of the following:</p>
              <div style={{marginLeft:'2rem'}}>
                <OrderedList>
                  <ListItem>Contact the person from your office, who is currently logged in, and ask them to logout.</ListItem>
                  <ListItem>Contact the system administrator and ask them to log the person out.</ListItem>
                </OrderedList>
              </div>
            </>,
            open:true
          });
          break;
        case 602:
          setModalInfo({
            heading:"Session Expired",
            message:<><p>Your session has expired. Please visit the registration page to reregister.</p></>,
            open:true
          });
          break;
      };

    };
  };

  async function GetVoteHistory() {
    const historyRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/getparticipanthistory/${localStorage.getItem('jwt')}`, {mode:'cors'});
    const historyResponse = await historyRequest.json();
    if (historyResponse.code === 200) {
      const initialHistory = historyResponse.historyData.map(item => (
        {
          kind:"success",
          title:"Success!",
          message:`Your ${item.votevalue === 0 ? 'abstain vote':`vote of ${item.votevalue}`} for idea ${item.voteideaid} was successfully submitted.`,
          timestamp: new Date(item.votetime).toLocaleString()
        }
      ));
      setNotificationInfo({source:'initialLoad', payload:initialHistory.reverse()});
    }
  };

  function ConnectWebSocket() {
    setConnectionInfo({
      ...connectionInfo,
      ["status"]:"active",
      ["message"]:"Connecting...",
      ["displayReconnect"]:'none',
    });

    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/${voterInfo.office}`);

    client.onopen = () => {
      setConnectionInfo({
        status:"finished",
        message:"Connected to server",
        displayReconnect:'none',
      });
      if (connectionAttempts !== 0) setConnectionAttempts(0);
    };

    client.onmessage = message => {
      const data = JSON.parse(message.data);
      if (data.source && data.source === "adminUsers" && data.action === "logout") {
        setModalInfo({
          heading:"Logout",
          message:<><p>You have been logged out by an administrator. If you believe this was done in error, please contact your system administrator.</p></>,
          open:true
        })
      }
      const objIdeas = [];
      for (let i=0; i<data.length; i++) {
        objIdeas.push({
          ideaId: data[i].id,
          ideaDescription: data[i].description
        });
      }
      setIdeas(objIdeas);
    };

    client.onclose = () => {
      setConnectionInfo({
        ...connectionInfo,
        ["status"]:"error",
        ["message"]:"Disconnected from server."
      })
      if (connectionAttempts <= 2) {
        setTimeout(() => {
          setConnectionAttempts(connectionAttempts + 1);
        },1200);
      }
      if (connectionAttempts >= 3) {
        setConnectionInfo({
          status:"error",
          message:"Failed to connect to server",
          displayReconnect:"block"
        })
        setConnectionAttempts(4);
      }
    }

    client.onerror = () => {
      setConnectionInfo({
        ...connectionInfo,
        ["status"]:"error",
        ["message"]:"Failed to connect to server"
      })
      console.info("An error occured while attempting to connect to the web socket server.")
    }

  }

  async function SubmitVote(buttonSource) {

    /*the below "if" ensures that a value has been selected and that the source of the button click is from the same tile.
    This prevents instances where there are multiple tiles, someone selects a value from one tile, they click the
    "submit" button from a different tile, and it actually submits. Without this check, that behavior would be successful.*/

    if (voteData.current.value !== null && voteData.current.idea === buttonSource) {
      let requestData = {
        "participantId":voterInfo.id,
        "ideaId":voteData.current.idea,
        "voteValue":voteData.current.value,
        "source":"user"
      };

      setShowLoading('block');
      setVoteButtonDisabled(true);

      try {
        const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/cast`, {
          method:'POST',
          mode:'cors',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({values:requestData,token:localStorage.getItem('jwt')})
        })
        const voteResponse = await voteRequest.json();

        if (voteResponse.code !== 200) {
          setNotificationInfo(
            {
              source:"user",
              payload: {
                count:notificationInfo.count + 1,
                kind:"error",
                title:`Error: ${voteResponse.code}`,
                message:`There was a problem submitting your ${voteData.current.value === 0 ? 'abstain vote':`vote of ${voteData.current.value}`} for idea ${voteData.current.idea}. (${voteResponse.message})`,
                timestamp: new Date().toLocaleString()
              }
            }
          );
        }
        if (voteResponse.code === 200) {
          setNotificationInfo(
            {
              source:"user",
              payload:{
                count:notificationInfo.count + 1,
                kind:"success",
                title:"Success!",
                message:`Your ${voteData.current.value === 0 ? 'abstain vote':`vote of ${voteData.current.value}`} for idea ${voteData.current.idea} was successfully submitted.`,
                timestamp: new Date().toLocaleString()
              }
            }
          );
          client.send(JSON.stringify({
            sender:"client",
            office:voterInfo.office,
            msg: "voted"
          }));
          voteData.current = ({"idea":"","value":null});
        }
      }
      catch (err) {
        setNotificationInfo(
          {
            source:"user",
            payload: {
              count:notificationInfo.count + 1,
              kind:"error",
              title:`Error: ${err.message}`,
              message:`There was a problem submitting your ${voteData.current.value === 0 ? 'abstain vote':`vote of ${voteData.current.value}`} for idea ${voteData.current.idea}.`,
              timestamp: new Date().toLocaleString()
            }
          }
        );
      }

      setShowLoading('none');
      setVoteButtonDisabled(false);

    }
  }

  function BuildRadioButtons(ideaId) {

    const radioButtons = [
      <RadioButton
        key={`${ideaId}-0`}
        labelText="abstain"
        value={0}
        id={`radio-${ideaId}-0`}
      />
    ];
    for (let i=1; i<11; i++) {
        radioButtons.push(
          <RadioButton
            key={`${ideaId}-${i}`}
            labelText={i}
            value={i}
            id={`radio-${ideaId + i}`}
          />
        )
    }
    return radioButtons;
  }

  function ShowToast() {
    if (notificationInfo.source === "user") {
      setNotificationOpen(true);
      setTimeout(() => setNotificationOpen(false),5000);
    }
}

function HandleThemeChange(selectedTheme) {
  setCurrentTheme(selectedTheme);
  switch (selectedTheme) {
    case "white":
      setThemeValues({
          headerColor:'#f4f4f4',
          tileColor:'#f4f4f4',
          shadowColor:'10px 10px 5px #d3d3d3'
        })
      break;
    case "g100":
      setThemeValues({
        headerColor:'#262626',
        tileColor:'#393939',
        shadowColor:'10px 10px 5px #6c6c6c'
      })
      break;
    default:
      setThemeValues({
        headerColor:'#f4f4f4',
        tileColor:'#f4f4f4',
        shadowColor:'10px 10px 5px #d3d3d3'
      })
  }

}

  return (
    <>
      <UserGlobalHeader
        onThemeChange={theme => HandleThemeChange(theme)}
        notificationActive={isAuth}
        isAuth={isAuth}
        notificationData={notificationInfo}
        userInfo={{
          "voterID":voterInfo.id,
          "title":voterInfo.title,
          "fname":voterInfo.firstName,
          "lname":voterInfo.lastName,
          "office":voterInfo.office
          }}
        />
      <Theme theme={currentTheme}>
      <Modal
        modalHeading={modalInfo.heading}
        open={modalInfo.open}
        size='sm'
        preventCloseOnClickOutside={true}
        primaryButtonText={modalInfo.heading === "Not Registered" ? "Register":"Ok"}
        onRequestClose={() => modalInfo.heading === "Not Registered" ? navigate('/register'):navigate('/')}
        onRequestSubmit={() => modalInfo.heading === "Not Registered" ? navigate('/register'):navigate('/')}
        children={modalInfo.message}
      />
      <div
        className={`notification ${notificationOpen ? 'show':''}`}
        ref={notificationRef}
      >
        <ToastNotification
          className='bx--toast-notification'
          open={notificationOpen}
          key={notificationInfo.payload && (notificationInfo.payload.count)}
          timeout={0}
          kind={notificationInfo.payload && (notificationInfo.payload.kind)}
          lowContrast={false}
          role='alert'
          title={notificationInfo.payload && (notificationInfo.payload.title)}
          subtitle={notificationInfo.payload && (notificationInfo.payload.message)}
          iconDescription='Icon description (iconDescription)'
          statusIconDescription='describes the status icon'
          hideCloseButton={false}
          onCloseButtonClick={() => setNotificationOpen(false)}
        />
      </div>
      <div style={{minHeight:"100vh"}}>
        <div id='headerContainer' style={{backgroundColor:themeValues.headerColor}}>
          <div id='titleContainer'>
            <h1 className='headerText'>Idea Voting</h1>
            <br/>
            <div className='userInfo'>
              <div>
                <img
                  className='user-icon'
                  src={`${process.env.PUBLIC_URL}/office_symbols/${voterInfo.office}.png`}
                  onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                  alt=''
                />
              </div>
              <div >
                <h4 className='user-title'>{isAuth ? `${voterInfo.title} ${voterInfo.firstName} ${voterInfo.lastName} (${voterInfo.office})`:null}</h4>
              </div>
            </div>
          </div>
          <div style={{float:'right'}}>
            <div style={{display:'flex'}}>
              <div>
                <InlineLoading description={connectionInfo.message} status={connectionInfo.status}/>
              </div>
              <div>
                <button style={{display:connectionInfo.displayReconnect}} className='reconnectButton' onClick={() => ConnectWebSocket()}><Renew size={20}/></button>
              </div>
            </div>
          </div>
        </div>
          <div>
            <Accordion>
              <AccordionItem open={false} title="Voting Criteria">
                <div id="votingCriteriaContainer">
                  <div>
                    <img id="votingCriteriaImage" src={`${process.env.PUBLIC_URL}/Voting_criteria.png`} alt='Voting Criteria'></img>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
          <Content>
            <div>
              {ideas.length === 0 ? 
              <>
                <div className='votingDisabledNotification'>
                  <InlineNotification
								    title="Voting Disabled"
                    kind='info'
								    subtitle="There are no ideas to vote on at this time."
								    hideCloseButton={true}
                  />
                </div>
              </>:ideas.map((idea, index) => (
                <>
                  <div className='tileContainer'>
                    <div
                      className="tile"
                      style={{backgroundColor:themeValues.tileColor, boxShadow:themeValues.shadowColor}}
                    >
                      <div><p>{`${idea.ideaId}: ${idea.ideaDescription}`}</p></div>
                      <hr/>
                      <div className='highResContainer'>
                        <div>
                        <RadioButtonGroup
                          key={idea.ideaId + index}
                          legendText='Vote Value'
                          name={`radio-group-${idea.ideaId}`}
                          onChange={value => voteData.current = {"idea":idea.ideaId,"value":value}}
                        >
                          {BuildRadioButtons(idea.ideaId)}
                        </RadioButtonGroup>
                        </div>
                      </div>
                      <div className='lowResContainer'>
                        <div style={{padding:"0rem 1rem 0rem 1rem"}}>
                          <Dropdown
                            id="votedropdown"
                            titleText='Vote value'
                            label='Select'
                            items={[
                              { id: '0', value:0, text: 'Abstain' },
                              { id: '1', value:1, text: '1 (Impact low/none)' },
                              { id: '2', value:2, text: '2 (Impact low/none)' },
                              { id: '3', value:3, text: '3 (Low impact)' },
                              { id: '4', value:4, text: '4 (Low impact)' },
                              { id: '5', value:5, text: '5 (Medium impact)' },
                              { id: '6', value:6, text: '6 (Medium impact)' },
                              { id: '7', value:7, text: '7 (Medium impact)' },
                              { id: '8', value:8, text: '8 (High impact)' },
                              { id: '9', value:9, text: '9 (High impact)' },
                              { id: '10', value:10, text: '10 (High impact)' },
                            ]}
                            itemToString={item => (item ? item.text : '')}
                            onChange={event => voteData.current = {"idea":idea.ideaId,"value":event.selectedItem.value}}
                          />
                        </div>
                      </div>
                      <div style={{display:'flex', alignItems:'center'}}>
                        <div style={{padding:'1rem'}}>
                          <Button
                            id={`vote-button-${idea.ideaId}`}
                            onClick={() => SubmitVote(idea.ideaId)}
                            disabled={voteButtonDisabled}
                            children={<><Send/> Submit</>}
                          />
                        </div>
                        <div id={`loading-${idea.ideaId}`} style={{display:showLoading}}>
                          <InlineLoading status="active" description="Submitting vote..."/>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
                ))
              }
            </div>
          </Content>
        </div>
      </Theme>
    </>
  );
}