/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file Matrix4x4.js
 * This file defines the com.mi.rs.types.Matrix4x4 class.
 */

com = (window.com != undefined ? window.com : {});

com.mi = (com.mi != undefined ? com.mi : {});

com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});

com.mi.rs.types = (com.mi.rs.types != undefined ? com.mi.rs.types : {});

/**
 * @class Matrix4x4
 * Matrix 4x4 class.
 */

/**
 * @ctor
 * Creates a %Matrix4x4 object.
 * @param matrix Object An object with the initial values for the Matrix4x4.
 * Can be either an Array, Object or Matrix4x4.
 */
com.mi.rs.types.Matrix4x4 = function(matrix)
{
	if(matrix)
		this.setFromObject(matrix);
	else
		this.setIdentity();
}

/**
 * @public Number
 * xx component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.xx;

/**
 * @public Number
 * xy component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.xy;

/**
 * @public Number
 * xz component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.xz;

/**
 * @public Number
 * xw component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.xw;

/**
 * @public Number
 * yx component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.yx;

/**
 * @public Number
 * yy component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.yy;

/**
 * @public Number
 * yz component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.yz;

/**
 * @public Number
 * yw component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.yw;

/**
 * @public Number
 * zx component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.zx;

/**
 * @public Number
 * zy component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.zy;

/**
 * @public Number
 * zz component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.zz;

/**
 * @public Number
 * zw component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.zw;

/**
 * @public Number
 * wx component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.wx;

/**
 * @public Number
 * wy component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.wy;

/**
 * @public Number
 * wz component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.wz;

/**
 * @public Number
 * ww component of the matrix.
 */
com.mi.rs.types.Matrix4x4.prototype.ww;

/** 
 * Sets this matrix from an object. The object is either:
 * <ul><li>
 * An array. The array must have 16 elements in the following 
 * order: [xx,xy,xz,xw,yx,yy,yz,yw,zx,zy,zz,zw,wx,wy,wz,ww].
 * </li><li>
 * An Object. The object must have the interface defined by 
 * the RealityServer type Float64&lt;4,4&gt; meaning it must have 16 
 * members of type Number called xx, xy, xz, ..., wy, wz, ww.
 * </li><li>
 * Finally the object can be another Matrix4x4 in which case 
 * this matrix will be set to a copy of that matrix.
 * </li></ul>
 * @param obj Object
 */
com.mi.rs.types.Matrix4x4.prototype.setFromObject = function(obj)
{
	if(obj instanceof com.mi.rs.types.Matrix4x4)
		this.setFromMatrix(obj);
	else if (obj instanceof Array)
		this.setFromArray(obj)
	else
	{
		this.xx = obj.xx;
		this.xy = obj.xy;
		this.xz = obj.xz;
		this.xw = obj.xw;

		this.yx = obj.yx;
		this.yy = obj.yy;
		this.yz = obj.yz;
		this.yw = obj.yw;

		this.zx = obj.zx;
		this.zy = obj.zy;
		this.zz = obj.zz;
		this.zw = obj.zw;

		this.wx = obj.wx;
		this.wy = obj.wy;
		this.wz = obj.wz;
		this.ww = obj.ww;
	}
}

/**
 * Copies all elements from the matrix defined by rhs into 
 * this matrix.
 * @param rhs com::mi::rs::types::Matrix4x4
 */ 
com.mi.rs.types.Matrix4x4.prototype.setFromMatrix = function(rhs)
{
	this.xx = rhs.xx;
	this.xy = rhs.xy;
	this.xz = rhs.xz;
	this.xw = rhs.xw;

	this.yx = rhs.yx;
	this.yy = rhs.yy;
	this.yz = rhs.yz;
	this.yw = rhs.yw;

	this.zx = rhs.zx;
	this.zy = rhs.zy;
	this.zz = rhs.zz;
	this.zw = rhs.zw;

	this.wx = rhs.wx;
	this.wy = rhs.wy;
	this.wz = rhs.wz;
	this.ww = rhs.ww;
}

