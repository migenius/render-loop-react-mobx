/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file Vector4.js
 * This file defines the com.mi.rs.types.Vector4 class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});

com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});

com.mi.rs.types = (com.mi.rs.types != undefined ? com.mi.rs.types : {});

/**
 * @class Vector4
 * Vector 4 class.
 */

/**
 * @ctor
 * Creates a %Vector4 object.
 * @param vector Object An object with the initial values for the Vector4.
 * Can be either an Array, Object or Vector4.
 */
com.mi.rs.types.Vector4 = function(vector)
{
	if(vector)
		this.setFromObject(vector);
	else
		this.setElements();
}

com.mi.rs.types.Vector4.ZERO = 0.000001;

com.mi.rs.types.Vector4.DEG_2_RAD = 0.017453292519943295769236907684886;

com.mi.rs.types.Vector4.RAD_2_DEG = 1 / com.mi.rs.types.Vector4.DEG_2_RAD;

/**
 * @public Number
 * x component of the vector.
 */
com.mi.rs.types.Vector4.prototype.x;

/**
 * @public Number
 * y component of the vector.
 */
com.mi.rs.types.Vector4.prototype.y;

/**
 * @public Number
 * z component of the vector.
 */
com.mi.rs.types.Vector4.prototype.z;

/**
 * @public Number
 * w component of the vector.
 */
com.mi.rs.types.Vector4.prototype.w;

/**
 * Sets the elements of this vector.
 * @param x the x element. Defaults to 0.
 * @param y the y element. Defaults to 0.
 * @param z the z element. Defaults to 0.
 * @param w the w element. Defaults to 1.
 */ 
com.mi.rs.types.Vector4.prototype.setElements = function(x, y, z, w)
{
	if(!x) x = 0;
	if(!y) y = 0;
	if(!z) z = 0;
	if(!w) w = 1;
	
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
}

/**
 * Set this vector from an array. The array may contain 
 * 3 members in which case w will be set to 1, or 4 members.
 * The members are in the order [x,y,z,w].
 * 
 * @param rhs Array The array to set this from.
 */ 
com.mi.rs.types.Vector4.prototype.setFromArray = function(rhs)
{
	if(rhs.length < 3)
		throw new Error("Failed to set Vector4 from array. Rhs array not big enough.");

	this.x = parseFloat(rhs[0]);
	this.y = parseFloat(rhs[1]);
	this.z = parseFloat(rhs[2]);

	if(rhs.length > 3)
		this.w = parseFloat(rhs[3]);
	else
		this.w = 1;
}

/**
 * Sets this vector by copying the values from the rhs vector.
 * 
 * @param rhs com::mi::rs::types::Vector4 The vector to copy values from.
 */ 
com.mi.rs.types.Vector4.prototype.setFromVector = function(rhs)
{
	this.x = rhs.x;
	this.y = rhs.y;
	this.z = rhs.z;
	this.w = rhs.w;            
}

/**
 * Sets this vector from an object. The object may be of the 
 * following types: Vector4, and Array with 3 or more members
 * or an Object. In the case of an object it must have the 
 * members x, y, z, and optionally w. If w is omitted then
 * w will be set to 1. 
 * 
 * @param rhs Object The Vector4, Array, or Object to set this 
 * Vector4 from.
 */ 
com.mi.rs.types.Vector4.prototype.setFromObject = function(rhs)
{
	if(rhs instanceof com.mi.rs.types.Vector4)
		this.setFromVector(rhs);
	else if(rhs instanceof Array)
		this.setFromArray(rhs);
	else
	{
		this.x = parseFloat(rhs.x);
		this.y = parseFloat(rhs.y);
		this.z = parseFloat(rhs.z);
		if(typeof(rhs.w) !== "undefined")
			this.w = parseFloat(rhs.w);
		else
			this.w = 1;
	}
}

com.mi.rs.types.Vector4.prototype.clone = function()
{
	return new com.mi.rs.types.Vector4(this);
}

/**
 * Transforms this vector by applying the provided matrix.
 * 
 * @param matrix com::mi::rs:types::Matrix4x4 The matrix to apply.
 */ 
com.mi.rs.types.Vector4.prototype.transform = function(matrix)
{
	var vec = this.clone();

	this.x = 	vec.x * matrix.xx +
				vec.y * matrix.yx +
				vec.z * matrix.zx +
				vec.w * matrix.wx;

	this.y = 	vec.x * matrix.xy +
				vec.y * matrix.yy +
				vec.z * matrix.zy +
				vec.w * matrix.wy;

	this.z = 	vec.x * matrix.xz +
				vec.y * matrix.yz +
				vec.z * matrix.zz +
				vec.w * matrix.wz;

	this.w = 	vec.x * matrix.xw +
				vec.y * matrix.yw +
				vec.z * matrix.zw +
				vec.w * matrix.ww;

	if(this.w)
	{
		this.scale(1.0/this.w);
		this.w = 1;
	}
    
    return this;
}

