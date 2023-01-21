import React, { Component } from 'react'
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

class AdminLoginPage extends Component {
  
    constructor(props) {
        super(props)
        this.state = {
            usernameInvalid:false,
            passwordInvalid:false,
            redirect:false,
            notification:0
        }
    }
    
    componentDidMount() {}

    Login = async() => {

        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;
        
        this.setState({usernameInvalid: false, passwordInvalid: false});

        if (username === "") {
            this.setState({usernameInvalid: true});
            return;
        }
        
        if (password === "") {
            this.setState({passwordInvalid: true});
            return;
        }

        if (username !== "" && password !== "") {
            
            const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/adminlogin`, {
                method:'POST',
                mode:'cors',
                headers:{'Content-Type':'application/json'},
                body:`{"user":"${username}","pass":"${password}"}`
            })
            console.log(loginRequest);

            switch (loginRequest.status) {
                case 200:
                    const loginResult = await loginRequest.json()
                    localStorage.setItem("adminjwt", loginResult.jwt);
                    this.setState({redirect:true});
                    break;

                case 401:
                    this.setState({notification:this.state.notification + 1})
                    break;
                    
                default:
                    this.setState({notification:this.state.notification + 1})
                    break;

            }
        }
    }
    
  render() {
    return (
      <>
        <UserGlobalHeader/>
        {this.state.redirect ? <Navigate to='/adminhome'/>:null}
        <div id='loginBody'>
          <div id="loginContent">
            <Form>
              <Stack gap={7}>
                <TextInput
                  labelText="Username"
                  helperText=""
                  id="username"
                  invalid={this.state.usernameInvalid}
                  invalidText="This is a required field."
                  placeholder=""
                  />
                <PasswordInput
                  labelText="Password"
                  helperText=""
                  id="password"
                  invalid={this.state.passwordInvalid}
                  invalidText="This is a required field."
                  placeholder=""
                  tabIndex={0}
                  onKeyDown={event => {if (event.key === 'Enter'){this.Login()}}}
                  />
                {this.state.notification === 0 ? null:<InlineNotification
                key={this.state.notification}
                kind="error"
                role="alert"
                title="Login failure: "
                subtitle="invalid username or password"/>
                }
                <Button kind='primary' tabIndex={0} onClick={() => this.Login()}>Login</Button>
              </Stack>
            </Form>     
          </div>
        </div>
      </>
    );
  }
}

export default AdminLoginPage;