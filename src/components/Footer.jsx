import React from 'react';

class Footer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="footer">
                <div id="build_number">{this.props.state.version}</div>
                <div id="contact"><a shape="rect" target="_blank" href="http://www.migenius.com">&copy; MIGENIUS PTY LTD</a> | <a shape="rect" href="mailto:info@migenius.com">info@migenius.com</a></div>
            </div>
        );
    }
}

export default Footer;
