/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
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
export default class RSCamera {
	m_transform;
	m_orthographic;
	m_aperture;
	m_focal;
	m_clip_max;
	m_clip_min;
	
	m_scene_up_direction;
	
	m_dispatcher;


	static Y_UP = 0;

	static Z_UP = 1;

	constructor()
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

	/**
	 * Clones a RSCamera. This performs a deep copy on this RSCamera.
	 * 
	 * @return The cloned RSCamera.
	 */
	clone()
	{
		var newCamera = new RSCamera();
		this.populateClone(newCamera);
		return newCamera;
	}

	/**
	 * Used to put values onto a newly created clone. Can be extended
	 * by subclasses to include more values.
	 */
	populateClone(camera)
	{
		camera.m_orthographic = this.m_orthographic;
		camera.m_aperture = this.m_aperture;
		camera.m_focal = this.m_focal;
		camera.m_clip_max = this.m_clip_max;
		camera.m_clip_min = this.m_clip_min;
		camera.m_transform = this.m_transform.clone();
		camera.m_scene_up_direction = this.m_scene_up_direction;
	}

	attributeChange(property, newValue, oldValue)
	{
		var eventName = property + "_change";
		this.dispatchEvent(new PropertyChangeEvent(eventName, this, newValue, oldValue, property));
	}

	/**
	 * Sets the matrix of the transform from anything that Matrix4x4.setFromObject supports.
	 */ 
	set matrix(value)
	{
		if(null != value)
		{
			this.m_transform.worldToObj = value;
			this.attributeChange("transform", this.m_transform.worldToObj, null);
		}
	}

	get matrix()
	{
		return this.m_transform.worldToObj;
	}

	/**
	 * Sets the camera data from either an object with appropriate properties
	 * or from another RSCamera instance.
	 */
	setFromObject(camera)
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
					this.orthographic = camera.orthographic;
					
				if(typeof(camera.focal) != "undefined")
					this.focal = camera.focal;
					
				if(typeof(camera.aperture) != "undefined")
					this.aperture = camera.aperture;
					
				if(typeof(camera.clip_max) != "undefined")
					this.clipMax = camera.clip_max;
					
