import { observable, computed, action } from "mobx";

export default class RealityServerState {

  @observable host = undefined;
  @observable port = undefined;
  @observable secure = false;
  @observable renderers = [ 'unknown' ];
  @observable renderer = undefined;
  @observable status = '';
  @observable connection_error = undefined;
  @observable outlined = [];

  /** Updates whenever an image is rendered */
  @observable imageRendered = {
      count: 0,
      data: {}
  };

  version = '4442';

  renderLoopExpiryTime = 10;
  
  constructor() {
  }
}
