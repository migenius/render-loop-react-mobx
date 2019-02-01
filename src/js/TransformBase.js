/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
import {Vector4,Matrix4x4} from "realityserver";
import {observable,computed,action} from "mobx";

/**
 * @file TransformBase.js
 * Defines the TransformBase class.
 */

/**
 * @class TransformBase.
 */
 
 /**
 * @ctor
 * Creates a %TransformBase.
 */
export default class TransformBase
{
	@observable
	m_translation;
				
	@observable
	m_x_axis;
	
	@observable
	m_y_axis;
	
	@observable
	m_z_axis;

	@observable
	m_scale;

	@observable		
	m_dirty_matrix;

	static X_AXIS = new Vector4(1, 0, 0);
	static Y_AXIS = new Vector4(0, 1, 0);
	static Z_AXIS = new Vector4(0, 0, 1);

	static NEG_X_AXIS = new Vector4(-1, 0, 0);
	static NEG_Y_AXIS = new Vector4( 0,-1, 0);
	static NEG_Z_AXIS = new Vector4( 0, 0,-1);

	constructor() {
		this.m_translation = new Vector4();

		this.m_x_axis = TransformBase.X_AXIS.clone();
		this.m_y_axis = TransformBase.Y_AXIS.clone();
		this.m_z_axis = TransformBase.Z_AXIS.clone();

		this.m_scale = new Vector4(1, 1, 1);

		this.m_dirty_matrix = true;
	}


	/**
	 * Returns a new transform exactly the same as the current one.
	 */
	clone()
	{
		var transform = new TransformBase();
		this.populateClone(transform);

		return transform;
	}

	/**
	 * Populates the clone with all the required information.
	 * Can be used by subclasses so that they can add their own
	 * data to the populating process.
	 */
	populateClone(clone)
	{
		//clone.m_world_to_obj.setFromMatrix(this.m_world_to_obj);

		clone.m_translation.set(this.m_translation);
		clone.m_z_axis.set(this.m_z_axis);
		clone.m_y_axis.set(this.m_y_axis);
		clone.m_x_axis.set(this.m_x_axis);
		clone.m_scale.set(this.m_scale);
		clone.m_dirty_matrix = this.m_dirty_matrix;
	}

	deriveWorldToObj(x_axis,y_axis,z_axis,translation,scale)
	{
		const world_to_obj = new Matrix4x4();;

		world_to_obj.xx = x_axis.x;
		world_to_obj.yx = x_axis.y;
		world_to_obj.zx = x_axis.z;

		world_to_obj.xy = y_axis.x;
		world_to_obj.yy = y_axis.y;
		world_to_obj.zy = y_axis.z;

		world_to_obj.xz = z_axis.x;
		world_to_obj.yz = z_axis.y;
		world_to_obj.zz = z_axis.z;

		var c = new Vector4();

		c.x = world_to_obj.xx;
		c.y = world_to_obj.yx;
		c.z = world_to_obj.zx;
		world_to_obj.wx = -1 * translation.dot(c);

		c.x = world_to_obj.xy;
		c.y = world_to_obj.yy;
		c.z = world_to_obj.zy;
		world_to_obj.wy = -1 * translation.dot(c);

		c.x = world_to_obj.xz;
		c.y = world_to_obj.yz;
		c.z = world_to_obj.zz;
		world_to_obj.wz = -1 * translation.dot(c);

		world_to_obj.xx /= scale.x;
		world_to_obj.yx /= scale.x;
		world_to_obj.zx /= scale.x;
		world_to_obj.wx /= scale.x;

		world_to_obj.xy /= scale.y;
		world_to_obj.yy /= scale.y;
		world_to_obj.zy /= scale.y;
		world_to_obj.wy /= scale.y;

		world_to_obj.xz /= scale.z;
		world_to_obj.yz /= scale.z;
		world_to_obj.zz /= scale.z;
		world_to_obj.wz /= scale.z;
		return world_to_obj;
	}
	/**
	 * Calculates the location, direction and up from the current world_to_obj matrix.
	 */
	@action
	deriveVectors(worldToObj)
	{
		var obj_to_world = new Matrix4x4(worldToObj);
		obj_to_world.invert();

		this.m_translation.set(0,0,0);
		this.m_translation.transform(obj_to_world);  

		this.m_z_axis.set(TransformBase.Z_AXIS);
		this.m_z_axis.rotate(obj_to_world);
		this.m_z_axis.normalize();

		this.m_y_axis.set(TransformBase.Y_AXIS);
		this.m_y_axis.rotate(obj_to_world);
		this.m_y_axis.normalize();

		this.m_x_axis.set(TransformBase.X_AXIS);
		this.m_x_axis.rotate(obj_to_world);
		this.m_x_axis.normalize();
	}

