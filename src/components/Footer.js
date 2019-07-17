import React from 'react';
import PropTypes from 'prop-types';
import { inject } from 'mobx-react';

const Footer = ({ rs_state: { version } }) =>
    <div id="footer">
        <div id="build_number">
            {version}
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
    rs_state: PropTypes.object
};

export default inject('rs_state')(Footer);
