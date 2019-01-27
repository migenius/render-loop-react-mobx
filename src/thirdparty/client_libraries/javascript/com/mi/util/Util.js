/******************************************************************************
* Copyright 1986, 2011 NVIDIA Corporation. All rights reserved.
******************************************************************************/

/**
 * @file Util.js
 * This must be loaded before ServiceHTTP.js. It sets up the 
 * com.mi.util name space and the com.mi.util.scriptFolderPath String which 
 * specify the folder relative to the html folder where to look for 
 * other client library script files.
 */

//alert("com/mi/util/Util.js loaded!!");

/**
 * @namespace com::mi::util The %util namespace
 */
com.mi.util = (com.mi.util != undefined ? com.mi.util : {});

// Define a constructor for the XMLHttpRequest for IE 5 and 6. Code example
// from the wikipedia entry on XMLHttpRequest. Newer browsers will be 
// unaffected.
if (typeof XMLHttpRequest == "undefined") XMLHttpRequest = function () 
{
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) {}
    //Microsoft.XMLHTTP points to Msxml2.XMLHTTP.3.0 and is redundant
    throw new Error("This browser does not support XMLHttpRequest.");
};


