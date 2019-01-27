/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/
import TransformBase from "./TransformBase";
import {Vector4} from "com/mi/rs/index.js";

/**
 * @file TransformTarget.js
 * Defines the TransformTarget class.
 */


/**
 * @class TransformTarget.
 */

/**
 * @ctor
 * Creates a %TransformTarget.
 */
const TransformTarget = function()
{
	this.m_super = new TransformBase();
	
	this.m_follow_target_point = true;
	
	// Default to Y up scenes.
	this.m_up_direction = TransformBase.Y_AXIS.clone();

	// So the target point is not the same as the translation.
	this.m_target_point = new Vector4([0, 0, -1]);
	this.m_super.m_z_axis.z = -1;
}

TransformTarget.prototype.m_up_direction;

TransformTarget.prototype.m_target_point;

TransformTarget.prototype.m_follow_target_point;

TransformTarget.prototype.deriveWorldToObj = function()
{
	this.m_super.m_z_axis.scale(-1);
	this.m_super.deriveWorldToObj();
	this.m_super.m_z_axis.scale(-1);
}

TransformTarget.prototype.deriveVectors = function()
{
	this.m_super.deriveVectors();
	this.m_super.m_z_axis.scale(-1);
}

TransformTarget.prototype.getWorldToObj = function()
{
	if(this.m_super.m_dirty_matrix)
	{
		this.deriveWorldToObj();
	}
	return this.m_super.m_world_to_obj;
}

TransformTarget.prototype.setWorldToObj = function(worldToObj)
{
	var dist = this.m_super.m_translation.distance(this.m_target_point);
	
	this.m_super.m_world_to_obj.setFromObject(worldToObj);
	this.m_super.m_dirty_matrix = false;
	this.deriveVectors();
	
	this.updateTargetPoint(dist);
}

TransformTarget.prototype.clone = function()
{
	var transform = new TransformTarget();
	this.populateClone(transform);
				
	return transform;
}

TransformTarget.prototype.populateClone = function(clone)
{
	this.m_super.populateClone(clone);

	var transform = clone;
	transform.m_follow_target_point = this.m_follow_target_point;
	transform.m_up_direction.setFromVector(this.m_up_direction);
	transform.m_target_point.setFromVector(this.m_target_point);
}

TransformTarget.prototype._lookAtPoint = function(point, up, setTranslation)
{
	this.m_super._lookAtPoint(point, up, setTranslation);
	this.m_super.m_x_axis.scale(-1);
}

/**
 * Short hand to look at the target point.
 */
TransformTarget.prototype.lookAtTargetPoint = function(resetYVector)
{
	if(resetYVector == true)
	{
		this._lookAtPoint(this.m_target_point, this.m_up_direction);
	}
	else
	{	
		// Get what the right vector would be without roll. 
		var noRollRight = this.m_super.m_z_axis.cross(this.m_up_direction);
		noRollRight.normalize();
		// Get the angle between the current right vector and the right vector without roll.
		var rollAngle = Math.acos(this.m_super.m_x_axis.dot(noRollRight));
		// rollAngle current only has the different between the two right vectors but needs
		// to know which way it has been rolled.
		rollAngle *= this.m_up_direction.dot(this.m_super.m_x_axis) > 0 ? -1 : 1;

		this._lookAtPoint(this.m_target_point, this.m_up_direction);

		// Now that we are looking at the target point the up direction has be reset, now
		// we need to re-apply the roll to the transform.
		// Depending on how rounding occurs sometimes we can get NaN from the result.
		// We can assume that NaN means the roll is zero.
		if(!isNaN(rollAngle) && rollAngle != 0)
			this.rotate(0, 0, rollAngle, false);
	}
}

/**
 * Moves the target point to be at the end of the z axis, at a distance
 * that is either given in 'dist' or is based on the target points
 * previous distance from the translation vector.
 */
TransformTarget.prototype.updateTargetPoint = function(dist)
{
	// Distance CAN be less than zero, however that will just mean that the
	// target point ends up behind the translation point compared to where
	// it was before. The distance however CANNOT be zero as the would place
	// the target point at the translation vector which is not allowed.
	if(dist == null || dist == 0)
	{
		dist = this.m_super.m_translation.distance(this.m_target_point);
	}
	var to_target = this.getZAxis().scale(dist);
	this.m_target_point.setFromVector(this.m_super.m_translation);
	this.m_target_point.add(to_target);
}

/**
 * Sets the up direction vector.
 */
TransformTarget.prototype.setUpDirection = function(upVector)
{
	this.m_up_direction.setFromVector(upVector);
}
TransformTarget.prototype.getUpDirection = function()
{
	return this.m_up_direction.clone();
}

/**
 * Sets if the target point will followed.
 */ 
