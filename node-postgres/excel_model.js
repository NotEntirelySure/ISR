const XLSXChart = require ("xlsx-chart");
const { start } = require('repl');
const Pool = require('pg').Pool

const pool = new Pool({
  user: 'superuser',
  host: 'localhost',
  database: 'isr',
  password: 'root',
  port: 5432,
});

const exportExcel = async(slice) => {
    const votes = await pool.query('SELECT * FROM votes;');
    const projects = await pool.query('SELECT projectid, projectdescription FROM projects ORDER BY projectsequence;');

    //create hashmap of projects and total scores.
    let objVoteTotals = {};
    let objVoteCount = {};

    for (let i=0; i<votes.rows.length; i++) {
        //omit any 0 values from the calculation. This prevents abstain votes from skewing the average down.
        if(votes.rows[i].votevalue !== 0){
            if (votes.rows[i].voteprojectid in objVoteTotals) {
                objVoteTotals[votes.rows[i].voteprojectid] = objVoteTotals[votes.rows[i].voteprojectid] + votes.rows[i].votevalue;
                objVoteCount[votes.rows[i].voteprojectid]++;
            }
            else {
                objVoteTotals[votes.rows[i].voteprojectid] = votes.rows[i].votevalue;
                objVoteCount[votes.rows[i].voteprojectid] = 1;
            }  
        }
    }
    //update state with score values of objVoteTotals
    let projectRankList = [];

    for (let i=0; i<projects.rows.length; i++) {
        let average = (objVoteTotals[projects.rows[i].projectid]/objVoteCount[projects.rows[i].projectid]).toFixed(2);
        if (isNaN(average)) {average = 0;}
        projectRankList.push({
            projectID:projects.rows[i].projectid,
            projectDescription:projects.rows[i].projectdescription,  
            totalScore:objVoteTotals[projects.rows[i].projectid],
            averageScore:average
        })
    }
    //sort highest to lowest.
    projectRankList.sort((a, b) => b.averageScore - a.averageScore);
    
    let chartSlice, startInt;
    switch (slice) {
        
        case "all":
            chartSlice = projectRankList.slice();
            startInt = 1;
            break;

        case "first":
            chartSlice = projectRankList.slice(0, 25);
            startInt = 1;
            break;
        
        case "second":
            chartSlice = projectRankList.slice(25, 50);
            startInt = 26;
            break;
        
        case "third":
            chartSlice = projectRankList.slice(50, 75);
            startInt = 51;
            break;

        case "fourth":
            chartSlice = projectRankList.slice(75, 100);
            startInt = 76;
            break;
        
        case "fifth":
            chartSlice = projectRankList.slice(100, 125);
            startInt = 101;
            break;

        case "sixth":
            chartSlice = projectRankList.slice(125, 150);
            startInt = 126;
            break;

        case "remainder":
            chartSlice = projectRankList.slice(150)
            startInt = 151;
            break;
        
        default:
            chartSlice = projectRankList.slice();
            startInt = 1;
            break;
    }
    
    let projectTitle;
    let chartFields = [];
    let chartData = {"Score": {}};

    for (let i=0; i<chartSlice.length; i++){
        projectTitle = `#${startInt}) ${chartSlice[i].projectID}: ${chartSlice[i].projectDescription}`;
        chartFields.push(projectTitle);
        chartData.Score[projectTitle] = chartSlice[i].averageScore;
        startInt++;
    }
    
    //Reverse order of items in array. This is done because the excel output displays the items in reverse order, so in order for the highest ranking project to show up at the top of the bar chart, it must be last in the list.
    chartFields.reverse();
    
    //export data to chart
    var xlsxChart = new XLSXChart ();
    var opts = {
        chart: "bar",
        titles: ["Score"],
        fields: chartFields,
        data: chartData,
        chartTitle: "Average Score"
    };
    return new Promise(function(resolve, reject) {
        xlsxChart.generate (opts, function (err, data) {
            if (err) {reject(err);} 
            else {resolve(data);}
        })
    });
}
module.exports = {exportExcel};