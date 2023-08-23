import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Form,
    InlineNotification,
    Modal,
    PasswordInput,
    Stack,
    TextInput
} from '@carbon/react';
import UserGlobalHeader from '../../components/UserGlobalHeader';

export default function AdminLoginPage() {
  
  const navigate = useNavigate();
  
  const usernameRef = useRef('');
  const passwordRef = useRef('');
  const errorInfo = useRef({heading:"", message:""});

  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [usernameInvalid, setUsernameInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [notification, setNotification] = useState(0);
  
  async function Login() {
    
    setUsernameInvalid(false);
    setPasswordInvalid(false);

    if (usernameRef.current.value === "") {
      setUsernameInvalid(true);
      return;
    };
    
    if (passwordRef.current.value === "") {
      setPasswordInvalid(true);
      return;
    };

    if (usernameRef.current.value !== "" && passwordRef.current.value !== "") {
        
      const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login/admin`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:`{"user":"${usernameRef.current.value}","pass":"${passwordRef.current.value}"}`
      });

      const loginResponse = await loginRequest.json();
      
      switch (loginResponse.code) {
        case 200:
          localStorage.setItem("adminjwt", loginResponse.jwt);
          navigate('/adminhome');
          break;
        case 500:
          errorInfo.current = {heading:`Error ${loginResponse.code}`, message:loginResponse.message}
          setModalErrorOpen(true);
          break;
        default: setNotification(notification + 1);
      };
    }
  }

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
      <UserGlobalHeader notificationActive={false} isAuth={false}/>
      <div id='loginBody'>
        <div id="loginContent">
          <Form>
            <Stack gap={7}>
              <TextInput
                labelText="Username"
                ref={usernameRef}
                id="username"
                invalid={usernameInvalid}
                invalidText="This is a required field."
              />
              <PasswordInput
                labelText="Password"
                ref={passwordRef}
                id="password"
                invalid={passwordInvalid}
                invalidText="This is a required field."
                tabIndex={0}
                onKeyDown={event => {if (event.key === 'Enter'){Login()}}}
              />
              {
                notification === 0 ? 
                  null
                  :
                  <InlineNotification
                    key={notification}
                    kind="error"
                    role="alert"
                    title="Login failure: "
                    subtitle="invalid username or password"
                  />
              }
              <Button kind='primary' tabIndex={0} onClick={() => Login()}>Login</Button>
            </Stack>
          </Form>     
        </div>
      </div>
    </>
  );
};