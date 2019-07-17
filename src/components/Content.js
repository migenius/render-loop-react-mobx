import React from 'react';
import ContentHeader from './ContentHeader';
import Render from './Render';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import Status from './Status';

@observer
class Content extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

        return (
            <div id="content">
                <ContentHeader />
                <Render RS={this.props.RS} />
                <Status />
            </div>
        );
    }
}

export default Content;
