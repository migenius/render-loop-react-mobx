import React, { Component } from "react";
import ContentHeader from "./ContentHeader";
import Render from "./Render";
import { observer } from "mobx-react"

@observer
class Status extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="status"><span className='status'>Status:</span> {this.props.status}</div>
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
        <ContentHeader state={this.props.state} />
        <Render state={this.props.state} RS={this.props.RS} />
        <Status status={this.props.state.status} />
      </div>
    );
  }
}

export default Content;
