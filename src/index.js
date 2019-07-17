import React from 'react';
import { render } from 'react-dom';
import Header from './components/Header.js';
import Content from './components/Content';
import Footer from './components/Footer';
import RealityServerService from './services/RealityServerService';
import './styles/migenius.css';
import { Provider } from 'mobx-react';

const RenderLoopDemo = () => {
    const RS = new RealityServerService();
    return (
        <Provider rs_state={RS.state} rs_camera={RS.camera}>
            <div>
                <Header />
                <Content RS={RS} />
                <Footer />
            </div>
        </Provider>
    );
};

render(<RenderLoopDemo />, document.getElementById('root'));
