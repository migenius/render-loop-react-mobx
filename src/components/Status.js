import React from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';

const Status = (props) =>
    <div id="status">
        <span className='status'>
            Status: {props.rs_state.status}
        </span>
    </div>
    ;

Status.propTypes = {
    rs_state: PropTypes.object
};

export default inject('rs_state')(observer(Status));
