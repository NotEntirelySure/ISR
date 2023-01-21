import React, { useState } from 'react'
import { Navigate } from 'react-router-dom';
import {
    Button,
    Form,
    InlineNotification,
    PasswordInput,
    Stack,
    TextInput
} from '@carbon/react';
import UserGlobalHeader from '../../components/UserGlobalHeader';

export default function AdminLoginPage() {
  
  const [usernameInvalid, setUsernameInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [notification, setNotification] = useState(0);
  
  async function Login() {

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    
    setUsernameInvalid(false);
    setPasswordInvalid(false);

    if (username === "") {
      setUsernameInvalid(true);
      return;
    };
    
    if (password === "") {
      setPasswordInvalid(true);
      return;
    };

    if (username !== "" && password !== "") {
        
      const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/adminlogin`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:`{"user":"${username}","pass":"${password}"}`
      });

      const loginResult = await loginRequest.json();
      
      switch (loginResult.result) {
        case 200:
          localStorage.setItem("adminjwt", loginResult.jwt);
          setRedirect(true);
          break;

        case 401:
          setNotification(notification + 1);
          break;
            
        default:
          setNotification(notification + 1);
          break;
      };
    }
  }

  return (
    <>
      <UserGlobalHeader/>
      {redirect ? <Navigate to='/adminhome'/>:null}
      <div id='loginBody'>
        <div id="loginContent">
          <Form>
            <Stack gap={7}>
              <TextInput
                labelText="Username"
                helperText=""
                id="username"
                invalid={usernameInvalid}
                invalidText="This is a required field."
                placeholder=""
                />
              <PasswordInput
                labelText="Password"
                helperText=""
                id="password"
                invalid={passwordInvalid}
                invalidText="This is a required field."
                placeholder=""
                tabIndex={0}
                onKeyDown={event => {if (event.key === 'Enter'){Login()}}}
                />
              {notification === 0 ? null:<InlineNotification
              key={notification}
              kind="error"
              role="alert"
              title="Login failure: "
              subtitle="invalid username or password"/>
              }
              <Button kind='primary' tabIndex={0} onClick={() => Login()}>Login</Button>
            </Stack>
          </Form>     
        </div>
      </div>
    </>
  );
};