/**
 * Copies all elements from the array defined by rhs into 
 * this matrix. The array must have the matrix elements 
 * <ul><li>in the following order:
 * [xx,xy,xz,xw,yx,yy,yz,yw,zx,zy,zz,zw,wx,wy,wz,ww]</li>
 * <li>
 * or as a 4 by 4 array in row major form:
 * [[xx,xy,xy,xw],[yx,yy,yz,yw],[zx,zy,zz,zw],[wx,wy,wz,ww]]</li>
 * </ul>
 * @param rhs Array
 */ 
com.mi.rs.types.Matrix4x4.prototype.setFromArray = function(rhs)
{
	if(rhs.length >= 16)
	{    
		this.xx = rhs[0];
		this.xy = rhs[1];
		this.xz = rhs[2];
		this.xw = rhs[3];

		this.yx = rhs[4];
		this.yy = rhs[5];
		this.yz = rhs[6];
		this.yw = rhs[7];

		this.zx = rhs[8];
		this.zy = rhs[9];
		this.zz = rhs[10];
		this.zw = rhs[11];

		this.wx = rhs[12];
		this.wy = rhs[13];
		this.wz = rhs[14];
		this.ww = rhs[15];
	}
	else if (rhs.length == 4)
	{
		this.xx = rhs[0][0];
		this.xy = rhs[0][1];
		this.xz = rhs[0][2];
		this.xw = rhs[0][3];

		this.yx = rhs[1][0];
		this.yy = rhs[1][1];
		this.yz = rhs[1][2];
		this.yw = rhs[1][3];

		this.zx = rhs[2][0];
		this.zy = rhs[2][1];
		this.zz = rhs[2][2];
		this.zw = rhs[2][3];

		this.wx = rhs[3][0];
		this.wy = rhs[3][1];
		this.wz = rhs[3][2];
		this.ww = rhs[3][3];
	}
}

/**
 * Clear this matrix by setting all elements to 0.
 */ 
com.mi.rs.types.Matrix4x4.prototype.clear = function()
{
	this.xx = this.xy = this.xz = this.xw =
	this.yx = this.yy = this.yz = this.yw =
	this.zx = this.zy = this.zz = this.zw =
	this.wx = this.wy = this.wz = this.ww = 0;
}

/**
 * Sets this matrix to the identity matrix.
 */ 
com.mi.rs.types.Matrix4x4.prototype.setIdentity = function()
{
	this.clear();
	this.xx = this.yy = this.zz = this.ww = 1;
}

/** 
 * Sets this matrix to a rotation matrix.
 * 
 * @param axis Number The vector to rotate around.
 * @param angle Number The angle to rotate in radians.
 */ 
com.mi.rs.types.Matrix4x4.prototype.setRotation = function(axis, angle)
{
	this.setIdentity();

	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var t = 1-c;
	var X = axis.x;
	var Y = axis.y;
	var Z = axis.z;

	this.xx = t * X * X + c;
	this.xy = t * X * Y + s * Z;
	this.xz = t * X * Z - s * Y;

	this.yx = t * X * Y - s * Z;
	this.yy = t * Y * Y + c;
	this.yz = t * Y * Z + s * X;

	this.zx = t * X * Z + s * Y;
	this.zy = t * Y * Z - s * X;
	this.zz = t * Z * Z + c;
}

/** 
 * Sets this matrix to a scaling matrix.
 * 
 * @param x Number The amount to scale in the x axis.
 * @param y Number The amount to scale in the y axis.
 * @param z Number The amount to scale in the z axis.
 */ 
com.mi.rs.types.Matrix4x4.prototype.setScaling = function(x, y, z)
{
	this.setIdentity();

	this.xx = x;
	this.yy = y;
	this.zz = z;
}

