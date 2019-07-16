import { observable } from 'mobx';

export default class RealityServerState {

  @observable host = undefined;
  @observable port = undefined;
  @observable secure = false;
  @observable renderers = [ 'unknown' ];
  @observable renderer = undefined;
  @observable status = '';
  @observable connection_error = undefined;
  @observable connection_status = 'pending';
  @observable outlined = [];

  /** Updates whenever an image is rendered */
  @observable image_rendered = {
      count: 0,
      data: {}
  };

  version = '4442';

  render_loop_expiry_time = 10;

}
