import React from 'react';
import ContentHeader from './ContentHeader';
import Render from './Render';
import { observer } from 'mobx-react';
import { computed } from 'mobx';

@observer
class Status extends React.Component {

    @computed get status() {
        if (this.last_status !== this.props.status) {
            // replacing with stats
            this.last_status = this.props.status;
            this.last = 0;
            return this.last_status;
        }
        if (this.last_rs_status !== this.props.rs_status) {
            this.last_rs_status = this.props.rs_status;
            this.last = 1;
            return this.last_rs_status;
        }
        return this.last ? this.last_rs_status : this.last_status;
    };

    constructor(props) {
        super(props);
        this.last_status = '';
        this.last_rs_status = '';
        this.last = 0;
    }

    render() {
        return (
            <div id="status"><span className='status'>Status:</span> {this.status}</div>
        );
    }
}

@observer
class Content extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="content">
                <ContentHeader />
                <Render state={this.props.state} RS={this.props.RS} />
                <Status status={this.props.state.status} rs_status={this.props.state.RS.status} />
            </div>
        );
    }
}

export default Content;
