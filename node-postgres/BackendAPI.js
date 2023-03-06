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

app.get('/export/excelchart/:data', (req, res) => {
  excel_model.exportExcel(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/ideas/getall/:token', (req, res) => {
  projects_model.getProjects(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
})

app.get('/votes/getall/:token', (req, res) => {
  votes_model.getAllVotes(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

//Need to confirm that this is still used.
app.get('/votes/:projectID', (req, res) => {
  votes_model.getVotesByProject(req.params.projectID)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/participants/getinfo/:token', (req, res) => {
  participant_action_model.getParticipantInfo(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/participants/getall/:token', (req, res) => {
  voter_model.getAllParticipants(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/offices/getall', (req, res) => {
  offices_model.getOffices()
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/votes/getbyoffice/:data', (req, res) => {
  votes_model.getVotesByOffice(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/getsequencenumber', (req, res) => {
  projects_model.getSequenceNumber()
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/verifyjwt/:token', (req, res) => {
  auth_model.verifyJwt(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/votes/check/:data', (req,res) => {
  votes_model.checkVote(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/domains/getall/:token', (req,res) => {
  projects_model.getDomains(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/changelogs/getall/:token', (req,res) => {
  votes_model.getAllChangeLogs(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/changelog/getbyid/:data', (req,res) => {
  votes_model.getChangeLogById(req.params.data)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.get('/votes/getparticipanthistory/:token', (req,res) => {
  participant_action_model.getVoteHistory(req.params.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/domains/add', (req, res) => {
  projects_model.addDomain(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/domains/edit', (req, res) => {
  projects_model.editDomain(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/login/admin', (req, res) => {
  auth_model.adminLogin(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/participants/login', (req, res) => {
  auth_model.userLogin(req.body.jwt)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/participants/logout', (req, res) => {
  //checks if the participant is requesting their own logout or if the admin is doing it.
  if (req.body.source === "participant") participant_action_model.logoutParticipant(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));

  if (req.body.source === "admin") auth_model.participantLogout(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
})

app.post('/participants/register', (req, res) => {
  participant_action_model.registerParticipant(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/votes/cast', (req, res) => {
  participant_action_model.castVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.post('/votes/add', (req, res) => {
  votes_model.addVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.post('/ideas/add', (req, res) => {
  projects_model.addIdea(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.post('/ideas/edit', (req, res) => {
  projects_model.editIdea(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.post('/offices/add', (req, res) => {
  offices_model.addOffice(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error))
});

app.post('/votes/edit', (req, res) => {
  votes_model.editVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/participants/delete', (req, res) => {
  voter_model.deleteParticipant(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/ideas/delete', (req, res) => {
  projects_model.deleteIdea(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/offices/delete', (req, res) => {
  offices_model.deleteOffice(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/domains/delete', (req, res) => {
  projects_model.deleteDomain(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
})

app.delete('/votes/delete', (req, res) => {
  votes_model.deleteVote(req.body)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/votes/deleteall', (req, res) => {
  votes_model.deleteAllVotes(req.body.token)
    .then(response => res.status(200).send(response))
    .catch(error => res.status(500).send(error));
});

app.delete('/resetvotes/:token', (req, res) => {
  votes_model.resetVoteTable(req.params.token)
  .then(response => res.status(200).send(response))
  .catch(error => res.status(500).send(error));
});

app.delete('/resetprojects/:token', (req, res) => {
  projects_model.resetProjectsTable(req.params.token)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/resetusers/:token', (req, res) => {
  voter_model.resetParticipantsTable(req.params.token)
  .then(response => {
    res.status(200).send(response);
  })
  .catch(error => {
    res.status(500).send(error);
  })
})

app.delete('/resetlogs/:token', (req, res) => {
  votes_model.resetLogTable(req.params.token)
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