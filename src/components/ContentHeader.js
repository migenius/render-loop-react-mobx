import React from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';

const ContentHeader = ({
    rs_state,
    rs_state: {
        renderer,
        renderers,
        connection_status,
        connection_status_output,
        secure
    }
}) => {
    const rendererChange = (event) => {
        rs_state.set_render(event.target.value);
    };

    return (
        <div id="content_header">
            <div id="serviceurl">
                <span className={`circle ${connection_status}`} />
                {connection_status_output}
                <span className={secure ? 'lock' : ''} />
            </div>
            <div id="renderer">
                <span className='status'>Renderer:&nbsp;</span>
                <select
                    id="renderer_select"
                    onChange={rendererChange}
                    value={renderer}
                >
                    {renderers.map(
                        renderer =>
                            <option
                                key={'renderer_' + renderer}>
                                {renderer}
                            </option>
                    )}
                </select>
            </div>
        </div>
    );
};

ContentHeader.propTypes = {
    rs_state: PropTypes.object
};

export default inject('rs_state')(observer(ContentHeader));
