import React, { Component } from "react";
import axios from "axios";
import Map from './Components/Map.js'
import MapManually from './Components/MapManually.js'
import './App.css'

let config = {
               headers : { Authorization : 'token 64b42cfd1349e648f63518e2d079c990183f8094'}//`${process.env.REACT_APP_API_KEY}` }
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
              roomId : 0,
              currentRoom : '',
              roomDescription : '',
              coOrdinates : {x : 0, y : 0},
              exists : [],
              coolDown : 0,
              inputDirection : '',
              items : [],
              goBackDirection : {n : "s", s : "n", e : "w", w : "e"},
              graph : {},
              path : [],
              visited : new Set(), // to block repeated entry of visited rooms
              message : ''
        };
    }

    componentDidMount() {
        if (localStorage.hasOwnProperty("graph")) {
            let value = JSON.parse(localStorage.getItem("graph"));
            this.setState({ graph : value });
        }
    
        this.getLocation();
    }

    getLocation = () => {
        axios.get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',config)
           .then(response => {
                               console.log(response)
                               
                               let graph = this.updateGraph(response.data.room_id, 
                                                            this.parseCoOrdinates(response.data.coordinates), 
                                                            response.data.exits);
                               this.setState({
                                   roomId        : response.data.room_id,
                                   currentRoom   : response.data.title,
                                   roomDescription : response.data.description,
                                   coOrdinates   : response.data.coordinates,
                                   exists        : response.data.exits,
                                   coolDown      : response.data.cooldown,
                                   items         : response.data.items,
                                   message       : response.data.message
                               });
                               this.updateVisited();
            })
           .catch(error => console.log(error));
    };

    updateVisited = () => {
        let visited = new Set(this.state);
        for (let key in this.state.graph) {
            if (!visited.has(key)) {
                let notVisitedDirections = [];
                for (let direction in key) {
                    if (key[direction] === "?") {
                        notVisitedDirections.push(direction);
                    }
                }
                if (!notVisitedDirections.length) {
                    visited.add(key);
                }
            }
        }
    }
  
    traverseMap = () => {
        let notExploreddirections = this.getUnExploredDirections();
        if (notExploreddirections.length) {
            let move = notExploreddirections[0];
            this.moveRooms(move); //axios.. call /move
        } else {
            clearInterval(this.interval);    //////////////////////////////////////////////////////////////////////////////////
            let path = this.findPath();
            let count = 1;
            for (let direction of path) {
                for (let d in direction) {
                    setTimeout(() => {this.moveRooms(d);}, this.state.cooldown * 1000 * count);
                    count++;
                }
            }
            this.interval = setInterval(this.traverseMap, this.state.coolDown * 1000 * count);
            count = 1;
        }
        this.updateVisited()
    };

    getUnExploredDirections = () => {
        let notExploreddirections = [];
        console.log("ROOMID .........",this.state.roomId)
        console.log(this.state.graph)
        console.log("Graph[roomid]  :--",this.state.graph[this.state.roomId] )
        let directions = this.state.graph[this.state.roomId][1]; 
        
        for (let direction in directions) {
            if (directions[direction] === "?") {
                notExploreddirections.push(direction);
            }
        }
        return notExploreddirections;
    };

    findPath = (start = this.state.roomId, end = "?") => { 
        let queue = [];
        let visited = new Set();
        for (let room in this.state.graph[start][1]) {
            queue = [...queue, [{ [room] : this.state.graph[start][1][room] }]];
        }

        while (queue.length) {
            let dequeuedItem = queue.shift();
            let lastRoom = dequeuedItem[dequeuedItem.length - 1];
            for (let exit in lastRoom) {
                if (lastRoom[exit] === end) {
                    dequeuedItem.pop();
                    return dequeuedItem;
                }else {
                    visited.add(lastRoom[exit]);
                    for (let path in this.state.graph[lastRoom[exit]][1]) {
                        if (visited.has(this.state.graph[lastRoom[exit]][1][path]) === false) {
                            let pathTravel = Array.from(dequeuedItem);
                            pathTravel.push({ [path]: this.state.graph[lastRoom[exit]][1][path] });
                            queue.push(pathTravel);
                        }
                    }
                }
            }
        }
    }

    moveRooms = async (move, nextRoomId = null) => {
        let data;
        if (nextRoomId) {
            data = {
                       direction : move,
                       nextRoomId : toString(nextRoomId)
                   };
        } else {
            data = {
                       direction: move
                   };
        }
        try {
            const response = await axios.post(`https://lambda-treasure-hunt.herokuapp.com/api/adv/move/`, data, config);

            let previousRoomId = this.state.roomId;
            let graph = this.updateGraph( response.data.room_id,
                                          this.parseCoOrdinates(response.data.coordinates),
                                          response.data.exits,
                                          previousRoomId,
                                          move );

            this.setState({ roomId : response.data.room_id,
                            coOrdinates : this.parseCoOrdinates(response.data.coordinates),
                            exists : [...response.data.exits],
                            path : [...this.state.path, move],
                            coolDown : response.data.cooldown,
                            graph });
    
        }catch(error){
            console.log("CAN-NOT GO.............");
        }
    }

    updateGraph = (roomId, coOrdinates, exits, previousRoom = null, move = null) => { //graph[roomId] = {{coOrdinates}, [exists]}
          let graph = Object.assign({}, this.state.graph);
          if (!this.state.graph[roomId]) {
                let dataForGraph = [];
                dataForGraph.push(coOrdinates); //[{x : 60, y : 60}]
                const directions = {};
                exits.forEach(exit => {
                                      directions[exit] = "?"; 
                });
                dataForGraph.push(directions); // [{x : 60, y : 60}, {'n' : '?', w : '?'}]
                graph = { ...graph, [roomId]: dataForGraph };
          }
      
          if (previousRoom !== null && move && previousRoom !== roomId) {
                graph[previousRoom][1][move] = roomId;
                graph[roomId][1][this.state.goBackDirection[move]] = previousRoom;
          }

          localStorage.setItem("graph", JSON.stringify(graph));
          return graph;
    };



    parseCoOrdinates = (coOrdinates) => { // input string type "(60, 60)"
        const coOrdinatesObj = {};
        const coOrdinatesInArr = coOrdinates.replace(/[{()}]/g, "").split(",");
        coOrdinatesInArr.forEach(coOrdinate => {
            coOrdinatesObj["x"] = parseInt(coOrdinatesInArr[0]);
            coOrdinatesObj["y"] = parseInt(coOrdinatesInArr[1]);
        });
        return coOrdinatesObj; //Output object type {x : 60, y : 60}
    }

    handleClick = () => {
        this.interval = setInterval(this.traverseMap, this.state.coolDown * 1000); 
    }
 
    render() {
        console.log(this.state.graph)
        
        return (
            <div className = "App">
                <h1>Treasure   Hunting....</h1>
                <div className = "display">
                    <h3>Currently at .... room number : {this.state.roomId}<br/><br/> {this.state.currentRoom} <br/> 
                                           {this.state.roomDescription} <br/>
                                           Enter your next move... {this.state.exists}
                    </h3>
                </div>

                <div className = "direction-enter">
                    <button onClick = {this.handleClick}>TraverseMap</button>
                </div>
                {(this.state.graph).length > 20?  <Map graph = {this.state.graph}/> : <h2>Still Traversing.......</h2>}
                <MapManually/>
                
            </div>
        );
    }
}

export default App;
