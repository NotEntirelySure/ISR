import React, { Component } from 'react'
import { Buffer } from 'buffer';
import { Content } from 'carbon-components-react';
import AdminGlobalHeader from "../AdminGlobalHeader";
import UserGlobalHeader from '../UserGlobalHeader';
import AdminHomePage from "../../content/AdminHomePage";
import VoteDashboardPage from '../../content/VoteDashboardPage';
import AdminUsersPage from '../../content/AdminUsersPage';
import ManageProjectsPage from '../../content/ManageProjectsPage';
import AdminConnectionsPage from '../../content/AdminConnectionsPage';
import AdminVotesPage from '../../content/AdminVotesPage';
import StatisticsPage from '../../content/StatisticsPage';
import AdminOfficesPage from '../../content/AdminOfficesPage';
import LandingPage from "../../content/LandingPage";
import TestPage from '../../content/TestPage';
import AdminDomainsPage from '../../content/AdminDomainsPage';

class ProtectedRoute extends Component {
    constructor(props) {
        super(props)
        this.state = {isAuth:null}
      }

    componentDidMount = async() => {

        const token = localStorage.getItem("adminjwt");
        if (token !== null) {
            const jwtResult = await fetch(`${process.env.REACT_APP_API_BASE_URL}/verifyjwt/${token}`, {mode:'cors'});
            const userType = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString('ascii')).type;
            if (jwtResult.status === 200 && userType === "admin") {this.setState({isAuth:true});}
            if (jwtResult.status === 401) {this.setState({isAuth:false})}
        }
        if (token === null) {this.setState({isAuth:false})}
    }
    
    render() {

        switch (this.state.isAuth) {
            case true:
                let page; 
                switch (this.props.page) {
                    case "adminhome": 
                        page = <AdminHomePage/>;
                        break;
                    case "votedashboard":
                        page = <VoteDashboardPage/>;
                        break;
                    case "manageprojects":
                        page = <ManageProjectsPage/>;
                        break;
                    case "useradmin":
                        page = <AdminUsersPage/>;
                        break;
                    case "connections":
                        page = <AdminConnectionsPage/>;
                        break;
                    case "votesadmin":
                        page = <AdminVotesPage/>;
                        break;
                    case "statistics":
                        page = <StatisticsPage/>;
                        break;
                    case "officesadmin":
                        page = <AdminOfficesPage/>;
                        break;
                    case "domainsadmin":
                        page = <AdminDomainsPage/>;
                        break;
                    case "test":
                        page = <TestPage/>;
                        break;
                    default:
                        page = <LandingPage/>;
                        break;

                }
                return <><AdminGlobalHeader/><Content>{page}</Content></>
            case false: 
                return <>
                    <UserGlobalHeader/>
                    <Content>
                        <div id='forbidden'>
                            <div>
                                <img src={`${process.env.PUBLIC_URL}/403.png`} alt='Forbidden'></img>
                            </div>
                        </div>
                    </Content>
                </>
            default: return <><div></div></>
        } 
    }

}

export default ProtectedRoute;