	/**
	 * Allows for the transform to be set directly from a given Matrix4x4.
	 * 
	 * @param worldToObj The matrix to set the transform to. While it is an object
	 * 					 it must be an object that Matrix4x4.setFromObject can recognise.
	 */
	set worldToObj(worldToObj)
	{
		//this.m_world_to_obj.setFromObject(worldToObj);
		//this.m_dirty_matrix = false;
		this.deriveVectors(worldToObj);
	}

	@computed
	get worldToObj()
	{
		return this.deriveWorldToObj(this.m_x_axis,this.m_y_axis,this.m_z_axis,this.m_translation,this.m_scale);
	}

	/**
	 * Sets the elements of the translation vector.
	 */
	@action
	_setTranslation(x, y, z)
	{
		this.m_translation.set(x, y, z);
		this.m_dirty_matrix = true;
	}
	get translation()
	{
		return this.m_translation.clone();
	}

	get XAxis()
	{
		return this.m_x_axis.clone();
	}
	get YAxis()
	{
		return this.m_y_axis.clone();
	}
	get ZAxis()
	{
		return this.m_z_axis.clone();
	}

	/**
	 * Sets the absolute values of the elements of the scaling vector.
	 */
	@action
	_setScale(x, y, z)
	{
		this.m_scale.set(x, y, z);
		this.m_dirty_matrix = true;
	}

	/**
	 * Scales the transform scaling vector accumulatively.
	 */
	@action
	_scale(dx, dy, dz)
	{
		this.m_scale.x *= dx;
		this.m_scale.y *= dy;
		this.m_scale.z *= dz;
		this.m_dirty_matrix = true;
	}
	
	get scale()
	{
		return this.m_scale.clone();
	}

	/**
	 * Translates a given vector in either world space or object space by {dx, dy, dz}.
	 * This can be used by subclasses to 
	 */
	@action
	_translateVector(dx, dy, dz, vector, inObjectSpace)
	{
		if (inObjectSpace == true)
		{
			if(dx != 0)	vector.add(this.m_x_axis.clone().scale(dx));
			if(dy != 0)	vector.add(this.m_y_axis.clone().scale(dy));
			if(dz != 0)	vector.add(this.m_z_axis.clone().scale(dz));
		}
		else
		{
			vector.x += dx;
			vector.y += dy;
			vector.z += dz;
		}
	}

	/**
	 * Rotates an array of vectors around the given axis by the angle (in radians) in either world or object space.
	 */
	_rotateVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		if (inObjectSpace != true)
			inObjectSpace = false;
			
		var m = new Matrix4x4();
		if(inObjectSpace) {
			axis = axis.clone().rotate_transpose(this.worldToObj);
		}

		m.set_rotation(axis, angle);
		for(var i = 0; i < rotationVectors.length; i++)
		{
			rotationVectors[i].rotate(m);
		}
	}

	/**
	 * Rotates the transform around the current x axis by angle.
	 * An optional array of vectors can be given that will also be rotated.
	 */
	@action
	_rotateXVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		var vectors = [this.m_y_axis, this.m_z_axis];
		if (rotationVectors != null)
			vectors = vectors.concat(rotationVectors);
			
		if (inObjectSpace != true)
			inObjectSpace = false;

		this._rotateVectors(axis, angle, vectors, inObjectSpace);
		this.m_dirty_matrix = true;
	}

	/**
	 * Rotates the transform around the current y axis by angle.
	 * An optional array of vectors can be given that will also be rotated.
	 */
	@action
	_rotateYVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		var vectors = [this.m_x_axis, this.m_z_axis];
		if (rotationVectors != null)
			vectors = vectors.concat(rotationVectors);
			
		if (inObjectSpace != true)
			inObjectSpace = false;

		this._rotateVectors(axis, angle, vectors, inObjectSpace);
		this.m_dirty_matrix = true;
	}

	/**
	 * Rotates the transform around the current z axis by angle.
	 * An optional array of vectors can be given that will also be rotated.
	 */
	@action
	_rotateZVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		var vectors = [this.m_x_axis, this.m_y_axis];
		if (rotationVectors != null)
			vectors = vectors.concat(rotationVectors);
			
		if (inObjectSpace != true)
			inObjectSpace = false;

		this._rotateVectors(axis, angle, vectors, inObjectSpace);
		this.m_dirty_matrix = true;
	}

	/**
	 * Makes the transform look at the given point using the given up vector.
	 * If a setTranslation vector is given then the transform is also moved to that location,
	 * otherwise the transform's translation will be unaffected.
	 */
	@action
	_lookAtPoint(point, up, setTranslation)
	{
		if(setTranslation != null)
		{
			this._setTranslation(setTranslation.x, setTranslation.y, setTranslation.z);
		}

		this.m_y_axis.set(up);
		this.m_y_axis.normalize();

		var to_point = point.clone().subtract(this.m_translation);
		to_point.normalize();
		this.m_z_axis.set(to_point);

		this.m_x_axis = this.m_y_axis.cross(this.m_z_axis).normalize();
		this.m_y_axis = this.m_z_axis.cross(this.m_x_axis).normalize();

		this.m_dirty_matrix = true;
	}

}