TransformTarget.prototype.setFollowTargetPoint = function(follow)
{
	this.m_follow_target_point = follow;
	if(follow)
	{
		this.lookAtTargetPoint();
	}
}
TransformTarget.prototype.getFollowTargetPoint = function()
{
	return this.m_follow_target_point;
}

/**
 * Sets the target point. Target point CANNOT be ontop of the translation vector.
 */
TransformTarget.prototype.setTargetPoint = function(targetPoint, resetYVector)
{
	if(targetPoint.equal(this.m_super.m_translation))
	{
		throw new Error("Target point is directly ontop of translation vector!");
	}
	
	// If we are setting the target point back to the same location then 
	// we don't need to set it and potentially call a lookAtTargetPoint.
	if(Vector4.equalWithTolerance(targetPoint, this.m_target_point))
	{
		return;
	}
	
	this.m_target_point.setFromVector(targetPoint);
	if(this.m_follow_target_point)
	{
		if (resetYVector != false)
			resetYVector = true;
			
		this.lookAtTargetPoint(resetYVector);
	}
}
TransformTarget.prototype.getTargetPoint = function()
{
	return this.m_target_point.clone();
}

/**
 * Translates the target point by {dx, dy, dz} in either world space or object space.
 * Resulting target point CANNOT be ontop of translation vector.
 */
TransformTarget.prototype.translateTargetPoint = function(dx, dy, dz, inObjectSpace)
{
	// Defaults to true.
	if (inObjectSpace != false)
		inObjectSpace = true;
		
	this.m_super._translateVector(dx, dy, dz, this.m_target_point, inObjectSpace);

	if(this.m_target_point.equal(this.m_super.m_translation))
	{
		throw new Error("Target point is directly ontop of translation vector!");
	}
	if(this.m_follow_target_point)
	{
		this.lookAtTargetPoint(false);
	}
	this.m_super.m_dirty_matrix = true;
}

/**
 * Translates the transform by {dx, dy, dz} in either world space or object space.
 * Can also translate the target point by the same values.
 */
TransformTarget.prototype.translate = function(dx, dy, dz, inObjectSpace, translateTarget)
{
	// Defaults to true.
	if (inObjectSpace != false)
		inObjectSpace = true;
		
	// Defaults to true.
	if (translateTarget != false)
		translateTarget = true;
		
	this.m_super._translateVector(dx, dy, dz, this.m_super.m_translation, inObjectSpace);
	this.m_super.m_dirty_matrix = true;
	
	if (translateTarget)
	{
		this.translateTargetPoint(dx, dy, dz, inObjectSpace);
	}
	else if(this.m_follow_target_point)
	{
		this.lookAtTargetPoint(false);
	}
}

/**
 * Sets the translation to {x, y, z} in world space. If translateTarget is set then
 * the target point will retain it's relative position from the translation vector.
 */
TransformTarget.prototype.setTranslation = function(x, y, z, translateTarget)
{
	// Defaults to true.
	if (translateTarget != false)
		translateTarget = true;
		
	var oldTranslation = this.getTranslation();
	this.m_super._setTranslation(x, y, z);
	if (translateTarget)
	{
		this.translateTargetPoint(x - oldTranslation.x, y - oldTranslation.y, z - oldTranslation.z, false);
	}
	else if(this.m_follow_target_point)
	{
		this.lookAtTargetPoint(false);
	}
}

TransformTarget.prototype._rotateYVectors = function(axis, angle, rotationVectors, inObjectSpace)
{
	var vectors = [this.m_super.m_x_axis, this.m_super.m_y_axis, this.m_super.m_z_axis];
	if (rotationVectors != null)
		vectors = vectors.concat(rotationVectors);
		
	if (inObjectSpace != true)
		inObjectSpace = false;

	this._rotateVectors(axis, angle, vectors, inObjectSpace);
}

/**
 * Rotates the transform by {dx, dy, dz}. If rotateTargetPoint is set to true then the target point
 * will be rotated around the translation vector. 
 * 
 * If it is set to false and we are following the target point then transform is only rotated by {0, 0, dz}
 * to keep the transform always looking at the target point.
 */
TransformTarget.prototype.rotate = function(dx, dy, dz, rotateTargetPoint)
{
	// Default to true.
	if (rotateTargetPoint != false)
		rotateTargetPoint = true;
		
	this.m_super._rotateZVectors(this.m_super.m_z_axis, dz);
	
	if (rotateTargetPoint || !this.m_follow_target_point)
	{
		this._rotateYVectors(this.m_up_direction, dy);
		this.m_super._rotateXVectors(this.m_super.m_x_axis, dx);
	}

	if (rotateTargetPoint)
	{
		this.updateTargetPoint();
	}
	
	this.m_super.m_dirty_matrix = true;
}

