import React from 'react';
import { render } from 'react-dom';
import DevTools from 'mobx-react-devtools';

import Header from './components/Header';
import Content from './components/Content';
import Footer from './components/Footer';
import RenderLoopModel from './models/RenderLoopModel';
import RealityServerService from './services/RealityServerService';
import './styles/migenius.css';

class RenderLoopDemo extends React.Component {

    constructor(props) {
        super(props);
        this.RS = new RealityServerService();
        this.state = new RenderLoopModel(this.RS.state);
    }

    render() {
        return (
            <div>
                <DevTools />
                <Header />
                <Content state={this.state} RS={this.RS} />
                <Footer state={this.RS.state} />
            </div>
        );
    }
}

render(
    <RenderLoopDemo/>,
    document.getElementById('root')
);

