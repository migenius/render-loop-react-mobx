/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/
import TransformTarget from "./TransformTarget";
import TransformBase from "./TransformBase";
import PropertyChangeEvent from "./PropertyChangeEvent";
import {EventDispatcher,Matrix4x4} from "com/mi/rs/index.js";

/**
 * @file RSCamera.js
 * RSCamera class.
 */

/**
 * @class RSCamera
 * A client side representation of a camera. 
 */

/**
 * @ctor
 * Creates a %RSCamera.
 */
const RSCamera = function()
{
	this.m_transform = new TransformTarget();
	this.m_orthographic = false;
	this.m_aperture = 100;
	this.m_focal = 50;
	this.m_clip_max = 1000;
	this.m_clip_min = 0.1;
	
	this.m_scene_up_direction = RSCamera.Y_UP;
	
	this.m_dispatcher = new EventDispatcher();
}

RSCamera.Y_UP = 0;

RSCamera.Z_UP = 1;

RSCamera.prototype.m_transform;

RSCamera.prototype.m_scene_up_direction;

RSCamera.prototype.m_orthographic;

RSCamera.prototype.m_aperture;

RSCamera.prototype.m_focal;

RSCamera.prototype.m_clip_max;

RSCamera.prototype.m_clip_min;

RSCamera.prototype.m_dispatcher;

/**
 * Clones a RSCamera. This performs a deep copy on this RSCamera.
 * 
 * @return The cloned RSCamera.
 */
RSCamera.prototype.clone = function()
{
	var newCamera = new RSCamera();
	this.populateClone(newCamera);
	return newCamera;
}

/**
 * Used to put values onto a newly created clone. Can be extended
 * by subclasses to include more values.
 */
RSCamera.prototype.populateClone = function(camera)
{
	camera.m_orthographic = this.m_orthographic;
	camera.m_aperture = this.m_aperture;
	camera.m_focal = this.m_focal;
	camera.m_clip_max = this.m_clip_max;
	camera.m_clip_min = this.m_clip_min;
	camera.m_transform = this.m_transform.clone();
	camera.m_scene_up_direction = this.m_scene_up_direction;
}

RSCamera.prototype.attributeChange = function(property, newValue, oldValue)
{
	var eventName = property + "_change";
	this.dispatchEvent(new PropertyChangeEvent(eventName, this, newValue, oldValue, property));
}

/**
 * Sets the matrix of the transform from anything that Matrix4x4.setFromObject supports.
 */ 
RSCamera.prototype.setTransformFromObject = function(matrix)
{
	if(null != matrix)
	{
		this.m_transform.setWorldToObj(matrix);
		this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
	}
}
/**
 * Sets the camera data from either an object with appropriate properties
 * or from another RSCamera instance.
 */
RSCamera.prototype.setFromObject = function(camera)
{
	if(null != camera)
	{
		if(camera instanceof RSCamera)
		{
			this.setFromCamera(camera);
		}
		else
		{
			if(typeof(camera.orthographic) != "undefined")
				this.setOrthographic(camera.orthographic);
				
			if(typeof(camera.focal) != "undefined")
				this.setFocal(camera.focal);
				
			if(typeof(camera.aperture) != "undefined")
				this.setAperture(camera.aperture);
				
			if(typeof(camera.clip_max) != "undefined")
				this.setClipMax(camera.clip_max);
				
			if(typeof(camera.clip_min) != "undefined")
				this.setClipMin(camera.clip_min);
		}
	}
}

/**
 * Sets this camera from another.
 * 
 * @param camera The camera to set from.
 */
RSCamera.prototype.setFromCamera = function(camera)
{
	this.setTransform(camera.getTransform().clone());                 
	this.setAperture(camera.getAperture());
	this.setFocal(camera.getFocal());
	this.setOrthographic(camera.getOrthographic());
	this.setClipMax(camera.getClipMax());
	this.setClipMin(camera.getClipMin());
	this.setSceneUpDirection(camera.getSceneUpDirection());
}

/**
 * Pans the camera.
 * 
 * @param horizontal The amount to pan in the right direction.
 * @param vertical The amount to pan in the up direction.
 * @param shiftTargetPoint Move the target point with the camera.
 */               
