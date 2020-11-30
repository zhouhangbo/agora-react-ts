import React, { Component } from 'react';
import './App.css';
import Home from './pages/home';
import { createStore } from "redux";
import reducer from "./store/reducer";

const store = createStore(reducer)

class App extends Component {
    render() {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://oss.dev.jiandanchina.com/common/AgoraRTCSDK.js';
        document.head.appendChild(script);
        return (
          <Home store={store}/>
        );
    }
}

export default App;