/**
 * Transforms this vector by applying the given matrix and copies 
 * the result into the out vector.
 * 
 * @param matrix com::mi::rs:types::Matrix4x4 The matrix to apply.
 * @param out com::mi::rs:types::Vector4
 * @return Vector4
 */ 
com.mi.rs.types.Vector4.prototype.transformConst = function(matrix, out)
{

	out.x = 	this.x * matrix.xx +
				this.y * matrix.yx +
				this.z * matrix.zx +
				this.w * matrix.wx;

	out.y = 	this.x * matrix.xy +
				this.y * matrix.yy +
				this.z * matrix.zy +
				this.w * matrix.wy;

	out.z = 	this.x * matrix.xz +
				this.y * matrix.yz +
				this.z * matrix.zz +
				this.w * matrix.wz;

	out.w = 	this.x * matrix.xw +
				this.y * matrix.yw +
				this.z * matrix.zw +
				this.w * matrix.ww; 

	if(out.w)
	{
		out.scale(1.0/out.w);
		out.w = 1;
	}
	return out;
}

/**
 * Transforms this vector by the transpose of the matrix passed in.
 *
 * @param matrix com::mi::rs:types::Matrix4x4 The matrix to apply.
 * @return Vector4
 */
com.mi.rs.types.Vector4.prototype.transformTranspose = function(matrix)
{
	var vec = this.clone();

	this.x = 	vec.x * matrix.xx +
				vec.y * matrix.xy +
				vec.z * matrix.xz +
				vec.w * matrix.xw;

	this.y = 	vec.x * matrix.yx +
				vec.y * matrix.yy +
				vec.z * matrix.yz +
				vec.w * matrix.yw;

	this.z = 	vec.x * matrix.zx +
				vec.y * matrix.zy +
				vec.z * matrix.zz +
				vec.w * matrix.zw;

	this.w = 	vec.x * matrix.wx +
				vec.y * matrix.wy +
				vec.z * matrix.wz +
				vec.w * matrix.ww;

	if(this.w)
	{
		this.scale(1.0/this.w);
		this.w = 1;
	}
	return this;
}

/**
 * Transforms this vector by the transpose of the matrix passed in. 
 * This vector remains unchanged.
 *
 * @param matrix com::mi::rs:types::Matrix4x4 The matrix to apply.
 * @param out com::mi::rs:types::Vector4
 * @return Vector4
 */
com.mi.rs.types.Vector4.prototype.transformTransposeConst = function(matrix, out)
{
	out.x = 	this.x * matrix.xx +
				this.y * matrix.xy +
				this.z * matrix.xz +
				this.w * matrix.xw;

	out.y = 	this.x * matrix.yx +
				this.y * matrix.yy +
				this.z * matrix.yz +
				this.w * matrix.yw;

	out.z = 	this.x * matrix.zx +
				this.y * matrix.zy +
				this.z * matrix.zz +
				this.w * matrix.zw;

	out.w = 	this.x * matrix.wx +
				this.y * matrix.wy +
				this.z * matrix.wz +
				this.w * matrix.ww;

	if(out.w)
	{
		out.scale(1.0/out.w);
		out.w = 1;
	}
	return out;
}

com.mi.rs.types.Vector4.prototype.rotate = function(matrix)
{
	var vec = this.clone();

	this.x = 	vec.x * matrix.xx +
				vec.y * matrix.yx +
				vec.z * matrix.zx;

	this.y = 	vec.x * matrix.xy +
				vec.y * matrix.yy +
				vec.z * matrix.zy;

	this.z = 	vec.x * matrix.xz +
				vec.y * matrix.yz +
				vec.z * matrix.zz;

	this.w = 1;
	return this;
}


com.mi.rs.types.Vector4.prototype.rotateTranspose = function (matrix)
{
	var vec = this.clone();

	this.x = 	vec.x * matrix.xx +
				vec.y * matrix.xy +
				vec.z * matrix.xz;

	this.y = 	vec.x * matrix.yx +
				vec.y * matrix.yy +
				vec.z * matrix.yz;

	this.z = 	vec.x * matrix.zx +
				vec.y * matrix.zy +
				vec.z * matrix.zz;

	this.w = 1;
	return this;
}

/** 
 * Returns the dot product between this vector and rhs.
 * @param rhs com::mi::rs:types::Vector4
 * @return Number
 */ 
com.mi.rs.types.Vector4.prototype.dot = function(rhs)
{
	return (this.x*rhs.x + this.y*rhs.y + this.z*rhs.z);
}

/**
 * Returns the cross product between this vector and rhs.
 * @param rhs com::mi::rs:types::Vector4
 * @return Vector4
 */ 
