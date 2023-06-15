import React, { useState, useEffect, useRef } from 'react'
import { w3cwebsocket } from "websocket";
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionItem,
  Button,
  Content,
  InlineLoading,
  Modal,
  RadioButton,
  RadioButtonGroup,
  Theme,
  ToastNotification,
  OrderedList,
  ListItem,
  Dropdown
} from '@carbon/react';
import { Renew } from '@carbon/react/icons';
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
  const [notificationInfo, setNotificationInfo] = useState({
    source:"",
    count:0,
    kind:"success",
    title:"",
    message:"",
  });
  const [notificationList, setNotificationList] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => Login(),[]);
  useEffect(() => {if (voterInfo.office) ConnectWebSocket()},[voterInfo]);
  useEffect(() => {
    setNotificationList(previousState => [...previousState, notificationInfo]);
    ShowToast()
  },[notificationInfo]); 
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
              <p>Only one participant from the same office may be logged in at a time. If you wish to vote in the ISR, you can do one of the following:</p>
              <div style={{marginLeft:'5%'}}>
                <OrderedList>
                  <ListItem>Contact the person from your office and ask them to logout.</ListItem>
                  <ListItem>Return to the registration page and register under a different office.</ListItem>
                  <ListItem>Contact the system administrator and ask them to log the other person out.</ListItem>
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
      const initialHistory = historyResponse.historyData.map(item => {
        return {
          source:"initialLoad",
          kind:"success",
          title:"Success!",
          message:`Your ${item.votevalue === 0 ? 'abstain vote':`vote of ${item.votevalue}`} for idea ${item.voteideaid} was successfully submitted.`,
          timestamp: new Date(item.votetime).toLocaleString()
        };
      });
      setNotificationList(initialHistory);
    };
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

    client.onmessage = (message) => {
      let data = JSON.parse(message.data);
      let objIdeas = [];
      for (var i=0; i<data.length; i++) {
        objIdeas.push( {
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
          setNotificationInfo({
            source:"user",
            count:notificationInfo.count + 1,
            kind:"error",
            title:`Error: ${voteResponse.code}`,
            message:`There was a problem submitting your ${voteData.current.value === 0 ? 'abstain vote':`vote of ${voteData.current.value}`} for idea ${voteData.current.idea}. (${voteResponse.message})`,
            timestamp: new Date().toLocaleString()
          });
        }
        if (voteResponse.code === 200) {
          setNotificationInfo({
            source:"user",
            count:notificationInfo.count + 1,
            kind:"success",
            title:"Success!",
            message:`Your ${voteData.current.value === 0 ? 'abstain vote':`vote of ${voteData.current.value}`} for idea ${voteData.current.idea} was successfully submitted.`,
            timestamp: new Date().toLocaleString()
          });
          client.send(JSON.stringify({
            sender:"client",
            office:voterInfo.office,
            msg: "voted"
          }));
          voteData.current = ({"idea":"","value":null});
        }
      }
      catch (err) {
       setNotificationInfo({
          source:"user",
          count:notificationInfo.count + 1,
          kind:"error",
          title:`Error: ${err.message}`,
          message:`There was a problem submitting your ${voteData.current.value === 0 ? 'abstain vote':`vote of ${voteData.current.value}`} for idea ${voteData.current.idea}.`,
          timestamp: new Date().toLocaleString()
        });
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
      let slideout = document.getElementById('notification');
      slideout.classList.toggle('visible');
      //toggle the visibility back to hidden. If this doesn't happen, the next button click will not show the notification (it will take 2 clicks to show).
      setTimeout(() => slideout.classList.toggle('visible'), 5000);
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
        notificationData={notificationList}
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
        acknowledgment="true"
        preventCloseOnClickOutside={true}
        primaryButtonText="Register"
        onRequestClose={() => navigate('/register')}
        onRequestSubmit={() => navigate('/register')}
      >
        {modalInfo.message}
      </Modal>
      <div id="notification" ref={notificationRef}>   
        <ToastNotification
          className='bx--toast-notification'
          open={notificationOpen}
          key={notificationInfo.count}
          timeout={0}
          kind={notificationInfo.kind}
          lowContrast={false}
          role='alert'
          title={notificationInfo.title}
          subtitle={notificationInfo.message}
          iconDescription='Icon description (iconDescription)'
          statusIconDescription='describes the status icon'
          hideCloseButton={false}
          onCloseButtonClick={() => setNotificationOpen(false)}
        />
      </div>
      <div style={{minHeight:"100vh"}}>
        <div id='headerContainer' style={{backgroundColor:themeValues.headerColor}}>
          <div id='titleContainer'>
            <h1>Idea Voting</h1>
            <br/>
            <div id='userInfo'>
              <div>
                <img
                  id='user-icon'
                  src={`${process.env.PUBLIC_URL}/office_symbols/${voterInfo.office}.png`}
                  onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                  alt=''
                />
              </div>
              <div >
                <h4>{isAuth ? `${voterInfo.title} ${voterInfo.firstName} ${voterInfo.lastName} (${voterInfo.office})`:null}</h4>
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
            <div id='tileContainer'>
              {ideas.length === 0 ? <>
                <div 
                  className="tile"
                  style={{
                    backgroundColor:themeValues.tileColor,
                    boxShadow:themeValues.shadowColor,
                    padding:'3rem 2rem 3rem 2rem'
                  }}
                >
                  <div>
                    <p>No ideas to vote on at this time.</p>
                  </div>
                </div>
              </>:
                ideas.map((idea, index) => {
                  return <>
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
                          >
                            Submit Vote
                          </Button>
                        </div>
                        <div id={`loading-${idea.ideaId}`} style={{display:showLoading}}>
                          <InlineLoading status="active" description="Submitting vote..."/>
                        </div>
                      </div>
                    </div>
                  </>
                })
              }
            </div>
          </Content>
        </div>
      </Theme>
    </>
  );
}