/**
 * Sets this matrix to the dot product between this matrix and the 
 * matrix specified by rhs.
 * 
 * @param matrix com::mi::rs::types::Matrix4x4 The matrix on the right hand side of the dot product.
 * @return Matrix4x4 Returns this Object. 
 */ 
com.mi.rs.types.Matrix4x4.prototype.multiply = function(matrix)
{
	var _mat = new com.mi.rs.types.Matrix4x4(this);

	this.xx = _mat.xx * matrix.xx
			+ _mat.xy * matrix.yx
			+ _mat.xz * matrix.zx
			+ _mat.xw * matrix.wx;

	this.xy = _mat.xx * matrix.xy
			+ _mat.xy * matrix.yy
			+ _mat.xz * matrix.zy
			+ _mat.xw * matrix.wy;

	this.xz = _mat.xx * matrix.xz
			+ _mat.xy * matrix.yz
			+ _mat.xz * matrix.zz
			+ _mat.xw * matrix.wz;

	this.xw = _mat.xx * matrix.xw
			+ _mat.xy * matrix.yw
			+ _mat.xz * matrix.zw
			+ _mat.xw * matrix.ww;

	this.yx = _mat.yx * matrix.xx
			+ _mat.yy * matrix.yx
			+ _mat.yz * matrix.zx
			+ _mat.yw * matrix.wx;

	this.yy = _mat.yx * matrix.xy
			+ _mat.yy * matrix.yy
			+ _mat.yz * matrix.zy
			+ _mat.yw * matrix.wy;

	this.yz = _mat.yx * matrix.xz
			+ _mat.yy * matrix.yz
			+ _mat.yz * matrix.zz
			+ _mat.yw * matrix.wz;

	this.yw = _mat.yx * matrix.xw
			+ _mat.yy * matrix.yw
			+ _mat.yz * matrix.zw
			+ _mat.yw * matrix.ww;

	this.zx = _mat.zx * matrix.xx
			+ _mat.zy * matrix.yx
			+ _mat.zz * matrix.zx
			+ _mat.zw * matrix.wx;

	this.zy = _mat.zx * matrix.xy
			+ _mat.zy * matrix.yy
			+ _mat.zz * matrix.zy
			+ _mat.zw * matrix.wy;

	this.zz = _mat.zx * matrix.xz
			+ _mat.zy * matrix.yz
			+ _mat.zz * matrix.zz
			+ _mat.zw * matrix.wz;

	this.zw = _mat.zx * matrix.xw
			+ _mat.zy * matrix.yw
			+ _mat.zz * matrix.zw
			+ _mat.zw * matrix.ww;

	this.wx = _mat.wx * matrix.xx
			+ _mat.wy * matrix.yx
			+ _mat.wz * matrix.zx
			+ _mat.ww * matrix.wx;

	this.wy = _mat.wx * matrix.xy
			+ _mat.wy * matrix.yy
			+ _mat.wz * matrix.zy
			+ _mat.ww * matrix.wy;

	this.wz = _mat.wx * matrix.xz
			+ _mat.wy * matrix.yz
			+ _mat.wz * matrix.zz
			+ _mat.ww * matrix.wz;

	this.ww = _mat.wx * matrix.xw
			+ _mat.wy * matrix.yw
			+ _mat.wz * matrix.zw
			+ _mat.ww * matrix.ww;
}

/**
 * Sets this matrix to its transpose.
 */ 
com.mi.rs.types.Matrix4x4.prototype.transpose = function()
{
	var _mat = new com.mi.rs.types.Matrix4x4(this);

	this.xy = _mat.yx;
	this.xz = _mat.zx;
	this.xw = _mat.wx;

	this.yx = _mat.xy;
	this.yz = _mat.zy;
	this.yw = _mat.wy;

	this.zx = _mat.xz;
	this.zy = _mat.yz;
	this.zw = _mat.wz;

	this.wx = _mat.xw;
	this.wy = _mat.yw;
	this.wz = _mat.zw;
}

