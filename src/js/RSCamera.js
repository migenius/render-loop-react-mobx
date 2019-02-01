/******************************************************************************
 * Copyright 2010-2019 migenius pty ltd, Australia. All rights reserved. 
 *****************************************************************************/
import TransformTarget from "./TransformTarget";
import TransformBase from "./TransformBase";
import {Matrix4x4} from "realityserver";
import {observable,computed,action} from "mobx";

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
	@observable
	m_transform;
	@observable
	m_orthographic;
	@observable
	m_aperture;
	@observable
	m_focal;
	@observable
	m_clip_max;
	@observable
	m_clip_min;
	
	@observable
	m_scene_up_direction;
	
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

	/**
	 * Sets the matrix of the transform from anything that Matrix4x4.setFromObject supports.
	 */ 
	set matrix(value)
	{
		if(null != value)
		{
			this.m_transform.worldToObj = value;
		}
	}

	@computed
	get matrix()
	{
		return this.m_transform.worldToObj;
	}

	/**
	 * Sets the camera data from either an object with appropriate properties
	 * or from another RSCamera instance.
	 */
	@action
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
	@action
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
	@action     
	pan(horizontal, vertical, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.translate(horizontal, vertical, 0, true, shiftTargetPoint);
	}

	/**
	 * Dollies the camera.
	 * 
	 * @param depth The amount to move along the direction vector.
	 * @param shiftTargetPoint Move the target point along direction*i_z.  
	 */
	@action
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
		}
	}

	/**
	 * Elevates the camera.
	 * 
	 * @param vertical The amount to move along the up vector.
	 */ 
	@action
	elevate(vertical)
	{
		this.m_transform.translate(0, vertical, 0, true);
	}

	/**
	 * Orbits the camera. This method orbits using the initial up and right reference vectors.
	 * 
	 * @param verticalAxis The amount to rotate around the up vector in radians.
	 * @param horizontalAxis The amount to rorate aroung the right vector in radians.
	 * @param orbitPoint The point to orbit around, if set this will change the orbit point.
	 */
	@action
	orbit(verticalAxis, horizontalAxis, orbitPoint)
	{
		if (orbitPoint != null) 
		{
			this.setTargetPoint(orbitPoint, false);
		}
		this.m_transform.orbitAroundTargetPoint(horizontalAxis, verticalAxis, 0);
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
	@action
	orbitAroundPoint(point, verticalAxis, horizontalAxis, shiftTargetPoint)
	{
		if (shiftTargetPoint != true)
			shiftTargetPoint = false;
			
		this.m_transform.rotateAroundPoint(point, horizontalAxis, verticalAxis, 0, shiftTargetPoint);
	}

	/**
	 * Rotates the camera
	 * 
	 * @param verticalAxis Amount to rotate around the up vector in radians.
	 * @param horizontalAxis Amount to rotate around the right vector in radians.
	 * @param directionAxis Amount to rotate around the direction vector in radians.
	 */
	@action
	rotate(verticalAxis, horizontalAxis, directionAxis, shiftTargetPoint)
	{
		if (isNaN(directionAxis))
			directionAxis = 0;
			
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotate(horizontalAxis, verticalAxis, directionAxis, shiftTargetPoint);
	}

	/**
	 * Tilts the camera by rotating around the right vector of the camera.
	 * 
	 * @param horizontalAxis The amount, in radians, to tilt.
	 */
	@action
	tilt(horizontalAxis, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotate(horizontalAxis, 0, 0, shiftTargetPoint);
	}

	/**
	 * Spins the camera by rotating around the up vector of the camera.
	 * 
	 * @param verticalAxis The amount, in radians, to spin.
	 */ 
	@action
	spin(verticalAxis, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotate(0, verticalAxis, 0, shiftTargetPoint);
	}

	/**
	 * Rotates the camera.
	 * 
	 * @param axis The axis to rotate about.
	 * @param angle The amount, in radians, to rotate.
	 */
	@action
	rotateAroundAxis(axis, angle, inCameraSpace, shiftTargetPoint)
	{
		if (inCameraSpace != true)
			inCameraSpace = false;
			
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.rotateAroundAxis(axis, angle, inCameraSpace, shiftTargetPoint);
	}

	/**
	 * Moves the camera to a given location.
	 * 
	 * @param location The position to move to.
	 * @param shiftTargetPoint Set this parameter to true to shift the target point of the camera along the vector new_position -> old_position.
	 */
	@action
	moveTo(location, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.setTranslation(location.x, location.y, location.z, shiftTargetPoint);
	}

	/**
	 * Moves the camera.
	 * 
	 * @param move The vector to move along.
	 * @param shiftTargetPoint Set this parameter to true to shift the target point of the camera along v.
	 */
	@action
	translate(move, shiftTargetPoint)
	{
		if (shiftTargetPoint != false)
			shiftTargetPoint = true;
			
		this.m_transform.translate(move.x, move.y, move.z, false, shiftTargetPoint);
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
		result.set(point)
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
		result.set(myDir.rotate(world2Cam));
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
		result.set(myDir.rotate(cam2World));
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

				if( matrix1.equal_with_tolerance(matrix2) == true)
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
	@action
	levelCamera()
	{
		// Negative angle to the horizon based on the up vector.
		var angle = Math.asin(this.direction.dot(this.m_transform.getDefaultUpDirection()));
		this.m_transform.rotate(-angle, 0, 0);
	}

	@computed
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
		}
	}

	/**
	 * Retrieves the half field of view of the camera.
	 * 
	 * @return The half field of view.
	 */
	@computed
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
	@computed
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
		}
	}

	/**
	 * The focal length of the camera.
	 */
	@computed
	get focal()
	{
		return this.m_focal;
	}

	set focal(focal)
	{
		var oldValue = this.m_focal;
		this.m_focal = focal;
	}

	/**
	 * The transform of the camera.
	 */
	@computed
	get transform()
	{
		return this.m_transform;
	}

	set transform(transform)
	{
		if(transform != this.m_transform)
		{
			this.m_transform = transform;
		}
	}

	/**
	* The clip max of the view frustum
	*/
	@computed
	get clipMax()
	{
		return this.m_clip_max;
	}

	set clipMax(clipMax)
	{
		var oldValue = this.m_clip_max;
		this.m_clip_max = clipMax;
	}

	/**
	 * The clip min of the view frustum
	 */
	@computed
	get clipMin()
	{
		return this.m_clip_min;
	}

	set clipMin(clipMin)
	{
		var oldValue = this.m_clip_min;
		this.m_clip_min = clipMin;
	}

	/**
	 * Sets the target point of the camera.
	 * 
	 * @param orbitPoint The new target point.
	 */
	@action
	setTargetPoint(targetPoint, resetUpVector)
	{
		if (resetUpVector != false)
			resetUpVector = true;
			
		this.m_transform.setTargetPoint(targetPoint, resetUpVector);
	}

	@computed
	get targetPoint()
	{
		return this.m_transform.targetPoint;
	}

	/**
	 * The look direction vector of the camera.
	 */
	@computed
	get direction()
	{
		return this.m_transform.ZAxis;
	}

	/**
	 * The up vector of the camera.
	 */
	@computed
	get up()
	{
		return this.m_transform.YAxis;
	}

	/**
	 * The right vector of the camera.
	 */
	@computed
	get right()
	{
		return this.m_transform.XAxis;
	}

	@action
	setLocation(loc, moveTargetPoint)
	{
		if (moveTargetPoint != true)
			moveTargetPoint = false;
			
		this.m_transform.setTranslation(loc.x, loc.y, loc.z, moveTargetPoint);
	}

	/**
	 * The position of the camera in world space.
	 */
	@computed
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

		}
	}

	@computed
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
		}
	}

	@computed
	get followTargetPoint()
	{
		return this.transform.getFollowTargetPoint();
	}
}