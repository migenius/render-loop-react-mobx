import React from 'react';
import { observer } from 'mobx-react';

@observer
class ContentHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="content_header">
                <div id="serviceurl">
                    <span className={`circle ${this.props.RS.state.connection_status}`}/> {this.props.state.connection_status} <span className={this.props.RS.state.secure ? 'lock':''}/>
                </div>
                <div id="renderer">
                    <span className='status'>Renderer:&nbsp;</span>
                    <select id="renderer_select" onChange={(e) => this.rendererChange(e)} value={this.props.RS.state.renderer}>
                        {this.props.RS.state.renderers.map(renderer => <option key={'renderer_'+renderer}>{renderer}</option>)}
                    </select>
                </div>
            </div>
        );
    }

    rendererChange(event) {
        this.props.RS.state.renderer = event.target.value;
    }

}

export default ContentHeader;
