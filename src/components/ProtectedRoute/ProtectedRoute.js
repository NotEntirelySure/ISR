import React, {useState, useEffect, useRef } from 'react'
import { Buffer } from 'buffer';
import { Content } from 'carbon-components-react';
import AdminGlobalHeader from "../AdminGlobalHeader";
import UserGlobalHeader from '../UserGlobalHeader';
import AdminHomePage from "../../content/AdminHomePage";
import VoteDashboardPage from '../../content/VoteDashboardPage';
import AdminUsersPage from '../../content/AdminUsersPage';
import ManageProjectsPage from '../../content/AdminIdeasPage';
import AdminConnectionsPage from '../../content/AdminConnectionsPage';
import AdminVotesPage from '../../content/AdminVotesPage';
import StatisticsPage from '../../content/StatisticsPage';
import AdminOfficesPage from '../../content/AdminOfficesPage';
import LandingPage from "../../content/LandingPage";
import TestPage from '../../content/TestPage';
import AdminDomainsPage from '../../content/AdminDomainsPage';

export default function ProtectedRoute(props) {
	
	const [isAuth, setIsAuth] = useState(null);
	
	useEffect(() => VerifyJwt(),[]);
	
	async function VerifyJwt() {
		const token = localStorage.getItem("adminjwt");
		if (token !== null) {
			const jwtRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/verifyjwt/${token}`, {mode:'cors'});
			const jwtResult = await jwtRequest.json();
			if (jwtResult.code === 200 && jwtResult.data.type === "admin") setIsAuth(true);
			if (jwtResult.code === 401) setIsAuth(false);
		}
		if (token === null) setIsAuth(false);
	};

	function RenderPage() {
		switch (isAuth) {
			case true:
				let page;
				switch (props.page) {
					case "adminhome": 
						page = <AdminHomePage/>;
						break;
					case "votedashboard":
						page = <VoteDashboardPage/>;
						break;
					case "ideasadmin":
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
					default: page = <LandingPage/>;
				}
				return <><AdminGlobalHeader activePage={props.page}/><Content children={page}/></>;
				case false: 
					return <>
						<UserGlobalHeader/>
							<div id='forbidden'>
								<div>
									<img src={`${process.env.PUBLIC_URL}/403.png`} alt='Forbidden'></img>
								</div>
							</div>
						</>;
				default: return <><div></div></>;
		};
	};

	return <RenderPage/>;
};