import React, { useState } from 'react';
import { Button } from 'antd';
import { AudioOutlined, AudioMutedOutlined, PlaySquareOutlined, PauseCircleOutlined } from '@ant-design/icons';

export interface IVideoProps {
	name: string,
	muteVideo: Function,
	unmuteVideo: Function,
	muteAudio: Function,
	unmuteAudio: Function,
	uid: string
}

export const VideoPanel: React.FC<IVideoProps> = (props: IVideoProps) =>{
    const [playing, setPlaying] = useState(true);
    const [sounding, setSounding] = useState(true);

    return (
        <div style={{padding: '8px'}}>
        <div key={props.name} id={props.name} style={{width: '480px', height: '320px'}}/>
        {!playing?<PlaySquareOutlined onClick={() => {props.unmuteVideo();setPlaying(true)}}/>:<PauseCircleOutlined onClick={() => {props.muteVideo();setPlaying(false)}}/>}
        {!sounding?<AudioMutedOutlined onClick={() => {props.unmuteAudio();setSounding(true)}}/>:<AudioOutlined onClick={() => {props.muteAudio();setSounding(false)}}/>}
        uid:{props.uid}
        </div>
    );
}