/**
 * This sets the rotation of the transform. If rotateTargetPoint is set to true then the target point
 * will be rotated around the translation vector. 
 * 
 * If it is set to false and we are following the target point then transform is only rotated by {0, 0, z}
 * to keep the transform always looking at the target point.
 */
TransformTarget.prototype.setRotation = function(x, y, z, rotateTargetPoint)
{
	// Defaults to true.
	if (rotateTargetPoint != false)
		rotateTargetPoint = true;
		
	if (rotateTargetPoint || !this.m_follow_target_point)
	{
		this.m_super.m_x_axis.setFromVector(TransformBase.X_AXIS);
		this.m_super.m_y_axis.setFromVector(TransformBase.Y_AXIS);
	}
	this.m_super.m_z_axis.setFromVector(TransformBase.NEG_Z_AXIS);

	this.rotate(x, y, z, rotateTargetPoint);
}

/**
 * Rotates the transform about the given axis by the given angle in radians. If inObjectSpace is set to true,
 * then the axis will be transform into object space first. If rotateTargetPoint is set to true then the target point
 * is also rotated.
 */
TransformTarget.prototype.rotateAroundAxis = function(axis, angle, inObjectSpace, rotateTargetPoint)
{
	if (inObjectSpace != false)
		inObjectSpace = true;
		
	if (rotateTargetPoint != false)
		rotateTargetPoint = true;
		
	this.m_super._rotateVectors(axis, angle, [this.m_super.m_x_axis, this.m_super.m_y_axis, this.m_super.m_z_axis], inObjectSpace);

	if (rotateTargetPoint)
	{
		this.updateTargetPoint();
	}
	else if(this.m_follow_target_point)
	{
		this.lookAtTargetPoint(false);
	}
	this.m_super.m_dirty_matrix = true;
}

/**
 * Sets the rotation of the transform about the given axis by the given angle in radians. If inObjectSpace is set to true,
 * then the axis will be transform into object space first. If rotateTargetPoint is set to true then the target point
 * is also rotated.
 */
TransformTarget.prototype.setRotationAroundAxis = function(axis, angle, rotateTargetPoint)
{
	if (rotateTargetPoint != false)
		rotateTargetPoint = true;
		
	this.m_super.m_x_axis.setFromVector(TransformBase.X_AXIS);
	this.m_super.m_y_axis.setFromVector(TransformBase.Y_AXIS);
	this.m_super.m_z_axis.setFromVector(TransformBase.NEG_Z_AXIS);

	this.rotateAroundAxis(axis, angle, false, rotateTargetPoint);
}

/**
 * Rotates the transform around a given world space point by {dx, dy, dz}. If rotateTargetPoint is set to true
 * and the target point is not at the same location as the given point, then the target point is also rotated
 * around the point.
 */
TransformTarget.prototype.rotateAroundPoint = function(point, dx, dy, dz, rotateTargetPoint)
{
	if (rotateTargetPoint != false)
		rotateTargetPoint = true;
		
	if (rotateTargetPoint && (point == this.m_target_point || 
		Vector4.equalWithTolerance(point, this.m_target_point)))
	{
		rotateTargetPoint = false;
	}
	
	var to_point = this.getTranslation().subtract(point);
	var to_target_point;
	var rotate;
	
	if(rotateTargetPoint)
	{
		to_target_point = this.getTargetPoint().subtract(point);
		rotate = [to_point, to_target_point];
	}
	else
	{
		rotate = [to_point];
	}
	
	this.m_super._rotateZVectors(this.m_super.m_z_axis, dz);
	this.m_super._rotateYVectors(this.m_up_direction, dy, rotate);
	this.m_super._rotateXVectors(this.m_super.m_x_axis, dx, rotate);
	
	this.m_super.m_translation.setFromVector(point);
	this.m_super.m_translation.add(to_point);

	if(rotateTargetPoint)
	{
		this.m_target_point.setFromVector(point);
		this.m_target_point.add(to_target_point);
	}
	else if(this.m_follow_target_point)
	{
		this.lookAtTargetPoint(false);
	}
	
	this.m_super.m_dirty_matrix = true;
}

/**
 * Short hand for rotating around the target point by {dx, dy, dz}.
 */
TransformTarget.prototype.orbitAroundTargetPoint = function(dx, dy, dz)
{
	this.rotateAroundPoint(this.m_target_point, dx, dy, dz, false);
}	
		
		


/**
 * Public functions from super class
 */
 



TransformTarget.prototype.getTranslation = function()
{
	return this.m_super.getTranslation();
}

TransformTarget.prototype.getXAxis = function()
{
	return this.m_super.getXAxis();
}
TransformTarget.prototype.getYAxis = function()
{
	return this.m_super.getYAxis();
}
TransformTarget.prototype.getZAxis = function()
{
	return this.m_super.getZAxis();
}

export default TransformTarget;