/**
 * The matrix determinant.
 * 
 * @return Number The determinant.
 */ 
com.mi.rs.types.Matrix4x4.prototype.getDeterminant = function()
{
	var det = 0;

	det =  this.xx * this.determinantRC(0, 0);
	det += this.xy * this.determinantRC(0, 1) * -1;
	det += this.xz * this.determinantRC(0, 2);
	det += this.xw * this.determinantRC(0, 3) * -1;

	return det;
}

/**
 * @private
 */
com.mi.rs.types.Matrix4x4.prototype.determinantRC = function(row, col)
{
	var data = new Array(9);
	var current = 0;

	if(row != 0)
	{
		if(col != 0) data[current++] = this.xx;
		if(col != 1) data[current++] = this.xy;
		if(col != 2) data[current++] = this.xz;
		if(col != 3) data[current++] = this.xw;
	}

	if(row != 1)
	{
		if(col != 0) data[current++] = this.yx;
		if(col != 1) data[current++] = this.yy;
		if(col != 2) data[current++] = this.yz;
		if(col != 3) data[current++] = this.yw;
	}

	if(row != 2)
	{
		if(col != 0) data[current++] = this.zx;
		if(col != 1) data[current++] = this.zy;
		if(col != 2) data[current++] = this.zz;
		if(col != 3) data[current++] = this.zw;
	}

	if(row != 3)
	{
		if(col != 0) data[current++] = this.wx;
		if(col != 1) data[current++] = this.wy;
		if(col != 2) data[current++] = this.wz;
		if(col != 3) data[current++] = this.ww;
	}

	current = data[0]*(data[4]*data[8] - data[7]*data[5]) -
			  data[1]*(data[3]*data[8] - data[6]*data[5]) +
			  data[2]*(data[3]*data[7] - data[6]*data[4]);

	return current;            
}

/**
 * Sets this matrix to its inverse. Fails if the determinant is zero.
 *
 * The returned matrix is the transpose of a standard inverted matrix.
 * This is to always keep the matricies in row major form which is 
 * what the core of RealityServer always expects. 
 * 
 * @return Matrix4x4
 */ 
com.mi.rs.types.Matrix4x4.prototype.invert = function()
{
	var det = this.getDeterminant();
	var mat = new com.mi.rs.types.Matrix4x4(this);

	this.xx = mat.determinantRC(0, 0) / det;
	this.xy = mat.determinantRC(0, 1) / -det;
	this.xz = mat.determinantRC(0, 2) / det;
	this.xw = mat.determinantRC(0, 3) / -det;

	this.yx = mat.determinantRC(1, 0) / -det;
	this.yy = mat.determinantRC(1, 1) / det;
	this.yz = mat.determinantRC(1, 2) / -det;
	this.yw = mat.determinantRC(1, 3) / det;

	this.zx = mat.determinantRC(2, 0) / det;
	this.zy = mat.determinantRC(2, 1) / -det;
	this.zz = mat.determinantRC(2, 2) / det;
	this.zw = mat.determinantRC(2, 3) / -det;

	this.wx = mat.determinantRC(3, 0) / -det;
	this.wy = mat.determinantRC(3, 1) / det;
	this.wz = mat.determinantRC(3, 2) / -det;
	this.ww = mat.determinantRC(3, 3) / det;

	return this;
}

/**
 * Returns a deep copy of this matrix.
 * 
 * @return Matrix4x4 A deep copy of this matrix.
 */ 
com.mi.rs.types.Matrix4x4.prototype.clone = function()
{
	return new com.mi.rs.types.Matrix4x4(this);
}

/**
 * Compares two matrices to see if they are roughly equal. Useful
 * when comparing two matrices to see if they are equal in a more 
 * practical sense than just comparing floating point numbers that 
 * might be different only because of rounding errors etc.
 * @param lhs com::mi::rs::types::Matrix4x4
 * @param rhs com::mi::rs::types::Matrix4x4
 * @param tolerance Number
 * @return Boolean True if lhs and rhs are roughly equal.
 */ 
