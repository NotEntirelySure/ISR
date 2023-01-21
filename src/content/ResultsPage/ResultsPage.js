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
		
    setConnectionStatus("active")
    setConnectionMessage("Connecting...");

		const uniqueConnection = `resultsPage-${Date.now()}-${Math.floor(Math.random()*1000)}`
    let client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/${uniqueConnection}`);

    client.onopen = () => {
			setConnectionStatus("finished")
    	setConnectionMessage("Connected");
      client.send(JSON.stringify({sender:"client",id:uniqueConnection, msg:"getResults"}))
    };

    client.onmessage = (message) => {
      console.info("message received")
			const messageData = JSON.parse(message.data);
			//only executes if the data from the web sockets server is chart data to publish
			if (messageData.action === "publish") {

				let dataArray = [];
				let scaleObj = {};
				messageData.data.data.map(
					(idea) => {
						let name = `${idea.rank}) ${idea.projectID}: ${idea.projectDescription}`;
						dataArray.push({
							"group":name,
							"value":parseFloat(idea.averageScore)
						})
						scaleObj[name] = idea.projectdomaincolorhex
					}
				)

				setChartData(dataArray.reverse());
				setChartOptions({
					"title": "",
					"axes": {
						"left": {
							"mapsTo": "group",
							"scaleType": "labels",
							"truncation": {
								"type": "end_line",
								"threshold": 56,
								"numCharacter": 56
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
					}
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
						<h1 className="results-page__heading">ISR {`${new Date().getFullYear()}`} Voting Results</h1>
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
								subtitle="There are no results to show at this time. Please check back later."
								hideCloseButton={true}
							/>
						</div>
				}
			</div>
		</>
	)
}