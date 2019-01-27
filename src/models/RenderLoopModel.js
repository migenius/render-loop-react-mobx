import { observable, computed, action } from "mobx";

export default class RenderLoopModel {

  @observable host = undefined;
  @observable port = undefined;
  @observable secure = false;
  @observable renderers = [ 'unknown' ];
  @observable renderer = undefined;
  @observable connection_error = undefined;
  @observable status = '';
  @observable outlined = [];


  /** Frames per second to retrieve renders at */
  renderFPS = 15;

  /** Expiry timeout for render loops in seconds*/
  renderLoopExpiryTime = 10;

  /** Check render result every N frames and stop retrieving if
   * image is converged. */
  converganceTestFrequency = 15;

  /** How often to touch the render loop to ensure it doesn't expire
   * in seconds. */
  get keepAliveTime() {
    return this.renderLoopExpiryTime / 2;
  }


  /** Updates whenever an image is rendered */
  @observable imageRendered = {
      count: 0,
      source: '',
      data: {}
  };


  rs_version = '4442';
  
  constructor() {
  }

  @computed get connection_status() {
  	if (this.connection_error) {
  		return this.connection_error;
  	} else {
    	return this.host ? ('Host: "' + this.host + '" HTTP port: ' + this.port) : 'Not Connected';
    }
  }

  @action
  addRenderer(renderer) {
    this.renderers.push(renderer);
  }
}