com.mi.rs.types.Matrix4x4.equalWithTolerance = function(lhs, rhs, tolerance)
{
	if (typeof(tolerance) == "undefined")
		tolerance = 0.00000001;
		
	if (Math.abs(lhs.xx - rhs.xx) > tolerance || 
		Math.abs(lhs.xy - rhs.xy) > tolerance ||
		Math.abs(lhs.xz - rhs.xz) > tolerance ||
		Math.abs(lhs.xw - rhs.xw) > tolerance ||

		Math.abs(lhs.yx - rhs.yx) > tolerance ||
		Math.abs(lhs.yy - rhs.yy) > tolerance ||
		Math.abs(lhs.yz - rhs.yz) > tolerance ||
		Math.abs(lhs.yw - rhs.yw) > tolerance ||

		Math.abs(lhs.zx - rhs.zx) > tolerance ||
		Math.abs(lhs.zy - rhs.zy) > tolerance ||
		Math.abs(lhs.zz - rhs.zz) > tolerance ||
		Math.abs(lhs.zw - rhs.zw) > tolerance ||

		Math.abs(lhs.wx - rhs.wx) > tolerance ||
		Math.abs(lhs.wy - rhs.wy) > tolerance ||
		Math.abs(lhs.wz - rhs.wz) > tolerance ||
		Math.abs(lhs.ww - rhs.ww) > tolerance)
		return false;

	return true;
} 

/**
 * Returns true if this matrix and rhs are equal. If use tolerance 
 * is true then small differences because of for instance rounding 
 * errors are still regarded as equal.
 * @param rhs com::mi::rs::types::Matrix4x4
 * @param useTolerance Boolean
 */ 
com.mi.rs.types.Matrix4x4.prototype.equal = function(rhs, useTolerance)
{
	if(useTolerance === true)
		return(com.mi.rs.types.Matrix4x4.equalWithTolerance(this, rhs));

	if (rhs.xx == this.xx && rhs.xy == this.xy && rhs.xz == this.xz && rhs.xw == this.xw &&
		rhs.yx == this.yx && rhs.yy == this.yy && rhs.yz == this.yz && rhs.yw == this.yw &&
		rhs.zx == this.zx && rhs.zy == this.zy && rhs.zz == this.zz && rhs.zw == this.zw &&
		rhs.wx == this.wx && rhs.wy == this.wy && rhs.wz == this.wz && rhs.ww == this.ww)
		return true;

	return false;
}

/**
 * Sets the translation elements of this matrix while leaving the 
 * rest of the matrix untouched. 
 * @param x Number
 * @param y Number
 * @param z Number
 */ 
com.mi.rs.types.Matrix4x4.prototype.setTranslationElements = function(x, y, z)
{
	this.wx = x;
	this.wy = y;
	this.wz = z;
}

/**
 * Increases the translation elements of this matrix while leaving the 
 * rest of the matrix untouched. 
 * @param dx Number
 * @param dy Number
 * @param dz Number
 */ 
com.mi.rs.types.Matrix4x4.prototype.translate = function(dx, dy, dz)
{
	this.wx += dx;
	this.wy += dy;
	this.wz += dz;
}

/**
 * Returns a string describing this Object.
 * @return String A String describing this Object.
 */
com.mi.rs.types.Matrix4x4.prototype.toString = function()
{
	return "[" + this.xx + ", " + this.xy + ", " + this.xz + ", " + this.xw + ", " +
				 this.yx + ", " + this.yy + ", " + this.yz + ", " + this.yw + ", " +
				 this.zx + ", " + this.zy + ", " + this.zz + ", " + this.zw + ", " +
				 this.wx + ", " + this.wy + ", " + this.wz + ", " + this.ww + "]";
}