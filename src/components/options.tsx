import * as React from 'react';
import { Layout, Form, Input, InputNumber, Button, Checkbox, Radio, Select, notification, message, Row, Col } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { VideoPanel } from './videoPanel';
import { join, leave, publish, unpublish } from '../store/action';

const { Content } = Layout;
var AgoraRTC;
const resolutions = [{
        name: "default",
        value: "default",
    },
    {
        name: "480p",
        value: "480p",
    },
    {
        name: "720p",
        value: "720p",
    },
    {
        name: "1080p",
        value: "1080p"
    }
]
var rtc = {
    client: null,
    localStream: null,
    remoteStreams: []
}
type Props = {
  store: any
}

export default class extends React.Component < Props > {

    state = {
        cameraIdOptions: [],
        microphoneIdOptions: [],
        joined: false,
        published: false,
        uid: 0,
        remoteStreams: [],
        loading: false
    };

    formRef = React.createRef < FormInstance > ();

    layout = {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 },
    };
    tailLayout = {
        wrapperCol: { offset: 8, span: 16 },
    };

    sync = (func: Function, ...params) => {
        return new Promise((resolve, reject) => {
            func(...params, result => resolve(result), err => reject(err))
        });
    }

    syncFail = (func: Function, ...params) => {
        return new Promise((resolve, reject) => {
            func(...params, err => reject(err))
            resolve(1)
        });
    }

    loading() {
        this.setState({ loading: !this.state.loading })
    }

    join = async () => {
        this.loading()
        let option = this.formRef.current.getFieldsValue();
        if (this.state.joined) {
            message.error("Your already joined");
            return;
        }

        try { await this.formRef.current.validateFields() } catch (e) { this.loading(); return }

        rtc.client = AgoraRTC.createClient({ mode: option.mode, codec: option.codec });

        try {
            //init
            await this.sync(rtc.client.init, option.appId);

            //join
            let uid = await this.sync(rtc.client.join, option.token, option.channel, option.uid);   
            this.formRef.current.setFieldsValue({ uid: uid });

            // create local stream
            rtc.localStream = AgoraRTC.createStream({
                streamID: uid,
                audio: true,
                video: true,
                screen: false,
                microphoneId: option.microphoneId,
                cameraId: option.cameraId
            })
            this.setState({ joined: true });
            this.props.store.dispatch(join(null))

            // initialize local stream. Callback function executed after intitialization is done
            await this.sync(rtc.localStream.init);
            rtc.localStream.play("local_stream")

            // publish local stream
            this.publish()
        } catch (e) {
            this.loading()
            notification['error']({
                message: 'client join failed ',
                description: e,
            });
            return
        }

        //listen on event
        this.handleEvents(this);
        this.loading()
    }
    leave = async () => {
        if (!rtc.client) {
            message.error("Please Join First!")
            return
        }
        if (!this.state.joined) {
            message.error("You are not in channel")
            return
        }
        //Leaves an AgoraRTC Channel
        this.loading()
        try {
            let uid = await this.sync(rtc.client.leave);
            // stop stream
            if (rtc.localStream.isPlaying()) {
                rtc.localStream.stop()
            }
            // close stream
            rtc.localStream.close()
            for (let i = 0; i < rtc.remoteStreams.length; i++) {
                var stream = rtc.remoteStreams.shift()
                var id = stream.getId()
                if (stream.isPlaying()) {
                    stream.stop()
                }
            }
            rtc.localStream = null
            rtc.remoteStreams = []
            rtc.client = null
            console.log("client leaves channel success")
            this.setState({ joined: false, published: false })
            this.props.store.dispatch(leave(null))
            message.success("leave success")
        } catch (e) {
            notification['error']({
                message: 'channel leave failed ',
                description: e,
            });
        }
        this.loading()
    }
    publish = async () => {
        if (!rtc.client) {
            message.error("Please Join Room First")
            return
        }
        if (this.state.published) {
            message.error("Your already published")
            return
        }

        this.loading()
        try {
            // publish localStream
            await this.syncFail(rtc.client.publish, rtc.localStream)
            message.success("publish success")
            this.setState({ published: true })
            this.props.store.dispatch(publish(null))
        } catch (e) {
            notification['error']({
                message: 'publish failed ',
                description: e,
            });
        }
        this.loading()
    }
    unpublish = async () => {
        if (!rtc.client) {
            message.error("Please Join Room First")
            return
        }
        if (!this.state.published) {
            message.error("Your didn't publish")
            return
        }

        this.loading()
        try {
            // unpublish localStream
            await this.syncFail(rtc.client.unpublish, rtc.localStream)
            message.success("unpublish success")
            this.setState({ published: false })
            this.props.store.dispatch(unpublish(null))
        } catch (e) {
            notification['error']({
                message: 'unpublish failed ',
                description: e,
            });
        }
        this.loading()
    }

    handleEvents = (_this) => {
        // Occurs when the peer user leaves the channel; for example, the peer user calls Client.leave.
        rtc.client.on("peer-leave", function(evt) {
            var id = evt.uid;
            console.log("id", evt)
            let streams = rtc.remoteStreams.filter(e => id !== e.getId())
            let peerStream = rtc.remoteStreams.find(e => id === e.getId())
            if (peerStream && peerStream.isPlaying()) {
                peerStream.stop()
            }
            rtc.remoteStreams = streams
            _this.setState({ remoteStreams: rtc.remoteStreams })
            // message.success("uid: " + id + " leave")
            console.log("peer-leave", id)
        })
        // Occurs when the remote stream is added.
        rtc.client.on("stream-added", function(evt) {
            var remoteStream = evt.stream
            var id = remoteStream.getId()
            // message.info("stream-added uid: " + id)
            if (id !== _this.formRef.current.getFieldsValue("uid")) {
                rtc.client.subscribe(remoteStream, function(err) {
                    console.log("stream subscribe failed", err)
                })
            }
            console.log("stream-added remote-uid: ", id)
        })
        // Occurs when a user subscribes to a remote stream.
        rtc.client.on("stream-subscribed", function(evt) {
            var remoteStream = evt.stream
            var id = remoteStream.getId()
            rtc.remoteStreams.push(remoteStream)
            _this.setState({ remoteStreams: rtc.remoteStreams })
            setTimeout(() => remoteStream.play("remote_video_" + id), 100)
            message.info("uid: " + id + " join")
            console.log("stream-subscribed remote-uid: ", id)
        })
        // Occurs when the remote stream is removed; for example, a peer user calls Client.unpublish.
        rtc.client.on("stream-removed", function(evt) {
            var remoteStream = evt.stream
            var id = remoteStream.getId()
            message.info("uid: " + id + " leave")
            if (remoteStream.isPlaying()) {
                remoteStream.stop()
            }
            rtc.remoteStreams = rtc.remoteStreams.filter(function(stream) {
                return stream.getId() !== id
            })
            _this.setState({ remoteStreams: rtc.remoteStreams })
            console.log("stream-removed remote-uid: ", id)
        })
    }

    componentDidMount() {
        //sdk加载方式需要优化
        setTimeout(async () => {
            AgoraRTC = (window as any).AgoraRTC;
            console.log("agora sdk version: " + AgoraRTC.VERSION + " compatible: " + AgoraRTC.checkSystemRequirements());

            const updateOptions = (videos, audios) => { this.setState({ cameraIdOptions: videos, microphoneIdOptions: audios }) }
            let devices;
            try { //获取设备及异常处理
                devices = await this.sync(AgoraRTC.getDevices)
            } catch (e) {
                notification['error']({
                    message: 'Failed to getDevice',
                    description: e,
                });
                return
            }

            let videos = [],
                audios = [],
                cameraId, microphoneId
            for (let i = 0; i < (devices as any).length; i++) {
                let item = devices[i]
                if ("videoinput" == item.kind) {
                    let name = item.label
                    let value = item.deviceId
                    if (!name) {
                        name = "camera-" + videos.length
                    }
                    if (!cameraId) cameraId = value
                    videos.push({
                        label: name,
                        value: value,
                        kind: item.kind
                    })
                }
                if ("audioinput" == item.kind) {
                    let name = item.label
                    let value = item.deviceId
                    if (!name) {
                        name = "microphone-" + audios.length
                    }
                    if (!microphoneId) microphoneId = value
                    audios.push({
                        label: name,
                        value: value,
                        kind: item.kind
                    })
                }
            }

            updateOptions(videos, audios)
            this.formRef.current.setFieldsValue({ cameraId: cameraId, microphoneId: microphoneId })
        }, 500)
    }

    render() {
        return (
            <Content style={{minHeight: "100px"}}>
              <Form
                {...this.layout}
                ref={this.formRef}
                name="basic"
                initialValues={{ remember: true }}
              >
                <Form.Item
                  label="appId"
                  name="appId"
                  rules={[{ required: true, message: 'Please input your appID!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="channel"
                  name="channel"
                  rules={[{ required: true, message: 'Please input your Channel!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="token"
                  name="token"
                  rules={[{ required: true, message: 'Please input your Token!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item {...this.tailLayout}>
                <Row gutter={16}>
                  {!this.state.joined?<Button type="primary" htmlType="submit" loading={this.state.loading} onClick={this.join} style={{marginLeft: '8px'}}>
                    JOIN
                  </Button>:null}
                  {this.state.joined?<Button type="primary" htmlType="submit" loading={this.state.loading} onClick={this.leave} style={{marginLeft: '8px'}}>
                    LEAVE
                  </Button>:null}
                  {this.state.joined&&!this.state.published?<Button type="primary" htmlType="submit" loading={this.state.loading} onClick={this.publish} style={{marginLeft: '8px'}}>
                    PUBLISH
                  </Button>:null}
                  {this.state.joined&&this.state.published?<Button type="primary" htmlType="submit" loading={this.state.loading} onClick={this.unpublish} style={{marginLeft: '8px'}}>
                    UNPUBLISH
                  </Button>:null}
                  </Row>
                </Form.Item>

                <Form.Item
                  label="uid"
                  name="uid"
                >
                  <InputNumber/>
                </Form.Item>
                <Form.Item
                  label="cameraId"
                  name="cameraId"
                >
                  <Select options={this.state.cameraIdOptions}/>
                </Form.Item>
                <Form.Item
                  label="microphoneId"
                  name="microphoneId"
                >
                  <Select options={this.state.microphoneIdOptions}/>
                </Form.Item>
                <Form.Item
                  label="cameraResolution"
                  name="cameraResolution"
                  initialValue={resolutions[0].value}
                >
                  <Select options = {resolutions}/>
                </Form.Item>
                <Form.Item
                  label="mode"
                  name="mode"
                  initialValue="rtc"
                >
                  <Radio.Group>
                    <Radio value="rtc">rtc</Radio>
                    <Radio value="live" disabled>live</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  label="codec"
                  name="codec"
                  initialValue="h264"
                >
                  <Radio.Group>
                    <Radio value="h264">h264</Radio>
                    <Radio value="vp8">vp8</Radio>
                  </Radio.Group>
                </Form.Item>
              </Form>
              <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
              {this.state.joined && <VideoPanel uid="yourself" name="local_stream" muteVideo={rtc.localStream.muteVideo} unmuteVideo={rtc.localStream.unmuteVideo} muteAudio={rtc.localStream.muteAudio} unmuteAudio={rtc.localStream.unmuteAudio} />}
              {this.state.remoteStreams.map((item) => {
                return <VideoPanel uid={item.getId()} name={"remote_video_" + item.getId()} muteVideo={item.muteVideo} unmuteVideo={item.unmuteVideo} muteAudio={item.muteAudio} unmuteAudio={item.unmuteAudio} />
              })}
              </div>
            </Content>
        );
    }
}