import React from 'react';
import './Map.css'
import {data} from './data'
import MapDisplay from './MapDisplay.js'


export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            graph : [data],
        };
    }
  
    componentDidMount() {
        console.log(this.props);
        setTimeout(() => {
            this.setState({ graph : data });
        }, 500);
    }

    render() {
        console.log(this.state.graph);        
        return (
          <div>
              {this.state.graph.map((room, index) => (
                                                        <MapDisplay key = {index}
                                                                    roomToDisplay = {room}
              />
              ))}
          </div>
        );
      }
    }


  
