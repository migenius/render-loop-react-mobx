import React from 'react';
import { autorun, when } from 'mobx';
import { observer } from 'mobx-react';
import { inject } from 'mobx-react';
import PropTypes from 'prop-types';

class Render extends React.Component {
    constructor(props) {
        super(props);

        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        /** The number of radians each pixel will rotate the camera.
             * Defaults to dragging the mouse 200 pixels rotate the camera
             * 360 degrees. */
        this.orbitSpeed = (3.14 * 2) / 200;
        this.image_ref = React.createRef();

        this.state = {
            showRender: false,
            dragged: false, //used to differentiate drag and click
            is_drag: false, //used to differentiate drag and hover
            prevX: 0, // previous mouse locations
            prevY: 0 // previous mouse locations
        };
    }

    componentDidMount() {
        const { rs_state } = this.props;
        const { current } = this.image_ref;

        this.props.RS.start(
            current,
            current.parentElement.clientWidth,
            current.parentElement.clientHeight
        );

        // when we have the first image display the render view
        when(
            () => rs_state.image_rendered.count === 1,
            () => (this.setState({ showRender: true }))
        );

        // update render statistics
        autorun(() => {
            if (rs_state.image_rendered.data) {
                if (rs_state.image_rendered.data.result === 1) {
                    if (rs_state.image_rendered.source === 'WS') {
                        /*this.props.RS.state.status =
                            'Render converged, waiting for images from web sockets.';*/
                        rs_state.set_status('Render converged, waiting for images from web sockets.');
                    } else {
                        /*this.props.RS.state.status =

                            'Render converged, local render loop paused.';*/
                        rs_state.set_status('Render converged, local render loop paused.');
                    }
                } else if (
                    typeof rs_state.image_rendered.data.statistics !==
                    'undefined'
                ) {
                    let msg;
                    if (
                        typeof rs_state.image_rendered.data.statistics
                            .iteration !== 'undefined'
                    ) {
                        msg =
                            'Server pushing images via web sockets (' +
                            rs_state.image_rendered.data.statistics.iteration +
                            ' iterations)';
                        if (rs_state.image_rendered.data.statistics.fps) {
                            msg +=
                                ' (' +
                                rs_state.image_rendered.data.statistics.fps.toFixed(
                                    2
                                ) +
                                ' fps).';
                        } else {
                            msg += '.';
                        }
                    } else if (rs_state.image_rendered.data.statistics.fps) {
                        msg =
                            'Fetching renders from server at up to ' +
                            rs_state.image_rendered.data.statistics.fps.toFixed(2) +
                            ' fps.';
                    }
                    if (msg) {
                        //this.props.RS.state.status = msg;
                        rs_state.set_status(msg);

                    }
                }
            }
        });
    }

    handleMouseDown(event) {
        // Reset mouse moved status
        this.setState({
            is_drag: true,
            prevX: event.pageX,
            prevY: event.pageY
        });

        // Supress default behaviour
        event.preventDefault();
        event.stopPropagation();
    }

    handleMouseMove(event) {
        const { is_drag, prevX, prevY } = this.state;
        if (is_drag) {
            if (event.pageX === prevX && event.pageY === prevY) {
                // didn't actually move
                return false;
            }

            // Flag that we have moved
            const dx = (prevX - event.pageX) * this.orbitSpeed;
            const dy = (prevY - event.pageY) * this.orbitSpeed;

            this.props.rs_camera.orbit(dx, dy);

            this.setState({
                prevX: event.pageX,
                prevY: event.pageY,
                dragged: true
            });

            // Supress default behaviour
            event.preventDefault();
            event.stopPropagation();
        }
    }

    handleMouseUp(event) {
        if (!this.state.dragged) {
            this.handleMouseClick(event);
        }
        this.setState({ dragged: false, is_drag: false });

        // Supress default behaviour
        event.preventDefault();
        event.stopPropagation();
    }

    handleMouseClick = async (event) => {
        const { rs_state, RS } = this.props;
        const { current } = this.image_ref;
        const rect = current.getBoundingClientRect();
        const click_x = event.pageX - rect.left;
        const click_y =
            current.parentElement.clientHeight - (event.pageY - rect.top);
        try {
            // pause updates while we pick an object in the scene.
            // display will be resumed once an element is picked and highlighted.
            RS.pause_display();
            const picked = await RS.pick(click_x, click_y);
            if (picked) {
                rs_state.outlined = [ picked[0].picked_object_instance ];
            } else {
                rs_state.outlined.clear();
            }
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        return (
            <div id="div_holder">
                <div id="scene_container">
                    <img
                        ref={this.image_ref}
                        className={this.state.showRender ? 'show' : 'hide'}
                        onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp}
                        onMouseMove={this.handleMouseMove}
                        width="100%"
                        height="100%"
                        src=""
                        alt="Rendering Scene..."
                    />
                </div>
                <div
                    className={this.state.showRender ? 'hide' : 'show'}
                    id="loader_container"
                >
                    <div id="loader" />
                </div>
            </div>
        );
    }
}

Render.propTypes = {
    rs_state: PropTypes.object,
    RS: PropTypes.object,
    rs_camera: PropTypes.object
};

export default inject('rs_camera', 'rs_state')(observer(Render));
