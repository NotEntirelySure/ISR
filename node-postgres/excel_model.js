const votes_model = require('./votes_model');
const auth_model = require('./auth_model');
const FileSaver = require('xlsx');
const fs = require ("fs");
const XLSX = require('xlsx');
const XLSXChart = require ("xlsx-chart");
const { start } = require('repl');
const Pool = require('pg').Pool

const pool = new Pool({
  user: process.env.API_BASE_SUPERUSER_ACCOUNT,
  host: process.env.API_BASE_HOST_URL,
  database: process.env.API_BASE_DATABASE_NAME,
  password: process.env.API_BASE_SUPERUSER_PASSWORD,
  port: process.env.API_BASE_PORT_NUMBER,
});

async function exportExcel(data) {
	return new Promise(async(resolve, reject) => {
		
		const isAuthReqest = await auth_model._verifyAdmin(data.split('&')[1]);
		const isAuthResponse = await isAuthReqest;
			
		if (isAuthResponse.code !== 200) resolve(isAuthResponse);
		if (isAuthResponse.code === 200) {
			const slice = data.split('&')[0];
			const votes = await pool.query('SELECT * FROM votes;');
			const ideas = await pool.query('SELECT ideaid, ideadescription FROM ideas ORDER BY ideasequence;');

			//create hashmap of ideas and total scores.
			let objVoteTotals = {};
			let objVoteCount = {};

			for (let i=0; i<votes.rows.length; i++) {
				//omit any 0 values from the calculation. This prevents abstain votes from skewing the average down.
				if(votes.rows[i].votevalue !== 0){
					if (votes.rows[i].voteideaid in objVoteTotals) {
						objVoteTotals[votes.rows[i].voteideaid] = objVoteTotals[votes.rows[i].voteideaid] + votes.rows[i].votevalue;
						objVoteCount[votes.rows[i].voteideaid]++;
					}
					else {
						objVoteTotals[votes.rows[i].voteideaid] = votes.rows[i].votevalue;
						objVoteCount[votes.rows[i].voteideaid] = 1;
					};  
				};
			};
			//update state with score values of objVoteTotals
			let ideaRankList = [];

			for (let i=0; i<ideas.rows.length; i++) {
				let average = (objVoteTotals[ideas.rows[i].ideaid]/objVoteCount[ideas.rows[i].ideaid]).toFixed(2);
				if (isNaN(average)) average = 0;
				ideaRankList.push({
					ideaID:ideas.rows[i].ideaid,
					ideaDescription:ideas.rows[i].ideadescription,  
					totalScore:objVoteTotals[ideas.rows[i].ideaid],
					averageScore:average
				});
			};
			//sort highest to lowest.
			ideaRankList.sort((a, b) => b.averageScore - a.averageScore);
				
			let chartSlice, startInt;
			switch (slice) {
						
				case "all":
					chartSlice = ideaRankList.slice();
					startInt = 1;
					break;

				case "first":
					chartSlice = ideaRankList.slice(0, 25);
					startInt = 1;
					break;
					
				case "second":
					chartSlice = ideaRankList.slice(25, 50);
					startInt = 26;
					break;
						
				case "third":
					chartSlice = ideaRankList.slice(50, 75);
					startInt = 51;
					break;

				case "fourth":
					chartSlice = ideaRankList.slice(75, 100);
					startInt = 76;
					break;
						
				case "fifth":
					chartSlice = ideaRankList.slice(100, 125);
					startInt = 101;
					break;

				case "sixth":
					chartSlice = ideaRankList.slice(125, 150);
					startInt = 126;
					break;

				case "remainder":
					chartSlice = ideaRankList.slice(150)
					startInt = 151;
					break;
						
				default:
					chartSlice = ideaRankList.slice();
					startInt = 1;
					break;
			};
				
			let ideaTitle;
			let chartFields = [];
			let chartData = {"Score": {}};

			for (let i=0; i<chartSlice.length; i++){
				ideaTitle = `#${startInt}) ${chartSlice[i].ideaID}: ${chartSlice[i].ideaDescription}`;
				chartFields.push(ideaTitle);
				chartData.Score[ideaTitle] = chartSlice[i].averageScore;
				startInt++;
			}
				
			//Reverse order of items in array. This is done because the excel output displays the items in reverse order, so in order for the highest ranking idea to show up at the top of the bar chart, it must be last in the list.
			chartFields.reverse();
				
			//export data to chart
			var xlsxChart = new XLSXChart ();
			const opts = {
				chart: "bar",
				titles: ["Score"],
				fields: chartFields,
				data: chartData,
				chartTitle: "Average Score"
			};

			xlsxChart.generate (opts, (err, data) => {
				if (err) resolve({code:500, message:err});
				resolve(data);
			});
		};
	});
};
module.exports = {exportExcel};