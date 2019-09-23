import { observable, computed, action } from 'mobx';

export default class RealityServerState {

    @observable host = undefined;
    @observable port = undefined;
    @observable secure = false;
    @observable renderers = [ 'unknown' ];
    @observable renderer = undefined;
    @observable version = '';
    @observable status = '';
    @observable connection_error = undefined;
    @observable connection_status = 'pending';
    @observable outlined = [];

    /** Updates whenever an image is rendered */
    @observable image_rendered = {
        count: 0,
        data: {}
    };
    
    render_loop_expiry_time = 10;

    @computed get connection_status_output() {
        if (this.connection_error) {
            return this.connection_error;
        } else {
            return this.host ? ('Host: "' + this.host + '" HTTP port: ' + this.port) : 'Not Connected';
        }
    }

    @action set_render(render) {
        this.renderer = render;
    }

    @action set_status(status) {
        this.status = status;
    }

}