RSCamera.prototype.pan = function(horizontal, vertical, shiftTargetPoint)
{
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.translate(horizontal, vertical, 0, true, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Dollies the camera.
 * 
 * @param depth The amount to move along the direction vector.
 * @param shiftTargetPoint Move the target point along direction*i_z.  
 */
RSCamera.prototype.dolly = function(depth, shiftTargetPoint)
{
	if (shiftTargetPoint != true)
		shiftTargetPoint = false;
		
	if(this.getOrthographic())
	{
		if(this.m_aperture + depth > 0)
		{
			this.setAperture(this.getAperture() + depth);
		}
	}
	else
	{
		this.m_transform.translate(0, 0, depth, true, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
	}
}

/**
 * Elevates the camera.
 * 
 * @param vertical The amount to move along the up vector.
 */ 
RSCamera.prototype.elevate = function(vertical)
{
	this.m_transform.translate(0, vertical, 0, true);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Orbits the camera. This method orbits using the initial up and right reference vectors.
 * 
 * @param verticalAxis The amount to rotate around the up vector in radians.
 * @param horizontalAxis The amount to rorate aroung the right vector in radians.
 * @param orbitPoint The point to orbit around, if set this will change the orbit point.
 */
RSCamera.prototype.orbit = function(verticalAxis, horizontalAxis, orbitPoint)
{
	if (orbitPoint != null) 
	{
		this.setTargetPoint(orbitPoint, false);
	}
	this.m_transform.orbitAroundTargetPoint(horizontalAxis, verticalAxis, 0);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Orbits the camera around a point in world space. This method acts much like the standard orbit function
 * however if you choose to orbit around a different point than the target point you can also rotate the
 * target point as well.
 * 
 * @param point The point to orbit around, this will NOT change the target point.
 * @param verticalAxis The amount to rotate around the up vector in radians.
 * @param horizontalAxis The amount to rorate aroung the right vector in radians.
 * @param shiftTargetPoint If true the target point will also rotate around the point.
 */
RSCamera.prototype.orbitAroundPoint = function(point, verticalAxis, horizontalAxis, shiftTargetPoint)
{
	if (shiftTargetPoint != true)
		shiftTargetPoint = false;
		
	this.m_transform.rotateAroundPoint(point, horizontalAxis, verticalAxis, 0, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Rotates the camera
 * 
 * @param verticalAxis Amount to rotate around the up vector in radians.
 * @param horizontalAxis Amount to rotate around the right vector in radians.
 * @param directionAxis Amount to rotate around the direction vector in radians.
 */
RSCamera.prototype.rotate = function(verticalAxis, horizontalAxis, directionAxis, shiftTargetPoint)
{
	if (isNaN(directionAxis))
		directionAxis = 0;
		
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.rotate(horizontalAxis, verticalAxis, directionAxis, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Tilts the camera by rotating around the right vector of the camera.
 * 
 * @param horizontalAxis The amount, in radians, to tilt.
 */
RSCamera.prototype.tilt = function(horizontalAxis, shiftTargetPoint)
{
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.rotate(horizontalAxis, 0, 0, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Spins the camera by rotating around the up vector of the camera.
 * 
 * @param verticalAxis The amount, in radians, to spin.
 */ 
RSCamera.prototype.spin = function(verticalAxis, shiftTargetPoint)
{
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.rotate(0, verticalAxis, 0, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Rotates the camera.
 * 
 * @param axis The axis to rotate about.
 * @param angle The amount, in radians, to rotate.
 */
RSCamera.prototype.rotateAroundAxis = function(axis, angle, inCameraSpace, shiftTargetPoint)
{
	if (inCameraSpace != true)
		inCameraSpace = false;
		
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.rotateAroundAxis(axis, angle, inCameraSpace, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Moves the camera to a given location.
 * 
 * @param location The position to move to.
 * @param shiftTargetPoint Set this parameter to true to shift the target point of the camera along the vector new_position -> old_position.
 */
RSCamera.prototype.moveTo = function(location, shiftTargetPoint)
{
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.setTranslation(location.x, location.y, location.z, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Moves the camera.
 * 
 * @param move The vector to move along.
 * @param shiftTargetPoint Set this parameter to true to shift the target point of the camera along v.
 */
RSCamera.prototype.translate = function(move, shiftTargetPoint)
{
	if (shiftTargetPoint != false)
		shiftTargetPoint = true;
		
	this.m_transform.translate(move.x, move.y, move.z, false, shiftTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * Transforms a point into camera space.
 * 
 * @param point The point to tranform.
 * @param result The result of the transform.
 * @return Always true.
 */
RSCamera.prototype.transformPoint = function(point, result)
{
	var world2Cam = this.getTransform().getWorldToObj();
	result.setFromVector(point)
	result.transform(world2Cam);
	return true;
}

/**
 * Transforms a vector to camera space.
 * 
 * @param direction The vector to transform.
 * @param result The result of the transform.
 * @return Always true.
 */
RSCamera.prototype.transformDirection = function(direction, result)
{
	var world2Cam = this.getTransform().getWorldToObj();
	var myDir = direction.clone();
	result.setFromVector(myDir.rotate(world2Cam));
	return true;
}

/**
 * Transforms a vector from camera space to world space.
 * 
 * @param direction The vector to transform.
 * @param result The result of the transform.
 * @result Always true.
 */
RSCamera.prototype.transformDirectionToWorld = function(direction, result)
{
	var cam2World = this.getTransform().getWorldToObj().clone();
	var myDir = direction.clone();
	cam2World.invert();
	result.setFromVector(myDir.rotateTranspose(cam2World));
	return true;
}

 /**
  * Compares two cameras for equality. Equality means apertures, focal lengths, fields of view and transforms are the same.
  * 
  * @param camera1 A camera.
  * @param camera2 Another camera.
  * @result True if camera1 equals camera2.
  */ 
RSCamera.prototype.equal = function(rhs)
{
	if(rhs == this)
		return true;
		
	var result = false;

	if ((this.getAperture() == rhs.getAperture()) &&
		(this.getFocal() == rhs.getFocal()) &&
		(this.getFieldOfView() == rhs.getFieldOfView()))
		{
			var matrix1 = this.getTransform().getWorldToObj();
			var matrix2 = rhs.getTransform().getWorldToObj(); 

			if( Matrix4x4.equalWithTolerance(matrix1,matrix2) == true)
				result = true;
		}
	return result;
}

/**
 * DEPRECATED: Use camera1.equal(camera2) instead.
 */
RSCamera.compare = function(camera1, camera2)
{
	return camera1.equal(camera2);
}

/**
 * Aligns the camera to the horizontal plane
 */ 
RSCamera.prototype.levelCamera = function()
{
	// Negative angle to the horizon based on the up vector.
	var angle = Math.asin(this.getDirection().dot(this.m_transform.getDefaultUpDirection()));
	this.m_transform.rotate(-angle, 0, 0);
	attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

RSCamera.prototype.getOrthographic = function()
{
	return this.m_orthographic;
}
/**
 * Sets the orthographic mode of the camera.
 * 
 * @param ortho Set to true to enable orthographic mode.
 */  
RSCamera.prototype.setOrthographic = function(ortho)
{
	if(ortho != this.m_orthographic)
	{
		this.m_orthographic = ortho;
		this.attributeChange("orthographic", ortho, !ortho);
	}
}

/**
 * Retrieves the field of view of the camera.
 * 
 * @return The field of view.
 */
RSCamera.prototype.getFieldOfView = function()
{
	if(this.m_orthographic)
	{
		return -1;
	}
	return Math.atan2(this.getAperture() / 2, this.getFocal());
}

/**
 * Sets the field of view of the camera.
 * 
 * @param halfFov The desired field of view divided by two in radians.
 */
RSCamera.prototype.setFieldOfView = function(halfFov)
{
	if(false == this.m_orthographic)
	{
		this.setAperture((this.m_focal * Math.tan(halfFov))*2);
	}
}

/**
 * The aperture of the camera.
 */   
RSCamera.prototype.getAperture = function()
{
	return this.m_aperture;
}

RSCamera.prototype.setAperture = function(aperture)
{
	if(isNaN(aperture))
	{	
		aperture = 1.0;
	}
	else
	{
		aperture = Math.abs(aperture);
	}

	if(this.m_aperture != aperture)
	{
		var oldValue = this.m_aperture;
		this.m_aperture = aperture;
		this.attributeChange("aperture", aperture, oldValue);
	}
}

/**
 * The focal length of the camera.
 */
RSCamera.prototype.getFocal = function()
{
	return this.m_focal;
}

RSCamera.prototype.setFocal = function(focal)
{
	var oldValue = this.m_focal;
	this.m_focal = focal;
	this.attributeChange("focal", focal, oldValue);
}

/**
 * The transform of the camera.
 */
RSCamera.prototype.getTransform = function()
{
	return this.m_transform;
}

RSCamera.prototype.setTransform = function(transform)
{
	if(transform != this.m_transform)
	{
		this.m_transform = transform;
		this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
	}
}

/**
* The clip max of the view frustum
*/
RSCamera.prototype.getClipMax = function()
{
	return this.m_clip_max;
}

RSCamera.prototype.setClipMax = function(clipMax)
{
	var oldValue = this.m_clip_max;
	this.m_clip_max = clipMax;
	this.attributeChange("clip_max", clipMax, oldValue);
}

/**
 * The clip min of the view frustum
 */
RSCamera.prototype.getClipMin = function()
{
	return this.m_clip_min;
}

RSCamera.prototype.setClipMin = function(clipMin)
{
	var oldValue = this.m_clip_min;
	this.m_clip_min = clipMin;
	this.attributeChange("clip_min", clipMin, oldValue);
}

/**
 * Sets the target point of the camera.
 * 
 * @param orbitPoint The new target point.
 */
RSCamera.prototype.setTargetPoint = function(targetPoint, resetUpVector)
{
	if (resetUpVector != false)
		resetUpVector = true;
		
	this.m_transform.setTargetPoint(targetPoint, resetUpVector);
	if(this.m_transform.getFollowTargetPoint())
		this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}
RSCamera.prototype.getTargetPoint = function()
{
	return this.m_transform.getTargetPoint();
}

/**
 * The look direction vector of the camera.
 */
RSCamera.prototype.getDirection = function()
{
	return this.m_transform.getZAxis();
}

/**
 * The up vector of the camera.
 */
RSCamera.prototype.getUp = function()
{
	return this.m_transform.getYAxis();
}

/**
 * The right vector of the camera.
 */
RSCamera.prototype.getRight = function()
{
	return this.m_transform.getXAxis();
}

RSCamera.prototype.setLocation = function(loc, moveTargetPoint)
{
	if (moveTargetPoint != true)
		moveTargetPoint = false;
		
	this.m_transform.setTranslation(loc.x, loc.y, loc.z, moveTargetPoint);
	this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
}

/**
 * The position of the camera in world space.
 */
RSCamera.prototype.getLocation = function()
{
	return this.m_transform.getTranslation();
}

/**
 * The up direction of the scene the camera is in.
 * Can be either Y_UP or Z_UP.
 */
RSCamera.prototype.setSceneUpDirection = function(upDir)
{
	if(this.m_scene_up_direction != upDir)
	{
		this.m_scene_up_direction = upDir;
		if(upDir == RSCamera.Y_UP)
			this.m_transform.setUpDirection(TransformBase.Y_AXIS);
		else
			this.m_transform.setUpDirection(TransformBase.NEG_Z_AXIS);

		this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
	}
}

RSCamera.prototype.getSceneUpDirection = function()
{
	return this.m_scene_up_direction;
}

RSCamera.prototype.setFollowTargetPoint = function(follow)
{
	var oldValue = this.getTransform().getFollowTargetPoint();
	if(oldValue != follow)
	{
		this.getTransform().setFollowTargetPoint(follow);
		this.attributeChange("follow_target_point", follow, oldValue);
		if(follow)
		{
			this.attributeChange("transform", this.m_transform.getWorldToObj(), null);
		}
	}
}
RSCamera.prototype.getFollowTargetPoint = function()
{
	return this.getTransform().getFollowTargetPoint();
}

// --------------------------------------------------
// Wrapped Event Dispatcher methods:
// --------------------------------------------------
/**
 * Registers an event listener object with the dispatcher. 
 * This method wraps the EventDispatcher method of the same name.
 * 
 * @param type The type of event.
 * @param listener The listener function that process the event.
 */
RSCamera.prototype.addEventListener = function(type, listener, context)
{
	this.m_dispatcher.addEventListener(type, listener, context);
}

/**
 * Removes an event listener object with the dispatcher. 
 * This method wraps the Flex EventDispatcher method of the same name.
 * 
 * @param type The type of event.
 * @param listener The listener function that process the event.
 * @param useCapture Determines if the event listener works in the 
 * 					capture phase or the target and bubbling phase.
 */
RSCamera.prototype.removeEventListener = function(type, listener)
{
	this.m_dispatcher.removeEventListener(type, listener);
}

/**
 * Dispatches an event. 
 * This method wraps the EventDispatcher method of the same name.
 * 
 * @param event The event to dispatch.
 */
RSCamera.prototype.dispatchEvent = function(event)
{
	return this.m_dispatcher.dispatchEvent(event);
}

export default RSCamera;