/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
import {Vector4,Matrix4x4} from "com/mi/rs/index.js";

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
	m_translation;
				
	m_x_axis;
	m_y_axis;
	m_z_axis;

	m_scale;

	m_world_to_obj;
				
	m_dirty_matrix;

	static X_AXIS = new Vector4([1, 0, 0]);
	static Y_AXIS = new Vector4([0, 1, 0]);
	static Z_AXIS = new Vector4([0, 0, 1]);

	static NEG_X_AXIS = new Vector4([-1, 0, 0]);
	static NEG_Y_AXIS = new Vector4([ 0,-1, 0]);
	static NEG_Z_AXIS = new Vector4([ 0, 0,-1]);

	constructor() {
		this.m_translation = new Vector4();

		this.m_x_axis = TransformBase.X_AXIS.clone();
		this.m_y_axis = TransformBase.Y_AXIS.clone();
		this.m_z_axis = TransformBase.Z_AXIS.clone();

		this.m_scale = new Vector4([1, 1, 1]);

		this.m_world_to_obj = new Matrix4x4();

		this.m_dirty_matrix = true;
	}


	/**
	 * Returns a new transform exactly the same as the current one.
	 */
	clone()
	{
		var transform = new TransformBase();
		this._populateClone(transform);

		return transform;
	}

	/**
	 * Populates the clone with all the required information.
	 * Can be used by subclasses so that they can add their own
	 * data to the populating process.
	 */
	populateClone(clone)
	{
		clone.m_world_to_obj.setFromMatrix(this.m_world_to_obj);

		clone.m_translation.setFromVector(this.m_translation);
		clone.m_z_axis.setFromVector(this.m_z_axis);
		clone.m_y_axis.setFromVector(this.m_y_axis);
		clone.m_x_axis.setFromVector(this.m_x_axis);
		clone.m_scale.setFromVector(this.m_scale);
		clone.m_dirty_matrix = this.m_dirty_matrix;
	}

	/**
	 * Calculates the location, direction and up from the current world_to_obj matrix.
	 */
	deriveVectors()
	{
		var obj_to_world = this.m_world_to_obj.clone();
		obj_to_world.invert();

		this.m_translation.setElements();
		this.m_translation.transformTranspose(obj_to_world);  

		this.m_z_axis.setFromVector(TransformBase.Z_AXIS);
		this.m_z_axis.rotateTranspose(obj_to_world);
		this.m_z_axis.normalize();

		this.m_y_axis.setFromVector(TransformBase.Y_AXIS);
		this.m_y_axis.rotateTranspose(obj_to_world);
		this.m_y_axis.normalize();

		this.m_x_axis.setFromVector(TransformBase.X_AXIS);
		this.m_x_axis.rotateTranspose(obj_to_world);
		this.m_x_axis.normalize();
	}

	/**
	 * When the transform is dirty a new world_to_obj matrix is calculated
	 * and the transform is cleaned. This can be called at anytime however.
	 */
	deriveWorldToObj()
	{
		this.m_world_to_obj.setIdentity();

		this.m_world_to_obj.xx = this.m_x_axis.x;
		this.m_world_to_obj.yx = this.m_x_axis.y;
		this.m_world_to_obj.zx = this.m_x_axis.z;

		this.m_world_to_obj.xy = this.m_y_axis.x;
		this.m_world_to_obj.yy = this.m_y_axis.y;
		this.m_world_to_obj.zy = this.m_y_axis.z;

		this.m_world_to_obj.xz = this.m_z_axis.x;
		this.m_world_to_obj.yz = this.m_z_axis.y;
		this.m_world_to_obj.zz = this.m_z_axis.z;

		var c = new Vector4();

		c.x = this.m_world_to_obj.xx;
		c.y = this.m_world_to_obj.yx;
		c.z = this.m_world_to_obj.zx;
		this.m_world_to_obj.wx = -1 * this.m_translation.dot(c);

		c.x = this.m_world_to_obj.xy;
		c.y = this.m_world_to_obj.yy;
		c.z = this.m_world_to_obj.zy;
		this.m_world_to_obj.wy = -1 * this.m_translation.dot(c);

		c.x = this.m_world_to_obj.xz;
		c.y = this.m_world_to_obj.yz;
		c.z = this.m_world_to_obj.zz;
		this.m_world_to_obj.wz = -1 * this.m_translation.dot(c);

		this.m_world_to_obj.xx /= this.m_scale.x;
		this.m_world_to_obj.yx /= this.m_scale.x;
		this.m_world_to_obj.zx /= this.m_scale.x;
		this.m_world_to_obj.wx /= this.m_scale.x;

		this.m_world_to_obj.xy /= this.m_scale.y;
		this.m_world_to_obj.yy /= this.m_scale.y;
		this.m_world_to_obj.zy /= this.m_scale.y;
		this.m_world_to_obj.wy /= this.m_scale.y;

		this.m_world_to_obj.xz /= this.m_scale.z;
		this.m_world_to_obj.yz /= this.m_scale.z;
		this.m_world_to_obj.zz /= this.m_scale.z;
		this.m_world_to_obj.wz /= this.m_scale.z;

		this.m_dirty_matrix = false;
	}

	/**
	 * Allows for the transform to be set directly from a given Matrix4x4.
	 * 
	 * @param worldToObj The matrix to set the transform to. While it is an object
	 * 					 it must be an object that Matrix4x4.setFromObject can recognise.
	 */
	set worldToObj(worldToObj)
	{
		this.m_world_to_obj.setFromObject(worldToObj);
		this.m_dirty_matrix = false;
		this.deriveVectors();
	}
	get worldToObj()
	{
		if(this.m_dirty_matrix)
		{
			this.deriveWorldToObj();
		}
		return this.m_world_to_obj;
	}

	/**
	 * Sets the elements of the translation vector.
	 */
	_setTranslation(x, y, z)
	{
		this.m_translation.setElements(x, y, z);
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
	_setScale(x, y, z)
	{
		this.m_scale.setElements(x, y, z);
		this.m_dirty_matrix = true;
	}

	/**
	 * Scales the transform scaling vector accumulatively.
	 */
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
			
		var m = new com.mi.rs.types.Matrix4x4();
		if(inObjectSpace)
			axis = axis.clone().rotateTranspose(this.worldToObj);

		m.setRotation(axis, angle);
		for(var i = 0; i < rotationVectors.length; i++)
		{
			rotationVectors[i].rotate(m);
		}
	}

	/**
	 * Rotates the transform around the current x axis by angle.
	 * An optional array of vectors can be given that will also be rotated.
	 */
	_rotateXVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		var vectors = [this.m_y_axis, this.m_z_axis];
		if (rotationVectors != null)
			vectors = vectors.concat(rotationVectors);
			
		if (inObjectSpace != true)
			inObjectSpace = false;

		this._rotateVectors(axis, angle, vectors, inObjectSpace);
	}

	/**
	 * Rotates the transform around the current y axis by angle.
	 * An optional array of vectors can be given that will also be rotated.
	 */
	_rotateYVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		var vectors = [this.m_x_axis, this.m_z_axis];
		if (rotationVectors != null)
			vectors = vectors.concat(rotationVectors);
			
		if (inObjectSpace != true)
			inObjectSpace = false;

		this._rotateVectors(axis, angle, vectors, inObjectSpace);
	}

	/**
	 * Rotates the transform around the current z axis by angle.
	 * An optional array of vectors can be given that will also be rotated.
	 */
	_rotateZVectors(axis, angle, rotationVectors, inObjectSpace)
	{
		var vectors = [this.m_x_axis, this.m_y_axis];
		if (rotationVectors != null)
			vectors = vectors.concat(rotationVectors);
			
		if (inObjectSpace != true)
			inObjectSpace = false;

		this._rotateVectors(axis, angle, vectors, inObjectSpace);
	}

	/**
	 * Makes the transform look at the given point using the given up vector.
	 * If a setTranslation vector is given then the transform is also moved to that location,
	 * otherwise the transform's translation will be unaffected.
	 */
	_lookAtPoint(point, up, setTranslation)
	{
		if(setTranslation != null)
		{
			this._setTranslation(setTranslation.x, setTranslation.y, setTranslation.z);
		}

		this.m_y_axis.setFromVector(up);
		this.m_y_axis.normalize();

		var to_point = point.clone().subtract(this.m_translation);
		to_point.normalize();
		this.m_z_axis.setFromVector(to_point);

		this.m_x_axis = this.m_y_axis.cross(this.m_z_axis).normalize();
		this.m_y_axis = this.m_z_axis.cross(this.m_x_axis).normalize();

		this.m_dirty_matrix = true;
	}

}