com.mi.rs.types.Vector4.prototype.cross = function(rhs)
{
	var cp = new com.mi.rs.types.Vector4();

	cp.x = this.y*rhs.z - this.z*rhs.y;
	cp.y = this.z*rhs.x - this.x*rhs.z;
	cp.z = this.x*rhs.y - this.y*rhs.x;
	return cp;
}

/**
 * Returns the length of this vector.
 * @return Number
 */ 
com.mi.rs.types.Vector4.prototype.length = function()
{
	var lsq = this.dot(this);
	return Math.sqrt(lsq);
}

/**
 * Returns the distance between the point specified by this 
 * vector and rhs.
 * @param rhs com::mi::rs:types::Vector4
 * @return Number
 */ 
com.mi.rs.types.Vector4.prototype.distance = function(rhs)
{
	var x = rhs.x - this.x;
	var y = rhs.y - this.y;
	var z = rhs.z - this.z;

	return Math.sqrt(x*x + y*y + z*z);
}

/**
 * Normalizes this vector.
 * @return Vector4
 */ 
com.mi.rs.types.Vector4.prototype.normalize = function()
{
	var len = this.length();

	if(len)
	{
		this.x /= len;
		this.y /= len;
		this.z /= len;
	}
	return this;
}

/**
 * Scales this vector.
 * 
 * @param scale Number Scale the scalar to apply.
 * @return Vector4
 */ 
com.mi.rs.types.Vector4.prototype.scale = function(scale)
{
	this.x *= scale;
	this.y *= scale;
	this.z *= scale;
	return this;
}


/**
 * Adds rhs to this vector and stores the result in 
 * this vector.
 * 
 * @param rhs com::mi::rs:types::Vector4 the vector to add.
 * @return Vector4
 */ 
com.mi.rs.types.Vector4.prototype.add = function(rhs)
{
	this.x += rhs.x;
	this.y += rhs.y;
	this.z += rhs.z;
	return this;
}

/**
 * Subtracts rhs from this vector and stores the result in 
 * this vector.
 * 
 * @param rhs com::mi::rs:types::Vector4 the vector to subtract.
 * @return Vector4
 */ 
com.mi.rs.types.Vector4.prototype.subtract = function(rhs)
{
	this.x -= rhs.x;
	this.y -= rhs.y;
	this.z -= rhs.z;
	return this;
}

/**
 * Returns true if this vector and rhs is not colinear.
 * @param rhs com::mi::rs:types::Vector4
 * @return Boolean True if this vector and rhs is not colinear
 */ 
com.mi.rs.types.Vector4.prototype.isNotColinear = function(rhs)
{
	var vec = this.cross(rhs);
	if(Math.abs(vec.x) < com.mi.rs.types.Vector4.ZERO && 
	   Math.abs(vec.y) < com.mi.rs.types.Vector4.ZERO && 
	   Math.abs(vec.z) < com.mi.rs.types.Vector4.ZERO)
	   {
		   return false;
	   }
	   else
	   {
		   return true;
	   }
}

/** 
 * Checks if the vector is the null vector.
 * @param tolerance Number Optional. A Number used to approximate the comparison.
 * @return Boolean
 */
com.mi.rs.types.Vector4.prototype.isNullVector = function(tolerance)
{
	if(typeof(tolerance) == "undefined")
	{
		return this.x == 0 && this.y == 0 && this.z == 0;
	}
	else
	{
		return Math.abs(this.x) < tolerance && Math.abs(this.y) < tolerance && Math.abs(this.z) < tolerance;
	}
}

/**
 * Returns true if this vector equals rhs.
 * 
 * @param rhs com::mi::rs:types::Vector4 The vector to compare with.
 * @param useTolerance Boolean
 * @return Boolean
 */ 
com.mi.rs.types.Vector4.prototype.equal = function(rhs, useTolerance)
{
	if (useTolerance == true)
		return com.mi.rs.types.Vector4.equalWithTolerance(this, rhs);

	if (this.x == rhs.x &&
		this.y == rhs.y &&
		this.z == rhs.z) return true;
	else return false;
}

com.mi.rs.types.Vector4.equalWithTolerance = function(lhs, rhs, tolerance)
{
	if(typeof(tolerance) == "undefined")
		tolerance = com.mi.rs.types.Vector4.ZERO;
		
	if (Math.abs(lhs.x - rhs.x) > tolerance ||
		Math.abs(lhs.y - rhs.y) > tolerance ||
		Math.abs(lhs.z - rhs.z) > tolerance ||
		Math.abs(lhs.w - rhs.w) > tolerance)
		return false;

	return true;
}

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.types.Vector4.prototype.toString = function()
{
	return "[x: " + this.x + ", y: " + this.y + ", z:" + this.z + ", w: " + this.w + "]";
}