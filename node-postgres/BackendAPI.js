//allows access to .env file for environment variable declaration
require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const auth_model = require('./auth_model');
const offices_model = require('./offices_model');
const projects_model = require('./projects_model');
const voter_model = require('./voter_model');
const votes_model = require('./votes_model');
const excel_model = require('./excel_model');
const participant_action_model = require('./participant_action_model');

const app = express().use('*', cors());

app.use(express.json());
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', process.env.API_ACCESS_CONTROL_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});

app.get('/exportexcel/:slice', (req, res) => {
  excel_model.exportExcel(req.params.slice)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/projects', (req, res) => {
  projects_model.getProjects()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getallvotes', (req, res) => {
  votes_model.getAllVotes()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/votes/:projectID', (req, res) => {
  votes_model.getVotesByProject(req.params.projectID)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getvoterinfo/:token', (req, res) => {
  participant_action_model.getParticipantInfo(req.params.token)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getallvoters', (req, res) => {
  voter_model.getAllVoters()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/offices', (req, res) => {
  offices_model.getOffices()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getvotesbyoffice/:officeName', (req, res) => {
  votes_model.getVotesByOffice(req.params.officeName)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getsequencenumber', (req, res) => {
  projects_model.getSequenceNumber()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/verifyjwt/:token', (req, res) => {
  auth_model.verifyJwt(req.params.token)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/votes/checkvote/:voteTag', (req,res) => {
  votes_model.checkVote(req.params.voteTag)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getdomains', (req,res) => {
  projects_model.getDomains()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getallchangelogs', (req,res) => {
  votes_model.getAllChangeLogs()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.get('/getchangelogbyid/:voteId', (req,res) => {
  votes_model.getChangeLogById(req.params.voteId)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/adddomain', (req, res) => {
  projects_model.addDomain(req.body.domainName, req.body.colorHex)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/editdomain', (req, res) => {
  projects_model.editDomain(req.body.domainId, req.body.domainName, req.body.colorHex)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/adminlogin', (req, res) => {
  auth_model.adminLogin(req.body.user, req.body.pass)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/userlogin', (req, res) => {
  auth_model.userLogin(req.body.jwt)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/userlogout', (req, res) => {
  auth_model.userLogout(req.body.voterId)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/register', (req, res) => {
  participant_action_model.registerParticipant(req.body)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/submitvote', (req, res) => {
  votes_model.submitVote(req.body)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/addproject', (req, res) => {
  projects_model.addProject(
    req.body.projectID,
    req.body.projectDescription,
    req.body.projectSequence,
    req.body.projectDomainId
  )
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/addoffice', (req, res) => {
    offices_model.addOffice(req.body)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {
      res.status(500).send(error);
    })
  
})

app.post('/editproject', (req, res) => {
  projects_model.editProject(
    req.body.previousProjectID,
    req.body.newProjectSequence,
    req.body.newProjectID,
    req.body.newProjectDescription,
    req.body.newProjectDomain
  )
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.post('/votes/editvote', (req, res) => {
  votes_model.editVote(req.body)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/deletevoter', (req, res) => {
  voter_model.deleteVoter(req.body.voterID)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/deleteproject', (req, res) => {
  projects_model.deleteProject(req.body.projectID)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/deleteoffice', (req, res) => {
  offices_model.deleteOffice(req.body)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/deletedomain', (req, res) => {
  projects_model.deleteDomain(req.body.domainId)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/votes/deletevote', (req, res) => {
  votes_model.deleteVote(req.body.voteID)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/resetvotes', (req, res) => {
  votes_model.resetVoteTable()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/resetprojects', (req, res) => {
  projects_model.resetProjectsTable()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/resetusers', (req, res) => {
  voter_model.resetParticipantsTable()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/resetlogs', (req, res) => {
  votes_model.resetLogTable()
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.listen(process.env.API_LISTENING_PORT, () => {
  console.log(`Postgres API running on port ${process.env.API_LISTENING_PORT}.`)
})