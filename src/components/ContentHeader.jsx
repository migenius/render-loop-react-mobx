import React, { Component } from "react";
import { observable, action, computed } from "mobx";
import { observer,Observer } from "mobx-react";

@observer
class ContentHeader extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="content_header">
        <div id="serviceurl">
          {this.props.state.connection_status}
        </div>
        <div id="renderer">
          <span className='status'>Renderer:&nbsp;</span>
          <select id="renderer_select" onChange={(e) => this.rendererChange(e)} value={this.props.state.renderer}>
              {this.props.state.renderers.map(renderer => <option key={'renderer_'+renderer}>{renderer}</option>)}
            </select>
        </div>
      </div>
    );
  }

  rendererChange(event) {
    this.props.state.renderer = event.target.value;
  }

}

export default ContentHeader;