				if(typeof(camera.clip_min) != "undefined")
					this.clipMin = camera.clip_min;
			}
		}
	}

	/**
	 * Sets this camera from another.
	 * 
	 * @param camera The camera to set from.
	 */
	setFromCamera(camera)
	{
		this.transform = camera.transform.clone();                 
		this.aperture = camera.aperture;
		this.focal = camera.focal;
		this.orthographic =camera.orthographic;
		this.clipMax = camera.clipMax;
		this.clipMin = camera.clipMin;
		this.sceneUpDirection = camera.sceneUpDirection;
	}

	/**
	 * Pans the camera.
	 * 
	 * @param horizontal The amount to pan in the right direction.
	 * @param vertical The amount to pan in the up direction.
	 * @param shiftTargetPoint Move the target point with the camera.
	 */               
	pan(horizontal, vertical, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.translate(horizontal, vertical, 0, true, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Dollies the camera.
	 * 
	 * @param depth The amount to move along the direction vector.
	 * @param shiftTargetPoint Move the target point along direction*i_z.  
	 */
	dolly(depth, shiftTargetPoint)
	{
		if (shiftTargetPoint != true)
			shiftTargetPoint = false;
			
		if(this.orthographic)
		{
			if(this.m_aperture + depth > 0)
			{
				this.aperture = this.aperture + depth;
			}
		}
		else
		{
			this.m_transform.translate(0, 0, depth, true, shiftTargetPoint);
			this.attributeChange("transform", this.m_transform.worldToObj, null);
		}
	}

	/**
	 * Elevates the camera.
	 * 
	 * @param vertical The amount to move along the up vector.
	 */ 
	elevate(vertical)
	{
		this.m_transform.translate(0, vertical, 0, true);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Orbits the camera. This method orbits using the initial up and right reference vectors.
	 * 
	 * @param verticalAxis The amount to rotate around the up vector in radians.
	 * @param horizontalAxis The amount to rorate aroung the right vector in radians.
	 * @param orbitPoint The point to orbit around, if set this will change the orbit point.
	 */
	orbit(verticalAxis, horizontalAxis, orbitPoint)
	{
		if (orbitPoint != null) 
		{
			this.setTargetPoint(orbitPoint, false);
		}
		this.m_transform.orbitAroundTargetPoint(horizontalAxis, verticalAxis, 0);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
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
	orbitAroundPoint(point, verticalAxis, horizontalAxis, shiftTargetPoint)
	{
		if (shiftTargetPoint != true)
			shiftTargetPoint = false;
			
		this.m_transform.rotateAroundPoint(point, horizontalAxis, verticalAxis, 0, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Rotates the camera
	 * 
	 * @param verticalAxis Amount to rotate around the up vector in radians.
	 * @param horizontalAxis Amount to rotate around the right vector in radians.
	 * @param directionAxis Amount to rotate around the direction vector in radians.
	 */
	rotate(verticalAxis, horizontalAxis, directionAxis, shiftTargetPoint)
	{
		if (isNaN(directionAxis))
			directionAxis = 0;
			
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotate(horizontalAxis, verticalAxis, directionAxis, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Tilts the camera by rotating around the right vector of the camera.
	 * 
	 * @param horizontalAxis The amount, in radians, to tilt.
	 */
	tilt(horizontalAxis, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotate(horizontalAxis, 0, 0, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Spins the camera by rotating around the up vector of the camera.
	 * 
	 * @param verticalAxis The amount, in radians, to spin.
	 */ 
	spin(verticalAxis, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotate(0, verticalAxis, 0, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Rotates the camera.
	 * 
	 * @param axis The axis to rotate about.
	 * @param angle The amount, in radians, to rotate.
	 */
	rotateAroundAxis(axis, angle, inCameraSpace, shiftTargetPoint)
	{
		if (inCameraSpace != true)
			inCameraSpace = false;
			
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotateAroundAxis(axis, angle, inCameraSpace, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Moves the camera to a given location.
	 * 
	 * @param location The position to move to.
	 * @param shiftTargetPoint Set this parameter to true to shift the target point of the camera along the vector new_position -> old_position.
	 */
	moveTo(location, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.setTranslation(location.x, location.y, location.z, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Moves the camera.
	 * 
	 * @param move The vector to move along.
	 * @param shiftTargetPoint Set this parameter to true to shift the target point of the camera along v.
	 */
	translate(move, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.translate(move.x, move.y, move.z, false, shiftTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * Transforms a point into camera space.
	 * 
	 * @param point The point to tranform.
	 * @param result The result of the transform.
	 * @return Always true.
	 */
	transformPoint(point, result)
	{
		var world2Cam = this.transform.worldToObj;
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
	transformDirection(direction, result)
	{
		var world2Cam = this.transform.worldToObj;
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
	transformDirectionToWorld(direction, result)
	{
		var cam2World = this.transform.worldToObj.clone();
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
	equal(rhs)
	{
		if(rhs == this)
			return true;
			
		var result = false;

		if (this.aperture == rhs.aperture &&
			this.focal == rhs.focal &&
			this.fieldOfView == rhs.fieldOfView)
			{
				var matrix1 = this.transform.worldToObj;
				var matrix2 = rhs.transform.worldToObj; 

				if( Matrix4x4.equalWithTolerance(matrix1,matrix2) == true)
					result = true;
			}
		return result;
	}

	/**
	 * DEPRECATED: Use camera1.equal(camera2) instead.
	 */
	static compare(camera1, camera2)
	{
		return camera1.equal(camera2);
	}

	/**
	 * Aligns the camera to the horizontal plane
	 */ 
	levelCamera()
	{
		// Negative angle to the horizon based on the up vector.
		var angle = Math.asin(this.direction.dot(this.m_transform.getDefaultUpDirection()));
		this.m_transform.rotate(-angle, 0, 0);
		attributeChange("transform", this.m_transform.worldToObj, null);
	}

	get orthographic()
	{
		return this.m_orthographic;
	}
	/**
	 * Sets the orthographic mode of the camera.
	 * 
	 * @param ortho Set to true to enable orthographic mode.
	 */  
	set orthographic(ortho)
	{
		if(ortho != this.m_orthographic)
		{
			this.m_orthographic = ortho;
			this.attributeChange("orthographic", ortho, !ortho);
		}
	}

	/**
	 * Retrieves the half field of view of the camera.
	 * 
	 * @return The half field of view.
	 */
	get fieldOfView()
	{
		if(this.m_orthographic)
		{
			return -1;
		}
		return Math.atan2(this.aperture / 2, this.focal);
	}

	/**
	 * Sets the field of view of the camera.
	 * 
	 * @param halfFov The desired field of view divided by two in radians.
	 */
	set fieldOfView(halfFov)
	{
		if(false == this.m_orthographic)
		{
			this.aperture = (this.m_focal * Math.tan(halfFov))*2;
		}
	}

	/**
	 * The aperture of the camera.
	 */   
	get aperture()
	{
		return this.m_aperture;
	}

	set aperture(aperture)
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
	get focal()
	{
		return this.m_focal;
	}

	set focal(focal)
	{
		var oldValue = this.m_focal;
		this.m_focal = focal;
		this.attributeChange("focal", focal, oldValue);
	}

	/**
	 * The transform of the camera.
	 */
	get transform()
	{
		return this.m_transform;
	}

	set transform(transform)
	{
		if(transform != this.m_transform)
		{
			this.m_transform = transform;
			this.attributeChange("transform", this.m_transform.worldToObj, null);
		}
	}

	/**
	* The clip max of the view frustum
	*/
	get clipMax()
	{
		return this.m_clip_max;
	}

	set clipMax(clipMax)
	{
		var oldValue = this.m_clip_max;
		this.m_clip_max = clipMax;
		this.attributeChange("clip_max", clipMax, oldValue);
	}

	/**
	 * The clip min of the view frustum
	 */
	get clipMin()
	{
		return this.m_clip_min;
	}

	set clipMin(clipMin)
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
	setTargetPoint(targetPoint, resetUpVector)
	{
		if (resetUpVector != false)
			resetUpVector = true;
			
		this.m_transform.setTargetPoint(targetPoint, resetUpVector);
		if(this.m_transform.getFollowTargetPoint())
			this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	getTargetPoint()
	{
		return this.m_transform.getTargetPoint();
	}

	/**
	 * The look direction vector of the camera.
	 */
	get direction()
	{
		return this.m_transform.ZAxis;
	}

	/**
	 * The up vector of the camera.
	 */
	get up()
	{
		return this.m_transform.YAxis;
	}

	/**
	 * The right vector of the camera.
	 */
	get right()
	{
		return this.m_transform.XAxis;
	}

	setLocation(loc, moveTargetPoint)
	{
		if (moveTargetPoint != true)
			moveTargetPoint = false;
			
		this.m_transform.setTranslation(loc.x, loc.y, loc.z, moveTargetPoint);
		this.attributeChange("transform", this.m_transform.worldToObj, null);
	}

	/**
	 * The position of the camera in world space.
	 */
	get location()
	{
		return this.m_transform.translation;
	}

	/**
	 * The up direction of the scene the camera is in.
	 * Can be either Y_UP or Z_UP.
	 */
	set sceneUpDirection(upDir)
	{
		if(this.m_scene_up_direction != upDir)
		{
			this.m_scene_up_direction = upDir;
			if(upDir == RSCamera.Y_UP)
				this.m_transform.setUpDirection(TransformBase.Y_AXIS);
			else
				this.m_transform.setUpDirection(TransformBase.NEG_Z_AXIS);

			this.attributeChange("transform", this.m_transform.worldToObj, null);
		}
	}

	get sceneUpDirection()
	{
		return this.m_scene_up_direction;
	}

	set followTargetPoint(follow)
	{
		var oldValue = this.transform.getFollowTargetPoint();
		if(oldValue != follow)
		{
			this.transform.setFollowTargetPoint(follow);
			this.attributeChange("follow_target_point", follow, oldValue);
			if(follow)
			{
				this.attributeChange("transform", this.m_transform.worldToObj, null);
			}
		}
	}
	get followTargetPoint()
	{
		return this.transform.getFollowTargetPoint();
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
	addEventListener(type, listener, context)
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
	removeEventListener(type, listener)
	{
		this.m_dispatcher.removeEventListener(type, listener);
	}

	/**
	 * Dispatches an event. 
	 * This method wraps the EventDispatcher method of the same name.
	 * 
	 * @param event The event to dispatch.
	 */
	dispatchEvent(event)
	{
		return this.m_dispatcher.dispatchEvent(event);
	}

}