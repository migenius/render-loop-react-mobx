/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/
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
 * Creates a %TransformTarget.
 */
const TransformBase = function()
{
	this.m_translation = new Vector4();
				
	this.m_x_axis = TransformBase.X_AXIS.clone();
	this.m_y_axis = TransformBase.Y_AXIS.clone();
	this.m_z_axis = TransformBase.Z_AXIS.clone();

	this.m_scale = new Vector4([1, 1, 1]);

	this.m_world_to_obj = new Matrix4x4();
				
	this.m_dirty_matrix = true;
}

/**
 * Static constants.
 */
TransformBase.X_AXIS = new Vector4([1, 0, 0]);
TransformBase.Y_AXIS = new Vector4([0, 1, 0]);
TransformBase.Z_AXIS = new Vector4([0, 0, 1]);

TransformBase.NEG_X_AXIS = new Vector4([-1, 0, 0]);
TransformBase.NEG_Y_AXIS = new Vector4([ 0,-1, 0]);
TransformBase.NEG_Z_AXIS = new Vector4([ 0, 0,-1]);

/**
 * TransformBases local variables.
 */
TransformBase.prototype.m_world_to_obj;
TransformBase.prototype.m_translation;
TransformBase.prototype.m_x_axis;
TransformBase.prototype.m_y_axis;
TransformBase.prototype.m_z_axis;
TransformBase.prototype.m_scale;
TransformBase.prototype.m_dirty_matrix;

/**
 * Returns a new transform exactly the same as the current one.
 */
TransformBase.prototype.clone = function()
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
TransformBase.prototype.populateClone = function(clone)
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
TransformBase.prototype.deriveVectors = function()
{
	var obj_to_world = this.getWorldToObj().clone();
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
TransformBase.prototype.deriveWorldToObj = function()
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
TransformBase.prototype.setWorldToObj = function(worldToObj)
{
	this.m_world_to_obj.setFromObject(worldToObj);
	this.m_dirty_matrix = false;
	this.deriveVectors();
}
TransformBase.prototype.getWorldToObj = function()
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
TransformBase.prototype._setTranslation = function(x, y, z)
{
	this.m_translation.setElements(x, y, z);
	this.m_dirty_matrix = true;
}
TransformBase.prototype.getTranslation = function()
{
	return this.m_translation.clone();
}

TransformBase.prototype.getXAxis = function()
{
	return this.m_x_axis.clone();
}
TransformBase.prototype.getYAxis = function()
{
	return this.m_y_axis.clone();
}
TransformBase.prototype.getZAxis = function()
{
	return this.m_z_axis.clone();
}

/**
 * Sets the absolute values of the elements of the scaling vector.
 */
TransformBase.prototype._setScale = function(x, y, z)
{
	this.m_scale.setElements(x, y, z);
	this.m_dirty_matrix = true;
}

/**
 * Scales the transform scaling vector accumulatively.
 */
TransformBase.prototype._scale = function(dx, dy, dz)
{
	this.m_scale.x *= dx;
	this.m_scale.y *= dy;
	this.m_scale.z *= dz;
	this.m_dirty_matrix = true;
}
TransformBase.prototype.getScale = function()
{
	return this.m_scale.clone();
}

/**
 * Translates a given vector in either world space or object space by {dx, dy, dz}.
 * This can be used by subclasses to 
 */
TransformBase.prototype._translateVector = function(dx, dy, dz, vector, inObjectSpace)
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
TransformBase.prototype._rotateVectors = function(axis, angle, rotationVectors, inObjectSpace)
{
	if (inObjectSpace != true)
		inObjectSpace = false;
		
	var m = new com.mi.rs.types.Matrix4x4();
	if(inObjectSpace)
		axis = axis.clone().rotateTranspose(this.getWorldToObj());

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
TransformBase.prototype._rotateXVectors = function(axis, angle, rotationVectors, inObjectSpace)
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
TransformBase.prototype._rotateYVectors = function(axis, angle, rotationVectors, inObjectSpace)
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
TransformBase.prototype._rotateZVectors = function(axis, angle, rotationVectors, inObjectSpace)
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
TransformBase.prototype._lookAtPoint = function(point, up, setTranslation)
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

export default TransformBase;