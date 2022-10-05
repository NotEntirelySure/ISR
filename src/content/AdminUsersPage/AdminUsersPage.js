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
} from 'carbon-components-react';
import { Logout32, TrashCan32, Renew32 } from '@carbon/icons-react';

const headers = [
  {key: 'voterid', header: 'User ID'},
  {key: 'title', header: 'Title'},
  {key: 'fname', header: 'First Name'},
  {key: 'lname', header: 'Last Name'},
  {key: 'office', header: 'Office'},
  {key: 'loggedin', header:'Logged In?'},
  {key: 'action', header: 'Action'}
];

class AdminUsersPage extends Component {
  
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
          title:data.rows[i].participanttitle,
          fname:data.rows[i].participantfname,
          lname:data.rows[i].participantlname,
          office:data.rows[i].participantoffice,
          loggedin:data.rows[i].participantloggedin ? "Yes":"No",
          action:
            <>
              <Button 
                hasIconOnly
                renderIcon={TrashCan32}
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
                renderIcon={Logout32}
                iconDescription='Log user out'
                kind="primary"
                onClick={() => this.LogUserOut(data.rows[i].participantid)}
              />
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
            <p>Are you sure you want to delete {this.state.userToDelete.title} {this.state.userToDelete.fname} {this.state.userToDelete.lname}?</p>
        </Modal>
        <Content>
          <div className="bx--offset-lg-1 bx--grid bx--grid--full-width useradminpage">
            <DataTable
              id="userTable"
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
                <TableContainer title="Users" description="Displays list of all registered users">
                  <TableToolbar>
                    <TableToolbarContent>
                        <TableToolbarSearch onChange={onInputChange} />
                    </TableToolbarContent>
                    <Button renderIcon={Renew32} hasIconOnly iconDescription='Refresh Table' onClick={() => this.GetAllUsers()}/>
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

export default AdminUsersPage;