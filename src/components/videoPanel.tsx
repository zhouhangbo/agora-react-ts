import React, { useState } from 'react';
import { Button } from 'antd';
import { AudioOutlined, AudioMutedOutlined, PlaySquareOutlined, PauseCircleOutlined } from '@ant-design/icons';


function VideoPanel(props) {
    const [playing, setPlaying] = useState(true);
    const [sounding, setSounding] = useState(true);

    return (
        <div style={{padding: '8px'}}>
        <div key={props.name} id={props.name} style={{width: '480px', height: '320px'}}/>
        {!playing?<PlaySquareOutlined onClick={() => {props.stream.unmuteVideo();setPlaying(true)}}/>:<PauseCircleOutlined onClick={() => {props.stream.muteVideo();setPlaying(false)}}/>}
        {!sounding?<AudioMutedOutlined onClick={() => {props.stream.unmuteAudio();setSounding(true)}}/>:<AudioOutlined onClick={() => {props.stream.muteAudio();setSounding(false)}}/>}
        </div>
    );
}
export default VideoPanel