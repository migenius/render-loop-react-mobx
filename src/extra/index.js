import {
  Camera,
  Transform,
  Transform_target
} from "@migenius/realityserver-extras";

import { observable, decorate, computed, action } from "mobx";

decorate(Camera, {
  m_transform: observable,
  m_orthographic: observable,
  m_aperture: observable,
  m_focal: observable,
  m_clip_max: observable,
  m_clip_min: observable,
  m_scene_up_direction: observable,
  set_from_object: action,
  set_from_camera: action,
  pan: action,
  dolly: action,
  elevate: action,
  orbit: action,
  orbit_around_point: action,
  rotate: action,
  tilt: action,
  spin: action,
  rotate_around_axis: action,
  translate: action,
  set_location: action,
  translate: action,
  levelCamera: action,
  matrix: computed,
  orthographic: computed,
  field_of_view: computed,
  aperture: computed,
  focal: computed,
  transform: computed,
  clip_max: computed,
  clip_min: computed,
  target_point: computed,
  direction: computed,
  up: computed,
  right: computed,
  location: computed,
  scene_up_direction: computed,
  follow_target_point: computed
});

decorate(Transform, {
  m_translation: observable,
  m_x_axis: observable,
  m_y_axis: observable,
  m_z_axis: observable,
  m_scale: observable,
  m_dirty_matrix: observable,
  derive_vectors: action,
  _set_translation: action,
  _set_scale: action,
  _scale: action,
  _translate_vector: action,
  _rotate_vectors: action,
  _rotate_x_vectors: action,
  _rotate_y_vectors: action,
  _rotate_z_vectors: action,
  world_to_obj: computed
});

decorate(Transform_target, {
  m_target_point: observable,
  _look_at_point: action,
  look_at_target_point: action,
  //follow_target_point: action,
  set_target_point: action,
  translate_target_point: action,
  translate: action,
  set_translation: action,
  _rotate_y_vectors: action,
  rotate: action,
  set_rotation: action,
  rotate_around_axis: action,
  set_rotation_around_axis: action,
  rotate_around_point: action,
  orbit_around_target_point: action,
  //world_to_obj: computed
  target_point: computed
});

export { Camera };
export { Transform };
export { Transform_target };
