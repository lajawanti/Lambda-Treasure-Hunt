import React, { Component } from 'react';
import './App.css';
//import Map from './Components/Map.js'

import axios from "axios";
let config = {
    headers: { Authorization : 'token 64b42cfd1349e648f63518e2d079c990183f8094'}//`${process.env.REACT_APP_API_KEY}` }
};

class App extends Component {
  constructor(props) {
      super(props);
      this.state = {
            roomId : 0,
            currentRoom : '',
            roomDescription : '',
            coOrdinates : (0,0),
            exists : [],
            coolDown : 0,
            inputDirection : ''
      };
  }

  componentDidMount() {
      //console.log("$$", process.env.REACT_APP_API_KEY)
      axios.get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',config)
           .then(response => {
                               console.log(response)
                               this.setState({
                                   roomId : response.data.room_id,
                                   currentRoom : response.data.title,
                                   roomDescription : response.data.description,
                                   coOrdinates : response.data.coordinates,
                                   exists : response.data.exits,
                                   coolDown : response.data.cooldown
                               })
            })
           .catch(error => console.log(error));
  }

  handleInputChange = (event) => {
        this.setState({
            inputDirection : event.target.value
        })
  }

  handleSubmit = (event) => {
        event.preventDefault();
        const data = {direction : this.state.inputDirection}
        console.log(data);
        axios.post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', data, config)
             .then(response => {
                                console.log(response)
                                this.setState({
                                    roomId : response.data.room_id,
                                    currentRoom : response.data.title,
                                    roomDescription : response.data.description,
                                    coOrdinates : response.data.coordinates,
                                    exists : response.data.exits,
                                    coolDown : response.data.cooldown
                                })
              })
             .catch(err => {
                    console.log('ERROR with MOVE URL', err)
              }); 
  } //handleSubmit end....

  render() {
    console.log(this.state)
    return (
      <div className="App">
          
              <h1>Treasure   Hunting....</h1>
              <div className = "display">
                    <h3>Currently at ..<br/><br/> {this.state.currentRoom} <br/> 
                                           {this.state.roomDescription} <br/>
                                           Enter your next move... (n/s or e/w)
                    </h3>
              </div>
              <div className = "direction-enter">
                    <input
                        type = "text"
                        value = {this.state.inputDirection}
                        onChange = {this.handleInputChange}
                    />
                    <button onClick = {this.handleSubmit}>Submit</button>
              </div>
           {/*  <Map/> */}
          
      </div>
    );
  }
}

export default App;
