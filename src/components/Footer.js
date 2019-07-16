import React from 'react';

const Footer = (props) =>
    <div id="footer">
        <div id="build_number">
            {props.state.version}
        </div>
        <div id="contact">
            <a shape="rect"
                target="_blank"
                rel="noopener noreferrer"
                href="http://www.migenius.com">
                &copy; MIGENIUS PTY LTD
            </a>
            |
            <a shape="rect" href="mailto:info@migenius.com">
                info@migenius.com
            </a>
        </div>
    </div>;

Footer.propTypes = {
    state: PropTypes.object
};

export default Footer;
