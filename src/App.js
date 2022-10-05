import React, { Children, Component } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Content } from 'carbon-components-react';

import './app.scss';
import AdminLoginPage from './content/AdminLoginPage';
import RegistrationPage from './content/RegisterationPage';
import LandingPage from './content/LandingPage';
import UserVotePage from './content/UserVotePage';
import ProtectedRoute from './components/ProtectedRoute';

document.title = "ISR Voting System";

class App extends Component {
  
  render() {
    
    return (
      <>
        <Content>
          <Routes>
            <Route path="/adminhome" element={<ProtectedRoute page="adminhome"/>}/>
            <Route path="/votedashboard" element={<ProtectedRoute page="votedashboard"/>}/>
            <Route path="/manageprojects" element={<ProtectedRoute page="manageprojects"/>}/>
            <Route path="/useradmin" element={<ProtectedRoute page="useradmin"/>}/>
            <Route path="/connections" element={<ProtectedRoute page="connections"/>}/>
            <Route path="/votesadmin" element={<ProtectedRoute page="votesadmin"/>}/>
            <Route path="/statistics" element={<ProtectedRoute page="statistics"/>}/>
            <Route path="/officesadmin" element={<ProtectedRoute page="officesadmin"/>}/>
            <Route path="/domainsadmin" element={<ProtectedRoute page="domainsadmin"/>}/>
            <Route path='/test' element={<ProtectedRoute page="test"/>}/>
          
            <Route exact path="/" element={<LandingPage />} />
            <Route path="/vote" element={<UserVotePage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
          </Routes>
        </Content>
      </>
    );
  }
}

export default App;