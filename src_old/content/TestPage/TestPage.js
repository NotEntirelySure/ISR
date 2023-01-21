import React, { Component } from 'react'
import { 
    Button, 
    DataTable,
    Content,
    Modal,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
} from '@carbon/react';
import { Logout, TrashCan, Renew } from '@carbon/react/icons';

const headers = [
  {key: 'voterid', header: 'User ID'},
  {key: 'fname', header: 'First Name'},
  {key: 'lname', header: 'Last Name'},
  {key: 'loggedin', header:'Logged In?'},
  {key: 'action', header: 'Action'}
];

class TestPage extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      rows: [{id:'0', voterid:'-', title:'-', fname:'-', lname:'-', office: '-', action:"-"}],
      modalOpen: false,
      userToDelete: {
        voterid:"",
        title:"",
        fname:"",
        lname:""
      }
    }
  }

  componentDidMount() {this.GetAllUsers();}
  
  GetAllUsers = () => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/getvoterinfo/all`, {mode:'cors'})
    .then(response => response.json())
    .then(data => {
  
      let users = [];
      for (let i=0; i<data.rows.length; i++){
        users.push({
          id:String(data.rows[i].participantid),
          voterid:data.rows[i].participantid,
          fname:data.rows[i].participantfname,
          lname:data.rows[i].participantlname,
          loggedin:data.rows[i].participantloggedin ? "Yes":"No",
          action:
            <>
              <div style={{marginTop:'-1rem'}}>
                <Button 
                  hasIconOnly
                  renderIcon={TrashCan}
                  iconDescription='Delete User'
                  kind="danger"
                  onClick={() => {
                    this.setState({userToDelete:{
                      voterid:data.rows[i].participantid,
                      title:data.rows[i].participanttitle,
                      fname:data.rows[i].participantfname,
                      lname:data.rows[i].participantlname
                    }})
                    this.setState({modalOpen:true})
                  }}
                />
                <Button 
                  hasIconOnly
                  disabled={!data.rows[i].participantloggedin}
                  renderIcon={Logout}
                  iconDescription='Log user out'
                  kind="primary"
                  onClick={() => this.LogUserOut(data.rows[i].participantid)}
                />
              </div>
            </>
          }
        )
      }
      this.setState({rows: users});
    })
  }

  DeleteUser = () => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/deletevoter`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"voterID":"${this.state.userToDelete.voterid}"}`    
    })
      .then(response => response.json())
      .then(data => {
        if (data.severity === 'ERROR') {alert(data.severity + ": " + data.detail)}
        else {this.GetAllUsers();}
      })
  }

  LogUserOut = async(voterId) => {
    const logoutRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userlogout`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"voterId":"${voterId}"}`    
    })
    const logoutResponse = await logoutRequest.json();
    this.GetAllUsers();
  }

  render() {
    return (
      <>  
        <Modal
          danger
          modalHeading='Confirm Delete'
          primaryButtonText="Delete"
          secondaryButtonText="Cancel"
          onRequestClose={() => this.setState({modalOpen: false})}
          onRequestSubmit={() => {
            this.setState({modalOpen: false});
            this.DeleteUser();
            }
          }
          open={this.state.modalOpen}>
            <p>Are you sure you want to delete {this.state.userToDelete.fname} {this.state.userToDelete.lname}?</p>
        </Modal>
        <Content>
          <div className="bx--offset-lg-1 bx--grid bx--grid--full-width adminPageBody">
            <DataTable
              id="userTable"
              stickyHeader={false}
              rows={this.state.rows}
              headers={headers}
              isSortable={true}
              render={({
                rows,
                headers,
                getHeaderProps,
                getRowProps,
                getTableProps,
                onInputChange
              }) => (
                <TableContainer 
                  title="Users"
                  description="Displays list of all registered users"
                >
                  <TableToolbar>
                    <TableToolbarContent>
                        <TableToolbarSearch onChange={onInputChange} />
                    </TableToolbarContent>
                    <Button renderIcon={Renew} hasIconOnly={false} iconDescription='Refresh Table' onClick={() => this.GetAllUsers()}/>
                  </TableToolbar>
                  <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headers.map((header) => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>)
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              />
          </div>
        </Content>
      </>
    );
  }
}

export default TestPage;