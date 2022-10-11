import React, { Component } from 'react'
import UserGlobalHeader from '../../components/UserGlobalHeader';
import { Navigate } from 'react-router-dom';
import {
	Button,
	ComboBox,
	Form,
	Select,
	SelectItem,
	TextInput
} from '@carbon/react';

class RegistrationPage extends Component {
  
	constructor(props) {
		super(props)
		this.state = {
			comboboxInvalid:false,
			dropDownInvalid:false,
			fNameInvalid:false,
			lNameInvalid:false,
			invalidText: "",
			redirect:false,
			offices:[],
			selectedOfficeId:null
		} 
	}
    
	componentDidMount() {
		fetch(`${process.env.REACT_APP_API_BASE_URL}/offices`, {mode:'cors'})
			.then(response => response.json())
			.then(data => {
				let objOffices = []  
				for (let i=0; i<data.rows.length; i++){
					objOffices.push({id:data.rows[i].officeid, text:data.rows[i].officename})
				}
				this.setState({offices: objOffices})
			})
	}
    
	Register = async() => {

		let title = document.getElementById("dropdown").value;
		let fName = document.getElementById("fname").value;
		let lName = document.getElementById("lname").value;
		const regex = /^[0-9a-zA-Z(\-)]+$/;
			
		this.setState({
			comboboxInvalid: false,
			dropDownInvalid: false,
			fNameInvalid: false,
			lNameInvalid: false,
			invalidText: ""
		});

		if (this.state.selectedOfficeId === "" || this.state.selectedOfficeId === null) {
			this.setState({comboboxInvalid: true});
			return;
		}

		if (title === "0") {
			this.setState({dropDownInvalid: true});
			return;
		}
		if (fName === "") {
			this.setState({
				fNameInvalid: true,
				invalidText: "This is a required field."
			});
			return;
		}
		
		if (lName === "") {
			this.setState({
					lNameInvalid: true,
					invalidText: "This is a required field."
			});
			return;
		};

		if (!fName.match(regex)) {
			this.setState({
				fNameInvalid: true,
					invalidText: "Invalid character in First Name field. Acceptable characters are: A-Z, a-z, 0-9, and -"
			});
			return;
		}

		if (!lName.match(regex)) {
			this.setState({
				lNameInvalid: true,
				invalidText: "Invalid character in Last Name field. Acceptable characters are: A-Z, a-z, 0-9, and -"
			});
			return;
		}

		const registrationRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/register`, {
			method:'POST',
			mode:'cors',
			headers:{'Content-Type':'application/json'},
			body:JSON.stringify({
				"office":this.state.selectedOfficeId,
				"title":title,
				"fname":fName,
				"lname":lName
			})
		});
		const registrationResponse = await registrationRequest.json();
		const mintRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/mintjwt/${registrationResponse.participantid}`)
		const mintResponse = await mintRequest.json();
		localStorage.setItem("jwt", mintResponse.token);
		this.setState({redirect:true});
	}

	render() {
		return (
			<>
				<UserGlobalHeader notificationActive={false} isAuth={false}/>
				
				{this.state.redirect ? <Navigate to='/vote'/>:null}
			
				<div className='registration-page__banner'>
					<h1 className="registration-page__heading">Participant Registration</h1>
				</div>
				<div className='registrationFormContainer' style={{display:'flex', justifyContent:'center'}}>
					<Form>
						<div className='registrationFormItem'>
							<ComboBox
								onChange={event => this.setState({selectedOfficeId:event.selectedItem.id})}
								id="combobox"
								placeholder="Select"
								invalid={this.state.comboboxInvalid}
								invalidText="This is a required field." 
								items={this.state.offices}
								itemToString={office => office ? office.text : ''}
								titleText="Office"
								helperText=""
							/>
						</div>
						<div className='registrationFormItem'>
							<Select
								defaultValue="Select"
								id="dropdown"
								labelText="Title"
								invalid={this.state.dropDownInvalid}
								invalidText="This is a required field."
								tabIndex={0}
							>
								<SelectItem text="Select" value="0"></SelectItem>
								<SelectItem text="Mr." value="Mr."></SelectItem>
								<SelectItem text="Ms." value="Ms."></SelectItem>
								<SelectItem text="Dr." value="Dr."></SelectItem>
								<SelectItem text="CMC" value="CMC"></SelectItem>
								<SelectItem text="ENS" value="ENS"></SelectItem>
								<SelectItem text="LTJG" value="LTJG"></SelectItem>
								<SelectItem text="LT" value="LT"></SelectItem>
								<SelectItem text="LCDR" value="LCDR"></SelectItem>
								<SelectItem text="CDR" value="CDR"></SelectItem>
								<SelectItem text="CAPT" value="CAPT"></SelectItem>
							</Select>
						</div>
						<div className='registrationFormItem'>
							<TextInput
								labelText="First Name"
								helperText=""
								id="fname"
								invalid={this.state.fNameInvalid}
								invalidText={this.state.invalidText}
								placeholder="Enter your first name"
								tabIndex={0}
							/>
						</div>
						<div className='registrationFormItem'>
							<TextInput
								labelText="Last Name"
								helperText=""
								id="lname"
								invalid={this.state.lNameInvalid}
								invalidText={this.state.invalidText}
								placeholder="Enter your last name"
								tabIndex={0}
							/>
						</div>
						<div className='registrationFormItem'>
							<Button
								kind='primary'
								tabIndex={0}
								onClick={() => this.Register()}
								>
									Register    
							</Button>
						</div>
					</Form>
				</div>
			
			</>
		);
  }
}

export default RegistrationPage;