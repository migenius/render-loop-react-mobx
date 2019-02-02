import { observable, computed } from 'mobx';

export default class RenderLoopModel {
  @observable status = '';

  constructor(rs_state) {
      this.RS = rs_state;
  }

  @computed get connection_status() {
      if (this.RS.connection_error) {
          return this.RS.connection_error;
      } else {
          return this.RS.host ? ('Host: "' + this.RS.host + '" HTTP port: ' + this.RS.port) : 'Not Connected';
      }
  }
}
