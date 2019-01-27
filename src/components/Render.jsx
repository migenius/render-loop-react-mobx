import React, { Component } from "react";
import { observable, action, computed, autorun, when } from "mobx";
import { observer } from "mobx-react";
import {Vector4} from "com/mi/rs/index.js";

@observer
class Render extends React.Component {
  @observable showRender = false;

   /** used to differentiate drag and click */
  dragged = false;

  /** The number of radians each pixel will rotate the camera.
  * Defaults to dragging the mouse 200 pixels rotate the camera
  * 360 degrees. */
  orbitSpeed = 3.14*2/200;

  // previous mouse locations
  prevX = 0;
  prevY = 0;

  image_width = 500;
  image_height = 370;

  constructor(props) {
    super(props);

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  render() {
    return (
      <div id="div_holder">
          <div id="scene_container">
            <img ref="image" className={this.showRender ? 'show' : 'hide'} onMouseDown={this.handleMouseDown} width="100%" height="100%" src="" alt="Rendering Scene..."></img> 
          </div>
          <div className={this.showRender ? 'hide' : 'show'} ref="loader" id="loader_container">
              <div id="loader"></div>
          </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.RS.start(this.refs.image,this.image_width,this.image_height);

    // when we have 1 image display the render view
    when(
      () => this.props.state.imageRendered.count == 1,
      () => this.showRender = true
    );

    // update render statistics
    autorun( reaction => {
      if (this.props.state.imageRendered.data) {
        if (this.props.state.imageRendered.data.result == 1) {
          if (this.props.state.imageRendered.source === 'WS') {
            this.props.state.status = 'Render converged, waiting for images from web sockets.';            
          } else {
            this.props.state.status = 'Render converged, local render loop paused.';
          }
        } else if (typeof this.props.state.imageRendered.data.statistics !== 'undefined') {
          let msg;
          if (typeof this.props.state.imageRendered.data.statistics.iteration !== 'undefined') {
            msg = "Server pushing images via web sockets (" + this.props.state.imageRendered.data.statistics.iteration + " iterations)";
            if (this.props.state.imageRendered.data.statistics.fps) {
              msg += " (" + this.props.state.imageRendered.data.statistics.fps.toFixed(2) + " fps).";
            } else {
              msg += ".";
            }
          } else if (this.props.state.imageRendered.data.statistics.fps) {
             msg = 'Fetching renders from server at up to ' + this.props.state.imageRendered.data.statistics.fps.toFixed(2) + ' fps.';
          }
          if (msg) {
            this.props.state.status = msg;
          }
        }
      }
    });
  }

  handleMouseDown(event)
  {
    // Reset mouse moved status
    this.dragged = false;

    this.prevX = event.pageX;
    this.prevY = event.pageY;

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    //window.ontouchmove = onMouseMove;
    //window.ontouchend = onMouseUp;

    // Supress default behaviour
    event.preventDefault();
    event.stopPropagation()
  }

  handleMouseMove(event)
  {
    if (event.pageX === this.prevX && event.pageY === this.prevY) {
        // didn't actually move
        return false;
    }

    // Flag that we have moved
    this.dragged = true;

    const dx = (this.prevX - event.pageX) * this.orbitSpeed;
    const dy = (this.prevY - event.pageY) * this.orbitSpeed;

    this.props.RS.camera.orbit(dx, dy, new Vector4([0,0.01,-0.01]));

    this.prevX = event.pageX;
    this.prevY = event.pageY;

    // Supress default behaviour
    event.preventDefault();
    event.stopPropagation()
  }

  handleMouseUp(event)
  {
    if (!this.dragged) {
        this.handleMouseClick(event);
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    
    //window.ontouchmove = undefined;
    //window.ontouchend = undefined;
    // Supress default behaviour
    event.preventDefault();
    event.stopPropagation()
  }

  async handleMouseClick(event)
  {
    const rect = this.refs.image.getBoundingClientRect();
    const click_x = event.pageX - rect.left;
    const click_y = this.image_height - (event.pageY - rect.top);

    try {
      const picked = await this.props.RS.pick(click_x,click_y);
      if (picked) {
        this.props.state.outlined = [ picked[0].picked_object_instance ];
      } else {
        this.props.state.outlined.clear();
      }
    } catch (e) {

    }
  }
}

export default Render;
