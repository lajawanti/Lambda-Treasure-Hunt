import React, { Component } from 'react';
import './App.css';
import axios from "axios";

const url = 'https://lambda-treasure-hunt.herokuapp.com/api/adv/'
const config = {
    headers: { Authorization : 'Token 64b42cfd1349e648f63518e2d079c990183f8094'}//`${process.env.REACT_APP_API_KEY}` }
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
            items : '',
            inputDirection : ''
      };
      this.graph = { 
                    0 : { n: "?", s: "?", e: "?", w: "?" } 
      };
  }

  componentDidMount() {
      //console.log("$$", process.env.REACT_APP_API_KEY)
        if(localStorage.getItem('graph')) {
            const roomInfo = JSON.parse(localStorage.getItem('graph'))
            this.setState({ graph : roomInfo })
        } else {
            this.getCurrentRoom();
        }
  }

  getCurrentRoom = () => {
        axios.get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/' , config)
             .then(response => {
                      console.log(response)
                      this.setState({
                          roomId : response.data.room_id,
                          currentRoom : response.data.title,
                          roomDescription : response.data.description,
                          coOrdinates : response.data.coordinates,
                          exists : response.data.exits,
                          coolDown : response.data.cooldown,
                          items : response.data.items
                      })
              })
             .catch(error => console.log(error))
  } //getCurrentRoom  end.................................


  handleInputChange = (event) => {
        this.setState({
            inputDirection : event.target.value
        })
  }

  /*handleSubmit = (event) => {
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
  } //handleSubmit end....*/

  goBack = (direction) => {
        if(direction === 'e') return 'w';
        else if(direction === 'w') return 'e';
        else if(direction === 'n') return 's';
        else if(direction === 's') return 'n';
  }


  /********************************************************** */
  generateMap = (event) => {
        event.preventDefault();
        const data = {direction : this.state.inputDirection}
        console.log(data);
    
        let currentRoomExits = this.graph[this.state.roomId];
        const unexploredExits = [];

        for (let exit in currentRoomExits) {
            if (currentRoomExits[exit] === "?") {
                unexploredExits.push(exit);
            }
            console.log("EXIT", exit);
        }

        let exit = this.state.inputDirection;
        if(unexploredExits) {
            let prevRoomId = this.state.roomId;
            if (["n", "s", "e", "w"].includes(exit)) {
                this.state.traversalPath.push(exit);
                axios.post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', data, config)
                     .then(response => {
                                            this.setState({
                                                roomId : response.data.room_id,
                                                coOrdinates : response.data.coordinates,
                                                exits : response.data.exits,
                                                coolDown : response.data.cooldown,
                                                inputDirection : ""
                                       })
                                       const moves = {};
                                        response.data.exits.forEach(exit => {
                                                    moves[exit] = "?";
                                        });
            
                                        this.graph[prevRoomId][exit] = response.data.room_id;
                                        this.graph[response.dataRoomId] = moves;
                                        this.graph[response.data.roomId][this.oppositeDir(exit)] = prevRoomId;
                                        localStorage.setItem("graph", JSON.stringify(this.graph));
                      })
                     .catch(error => console.log(error));
            }
            console.log("GRAPH", this.state.graph);
        }
  }
  /******************************************************* */
  

  
  render() {
    console.log(this.state)
    return (
      <div className="App">
          
              <h1>Treasure   Hunting....</h1>
              <div className = "display">
                    <h3>Currently at ROOM  : {this.state.roomId}..<br/><br/> {this.state.currentRoom} <br/> 
                                           {this.state.roomDescription} <br/>
                                           Enter your next move... {this.state.exists}
                    </h3>
              </div>
              <div className = "direction-enter">
                    <input
                        type = "text"
                        value = {this.state.inputDirection}
                        onChange = {this.handleInputChange}
                    />
                    <button onClick = {this.generateMap}>Submit</button>
              </div>
              
          
      </div>
    );
  }
}

export default App;
