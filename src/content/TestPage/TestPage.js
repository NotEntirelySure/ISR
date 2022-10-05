import React, { Component } from 'react';
import { Bar } from '@ant-design/plots';
class TestPage extends Component {

  state = {
    projects:[],
    voterInfo:"",
    clientsNotVoted:""
  }

  componentDidMount() {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/projects`, {mode:'cors'})
      .then(response => response.json())
      .then(data => {

      let projectList = [];
      for (var i=0; i<data.rows.length; i++) {
        
        projectList.push({
          id:String(i+1),
          rank:0,
          projectID: data.rows[i].projectid,
          projectDescription: data.rows[i].projectdescription,
          totalScore:i+1
        });
      }
      this.setState({projects: projectList});
    });
  }

  DemoBar = () => {
    let antdata = [];
    for (let i=0; i<this.state.projects.length;i++){
      antdata.push({idea:`#${i}) ${this.state.projects[i].projectID}: ${this.state.projects[i].projectDescription}`,value:this.state.projects[i].totalScore})
    }  
    
    const config = {
      data:antdata,
      xField: 'value',
      yField: 'idea',
      seriesField: 'idea',
      legend: {
        position: 'bottom-left',
      },
    };
    return <Bar {...config} />;
  };
  render() {
    return (
      <>
        
          <div style={{height:'100vh'}}>
            <this.DemoBar></this.DemoBar>
          </div>
      
      </>
    )
  }
}

export default TestPage;