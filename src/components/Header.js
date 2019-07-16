import React from 'react';
import Logo from '../resources/migenius_logo.svg';

const Header = () =>
    <div>
        <div id="header">
            <div id="logo">
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="http://www.migenius.com"
                    title="migenius website"
                >
                    <Logo />
                </a>
            </div>
            <h1>RealityServer Render Loop Example Application</h1>
        </div>
    </div>;

export default Header;
