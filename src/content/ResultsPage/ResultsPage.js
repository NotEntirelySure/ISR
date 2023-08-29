import React, { useEffect, useState } from 'react';
import UserGlobalHeader from '../../components/UserGlobalHeader';
import { w3cwebsocket } from 'websocket';
import { InlineLoading, InlineNotification } from '@carbon/react';
import { SimpleBarChart } from "@carbon/charts-react";

//needed for the chart to display correctly
import "@carbon/styles/css/styles.css";
import "@carbon/charts/styles.css";

export default function ResultsPage () {
	
	const [chartData, setChartData] = useState();
	const [chartOptions, setChartOptions] = useState();
	const [connectionMessage, setConnectionMessage] = useState("");
	const [connectionStatus, setConnectionStatus] = useState("active");
	
	useEffect(() => {
		
    setConnectionStatus("active");
    setConnectionMessage("Connecting...");

		if (!sessionStorage.getItem('resultsPageId')) sessionStorage.setItem('resultsPageId',`resultsPage-${Date.now()}-${Math.floor(Math.random()*1000)}`)
		const connectionId = sessionStorage.getItem('resultsPageId');
    let client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/${connectionId}`);

    client.onopen = () => {
			setConnectionStatus("finished")
    	setConnectionMessage("Connected to server");
      client.send(JSON.stringify({sender:"client",id:connectionId, msg:"getResults"}))
    };

    client.onmessage = (message) => {
			const messageData = JSON.parse(message.data);
			if (!messageData.chartData) return;
			if (messageData.chartData.length === 0) setChartData(null);
			//only executes if the data from the web sockets server is chart data to publish
			if (messageData.chartData.length > 0 && messageData.action === "publish") {
				let scaleObj = {};
				const data = messageData.chartData.map(idea => {
					let name = `${idea.rank}) ${idea.ideaId}: ${idea.ideaDescription}`;
					scaleObj[name] = idea.ideadomaincolorhex ? idea.ideadomaincolorhex:'#7F7F7F'
					return {
						"group":name,
						"value":isNaN(idea.averageScore) ? 0:parseFloat(idea.averageScore)
					};
				});

				let threshold;
				if (window.innerWidth <= 500) {console.log("500");threshold = 38};
				if (window.innerWidth > 500 && window.innerWidth <= 1500) {console.log("500-1000");threshold = 56};
				if (window.innerWidth > 1500) {console.log("1000+");threshold = 112};
				
				setChartData(data.reverse());
				setChartOptions({
					"title": "",
					"axes": {
						"left": {
							"mapsTo": "group",
							"scaleType": "labels",
							"truncation": {
								"type": "end_line",
								"threshold": threshold,
								"numCharacter":threshold
							}
						},
						"bottom": {
							"mapsTo": "value"
						}
					},
					"color": {
						"pairing": {
							"option": 2
						},
						"scale":scaleObj
					},
					"legend":{"enabled":false},
					"height":messageData.chartData.length > 25 ? "3000px":"1000px",
					"bars":{"width":15}
				})
			};
		}
    client.onclose = () => {
      setConnectionStatus("error");
      setConnectionMessage("Disconnected");
    }

    client.onerror = (event) => {
      console.log(event);
      setConnectionStatus("error");
      setConnectionMessage("Failed to connect to server");
      console.log("the websocket server is down");
    }

	},[])
	
	return (
		<>
			<UserGlobalHeader notificationActive={false} isAuth={false}/>

			<div className='results-page__banner'>
				<div style={{display:'flex', justifyContent:"space-between"}}>
					<div>
						<h1 className="results-page__heading">{`FY ${new Date().getFullYear()+2} ISR`} Voting Results</h1>
					</div>
					<div style={{paddingRight:'2rem'}}>
            <InlineLoading description={connectionMessage} status={connectionStatus}/>   
					</div>
				</div>
			</div>
			<div style={{margin:'1rem'}}>
				{
					chartData && chartOptions ?
						<div style={{animation:'fadein 1s'}}>
							<SimpleBarChart data={chartData} options={chartOptions}/>
						</div>
					:
						<div style={{display:'flex',justifyContent:'center', marginTop:'5rem'}}>
							<InlineNotification
								title="Nothing to Display"
								kind="info"
								subtitle="There are no results to show at this time. Please check back later."
								hideCloseButton={true}
							/>
						</div>
				}
			</div>
		</>
	)
}