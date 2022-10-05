import React, { Component } from 'react'
import { 
    Button, 
    Content,
    DataTable,
    DataTableSkeleton,
    TextInput,
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
import { Add16, TrashCan32 } from '@carbon/icons-react';

const headers = [
  {key:'officeID', header:'Office ID'},
  {key:'officeName', header:'Office Name'},
  {key:'action', header:'Action'}
];

class AdminOfficesPage extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      rows: [{
        id:'0',
        officeID:'-',
        officeName:'-',
        action: '-'
      }],
      officeToDelete: {officeName:""},
      modalDeleteOpen: false,
      modalAddOpen: false,
      addNameInvalid:false,
      invalidMessage:"",
      displayTable: 'none',
      displaySkeleton: 'block'
    }
  }

  componentDidMount() {this.GetOffices();}
    
  GetOffices = () => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/offices/`, {mode:'cors'})
    .then(response => response.json())
    .then(data => {
      let offices = [];
      for (let i=0; i<data.rows.length; i++){
        offices.push({
          id:String(i),
          officeID:data.rows[i].officeid,
          officeName:data.rows[i].officename,
          action:
            <>
              <Button 
                hasIconOnly
                renderIcon={TrashCan32}
                iconDescription='Delete office'
                kind="danger"
                onClick={() => {
                  this.setState({officeToDelete:{
                    officeID:data.rows[i].officeid,
                    officeName:data.rows[i].officename
                  }})
                  this.setState({modalDeleteOpen:true})
                }}
              />
            </>
        })
      }
      this.setState({
        rows:offices,
        displayTable:'block',
        displaySkeleton:'none'
      });

    })
  }

  AddOffice = async() => {

    let officeName = document.getElementById('addName').value;
    
    this.setState({
      addNameInvalid: false,
      invalidMessage: ""
    })

    const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/addoffice`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"officename":"${officeName}"}`   
    })

    const addResponse = await addRequest.json();
    
    if (addResponse.result && addResponse.result === "success") {
      this.setState({
        modalAddOpen: false,
        addNameInvalid:false,
        invalidMessage:""
      })
      document.getElementById('addName').value = "";
      this.GetOffices()
    }
    
    if (addResponse.addError && addResponse.addError === 600) {
      this.setState({
        addNameInvalid: true,
        invalidMessage:"The office name cannot be null"
      })
    }

    if (addResponse.addError && addResponse.addError === 601) {
      this.setState({
        addNameInvalid: true,
        invalidMessage:"The office name cannot contain any spaces"
      })
    }
    
  }

  DeleteOffice = async() => {
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/deleteoffice`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"officeID":"${this.state.officeToDelete.officeID}"}`    
    })
    this.GetOffices()
  }

  render() {
    return (
      <>
        <Modal
          id='modalAdd' 
          primaryButtonText="Add"
          secondaryButtonText="Cancel"
          shouldSubmitOnEnter={true}
          modalHeading='Add Office'
          onRequestClose={() => {
            this.setState({
              modalAddOpen: false,
              addNameInvalid:false,
              invalidMessage:""
            })
            document.getElementById("addName").value = "";
          }}
          onRequestSubmit={() => {this.AddOffice();}} 
          open={this.state.modalAddOpen}>
          
          <TextInput
            style={{ marginBottom: '1rem'}}
            labelText="Office Name"
            helperText=""
            id="addName"
            invalid={this.state.addNameInvalid}
            onKeyPress={() => {this.setState({addNameInvalid:false})}}
            invalidText={this.state.invalidMessage}
            placeholder="Enter the name of the office"
            tabIndex={0}
          />
        </Modal>
        <Modal
          danger
          modalHeading='Confirm Delete'
          primaryButtonText="Delete"
          secondaryButtonText="Cancel"
          onRequestClose={() => this.setState({modalDeleteOpen: false})}
          onRequestSubmit={() => {
            this.setState({modalDeleteOpen: false});
            this.DeleteOffice();
            }
          }
          open={this.state.modalDeleteOpen}>
            <p>Are you sure you want to delete office {this.state.officeToDelete.officeName}?</p>
        </Modal>
        <Content>
          <div style={{display: `${this.state.displayTable}`}} className="bx--grid bx--grid--full-width admin-offices-page">
            <div className="bx--row bx--offset-lg-1 admin-offices-page__r1" >
              <div className="bx--col-lg-15">
                <DataTable
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
                      title="Offices" 
                      description="Displays list of all office names that participants can choose from when registering."
                      >
                      <TableToolbar>
                          <TableToolbarContent>
                              <TableToolbarSearch onChange={onInputChange} />
                          </TableToolbarContent>
                          <Button renderIcon={Add16} hasIconOnly iconDescription='Add Office' onClick={() => this.setState({modalAddOpen:true})}/>
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
            </div>
          </div>
          <div style={{display: `${this.state.displaySkeleton}`}} className="bx--offset-lg-1 bx--col-lg-13">
            <DataTableSkeleton columnCount={3} headers={headers}/>
          </div>
        </Content>
      </>
    );
  }
}

export default AdminOfficesPage;