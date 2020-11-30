import React, { Component } from 'react';
import Options from '../components/options';
import { Layout, Menu, Breadcrumb } from 'antd';
import { join } from '../store/action';

const { Header, Content, Footer } = Layout;

type Props = {
    store: any
}
export default class extends Component < Props > {
    state = Object.assign({}, {}, this.props.store.getState())
    componentDidMount() {
        const state = this.props.store.getState()
        this.setState({ join: state.join })
        this.props.store.subscribe(() => {
            this.setState(this.props.store.getState())
        });
    }
    render() {
        return (
            <Layout className="layout">
          <Header>
            <div className="logo" />
            <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
              <Menu.Item key="1">视频通话</Menu.Item>
            </Menu>
          </Header>
          <Content style={{ padding: '0 50px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>Demo({this.state.join&&this.state.publish?'已加入':'未加入'})</Breadcrumb.Item>
            </Breadcrumb>
            <div className="site-layout-content"><Options store={this.props.store}/></div>
          </Content>
        </Layout>
        );
    }

};