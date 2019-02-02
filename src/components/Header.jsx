import React from 'react';
import Logo from '../resources/migenius_logo.svg';

class Header extends React.Component {
    render() {
        return (
            <div>
                <div id="header">
                    <div id="logo">
                        <a target="_blank" href="http://www.migenius.com" title="migenius website">
                            <Logo />
                        </a>
                    </div>
                    <h1>RealityServer Render Loop Example Application</h1>
                </div>
            </div>
        );
    }
}

export default Header;
