import React from 'react';
import { render } from 'react-dom';
import Header from './components/Header.js';
import Content from './components/Content';
import Footer from './components/Footer';
import RenderLoopModel from './models/RenderLoopModel';
import RealityServerService from './services/RealityServerService';
import './styles/migenius.css';
import { Provider } from 'mobx-react';

class RenderLoopDemo extends React.Component {
    constructor(props) {
        super(props);
        this.RS = new RealityServerService();
        this.state = new RenderLoopModel(this.RS.state);
    }

    render() {
        return (
            <Provider rs_state={this.RS.state} rs_camera={this.RS.camera}>
                <div>
                    <Header />
                    <Content state={this.state} RS={this.RS} />
                    <Footer />
                </div>
            </Provider>
        );
    }
}

render(<RenderLoopDemo />, document.getElementById('root'));
