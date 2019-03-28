// TODO
// - Figure out rotations of faces
// - Figure out how to keep track of colors of faces to know when solved


"use strict";

var canvas;
var gl;

var projectionMatrix,projectionMatrixLoc;
var modelMatrix, modelMatrixLoc;

var NumVertices  = 36;

var points = [];
var colors = [];

var thetaLoc;
var theta = 2;
var phi = -1;

var dragging = false;

var oldX, oldY;
var dX, dY;

// Trackball vars
var trackingMouse = false;
var  trackballMove = false;

var lastPos = [0, 0, 0];
var curx, cury;
var startX, startY;

var  axis = [0, 0, 1];
var  angle = 0.0;

var dragSensitivity = -50;

var cBuffer, vColor, vBuffer, vPosition;

var cachedMoves = [];

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;
var THETA = 0;
var PHI = 0;

var isMoving = false;


var mouseDown = function( e ) {
    dragging = true;
    oldX = e.pageX;
    oldY = e.pageY;
    e.preventDefault();
    return false;
};

var mouseUp = function( e ) {
    dragging = false;
};

var mouseMove = function( e ) {
    if ( !dragging ) {
        return false;
    }
    dX = ( e.pageX - oldX ) * 2 * Math.PI / canvas.width;
    dY = ( e.pageY - oldY ) * 2 * Math.PI / canvas.height;
    theta -= dX;
    phi -= dY;
    oldX = e.pageX;
    oldY = e.pageY;
    e.preventDefault();
};


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    cBuffer = gl.createBuffer();
    //gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    //gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    //gl.enableVertexAttribArray( vColor );

    vBuffer = gl.createBuffer();
    //gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    vPosition = gl.getAttribLocation( program, "vPosition" );
    //gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    //gl.enableVertexAttribArray( vPosition );

    projectionMatrix = mat4();
    projectionMatrixLoc = gl.getUniformLocation(program, "projection");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    modelMatrix = mat4();
    modelMatrixLoc = gl.getUniformLocation(program, "model");
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    thetaLoc = gl.getUniformLocation(program, "theta");

    colorCube();

    //event listeners for buttons

    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("mouseout", mouseUp, false);
    canvas.addEventListener("mousemove", mouseMove, false);

    document.getElementById( "xButton" ).onclick = function () {
        if(!isMoving){
            cachedMoves.push("FC");
        }
        //if(!isMoving){curFrameCount=0;}
        //curFrameCount=0;
    };
    document.getElementById( "yButton" ).onclick = function () {
        cachedMoves.push("MC");
    };

    /*canvas.addEventListener( 'mousedown', moveMouseStart, false );
    canvas.addEventListener( 'mouseup', moveMouseStop, false );
    canvas.addEventListener( 'mouseout', moveMouseStop, false );
    canvas.addEventListener( 'mousemove', moveMouseMove, false );*/
    

    render();
}

var cubeNames = ["FTL","FTC","FTR","FML","FMC","FMR","FBL","FBC","FBR","MTL","MTC",
"MTR","MML","MMC","MMR","MBL","MBC","MBR","BTL","BTC","BTR","BML","BMC","BMR","BBL",
"BBC","BBR"]

function colorCube()
{   
    // [back,right,bottom,top,front,left]
    generateSmallCube([0,0,0,1,7,4]); // front-top-left
    generateSmallCube([0,0,0,1,7,0]); // front-top-center
    generateSmallCube([0,3,0,1,7,0]); // front-top-right
    generateSmallCube([0,0,0,0,7,4]); // front-middle-left
    generateSmallCube([0,0,0,0,7,0]); // front-middle-center
    generateSmallCube([0,3,0,0,7,0]); // front-middle-right
    generateSmallCube([0,0,5,0,7,4]); // front-bottom-left
    generateSmallCube([0,0,5,0,7,0]); // front-bottom-center
    generateSmallCube([0,3,5,0,7,0]); // front-bottom-right

    generateSmallCube([0,0,0,1,0,4]); // middle-top-left
    generateSmallCube([0,0,0,1,0,0]); // middle-top-center
    generateSmallCube([0,3,0,1,0,0]); // middle-top-right
    generateSmallCube([0,0,0,0,0,4]); // middle-middle-left
    generateSmallCube([0,0,0,0,0,0]); // middle-middle-center XXXXXX
    generateSmallCube([0,3,0,0,0,0]); // middle-middle-right
    generateSmallCube([0,0,5,0,0,4]); // middle-bottom-left
    generateSmallCube([0,0,5,0,0,0]); // middle-bottom-center
    generateSmallCube([0,3,5,0,0,0]); // middle-bottom-right

    generateSmallCube([2,0,0,1,0,4]); // back-top-left
    generateSmallCube([2,0,0,1,0,0]); // back-top-center
    generateSmallCube([2,3,0,1,0,0]); // back-top-right
    generateSmallCube([2,0,0,0,0,4]); // back-middle-left
    generateSmallCube([2,0,0,0,0,0]); // back-middle-center 
    generateSmallCube([2,3,0,0,0,0]); // back-middle-right
    generateSmallCube([2,0,5,0,0,4]); // back-bottom-left
    generateSmallCube([2,0,5,0,0,0]); // back-bottom-center
    generateSmallCube([2,3,5,0,0,0]); // back-bottom-right
    
}

var rubiksCubePoints = []; // holds all points of smaller cubes -- 
var rubiksCubeColors = [];

function generateSmallCube(colorVect){
    // 0 - black || 1 - red || 2 - yellow || 3 - green || 4 - blue || 5 - magenta || 6 - cyan || 7 - grey

    quad( 1, 0, 3, 2, colorVect[0] ); // Black face
    quad( 2, 3, 7, 6, colorVect[1] ); // Red face
    quad( 3, 0, 4, 7, colorVect[2] ); // Yellow face
    quad( 6, 5, 1, 2, colorVect[3] ); // Green face
    quad( 4, 5, 6, 7, colorVect[4] ); // Blue
    quad( 5, 4, 0, 1, colorVect[5] ); // Magenta
    rubiksCubePoints.push(points);
    points = [];
    rubiksCubeColors.push(colors);
    colors = [];
    //console.log(rubiksCubePoints);
}

var size = 0.1;
function quad(a, b, c, d, color)
{
    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var vertices = [
        vec4( -size, -size,  size, 1.0 ),
        vec4( -size,  size,  size, 1.0 ),
        vec4(  size,  size,  size, 1.0 ),
        vec4( size, -size,  size, 1.0 ),
        vec4( -size, -size, -size, 1.0 ),
        vec4( -size, size, -size, 1.0 ),
        vec4(  size,  size, -size, 1.0 ),
        vec4(  size, -size, -size, 1.0 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 0.5, 0.5, 0.5, 1.0 ]   // grey
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];
    var tempArr = [];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        tempArr.push(vertices[indices[i]]);

        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[color]);

    }
    //console.log(points);
}

var rotationMatrixTrans;
var modelMatrixNew;

var dist = (size + .1) + .01;
var translations = [
    // +/-
    // move right/left, up/down , move back/front
    
    translate(-dist, dist, -dist),
    translate(0, dist, -dist),
    translate(dist,dist,-dist),
    translate(-dist,0,-dist),
    translate(0 ,0, -dist),
    translate(dist,0,-dist),
    translate(-dist,-dist,-dist),
    translate(0,-dist,-dist),
    translate(dist,-dist,-dist),

    translate(-dist,dist,0),
    translate(0,dist,0),
    translate(dist,dist,0),
    translate(-dist,0,0),
    translate(0,0,0),
    translate(dist,0,0),
    translate(-dist,-dist,0),
    translate(0,-dist,0),
    translate(dist,-dist,0),

    translate(-dist,dist,dist),
    translate(0,dist,dist),
    translate(dist,dist,dist),
    translate(-dist,0,dist),
    translate(0,0,dist),
    translate(dist,0,dist),
    translate(-dist,-dist,dist),
    translate(0,-dist,dist),
    translate(dist,-dist,dist)
]

var numFrames = 90;
var curFrameCount = 0;
function checkCache(model,i){
    
    var modelNew = model;
    if(cachedMoves[0]){
        switch(cachedMoves[0]){
            case "FC":
                if(i==cubeNames.indexOf("FTL") || i==cubeNames.indexOf("FTC") || i==cubeNames.indexOf("FTR") ||
                    i==cubeNames.indexOf("FML") || i==cubeNames.indexOf("FMC") || i==cubeNames.indexOf("FMR") ||
                    i==cubeNames.indexOf("FBL") || i==cubeNames.indexOf("FBC") || i==cubeNames.indexOf("FBR")){
                    
                    modelNew = mult(rotateZ(90/numFrames),modelNew);
                }
                else{
                    modelNew = model;
                }
                break;
            case "MC":
                if(i==cubeNames.indexOf("MTL") || i==cubeNames.indexOf("MTC") || i==cubeNames.indexOf("MTR") ||
                    i==cubeNames.indexOf("MML") || i==cubeNames.indexOf("MMC") || i==cubeNames.indexOf("MMR") ||
                    i==cubeNames.indexOf("MBL") || i==cubeNames.indexOf("MBC") || i==cubeNames.indexOf("MBR")){
                    modelNew = mult(model,translate(.1,0,0));
                }
                else{
                    modelNew = model;
                }
                break;
            default:
                modelNew = model
        }
    }
    else{
        modelNew = model;
    }
    

    return modelNew;
}

var trans = translations;

function moveCube(){
    var sensitivity = -50;

    modelMatrix = mat4();
    var c = Math.cos( radians( dragSensitivity * phi ) );
    var s = Math.sin( radians( dragSensitivity * phi ) );
    var mv1 = modelMatrix[0][1], mv5 = modelMatrix[1][1], mv9 = modelMatrix[2][1];
    modelMatrix[0][1] = modelMatrix[0][1] * c - modelMatrix[0][2] * s;
    modelMatrix[1][1] = modelMatrix[1][1] * c - modelMatrix[1][2] * s;
    modelMatrix[2][1] = modelMatrix[2][1] * c - modelMatrix[2][2] * s;
    modelMatrix[0][2] = modelMatrix[0][2] * c + mv1 * s;
    modelMatrix[1][2] = modelMatrix[1][2] * c + mv5 * s;
    modelMatrix[2][2] = modelMatrix[2][2] * c + mv9 * s;
    c = Math.cos( radians( dragSensitivity * theta ) );
    s = Math.sin( radians( dragSensitivity * theta ) );
    var mv0 = modelMatrix[0][0], mv4 = modelMatrix[1][0], mv8 = modelMatrix[2][0];
    modelMatrix[0][0] = modelMatrix[0][0] * c + modelMatrix[0][2] * s;
    modelMatrix[1][0] = modelMatrix[1][0] * c + modelMatrix[1][2] * s;
    modelMatrix[2][0] = modelMatrix[2][0] * c + modelMatrix[2][2] * s;
    modelMatrix[0][2] = modelMatrix[0][2] * c - mv0 * s;
    modelMatrix[1][2] = modelMatrix[1][2] * c - mv4 * s;
    modelMatrix[2][2] = modelMatrix[2][2] * c - mv8 * s;

}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //gl.uniform3fv(thetaLoc, theta);


    /*if(trackballMove) {
        axis = normalize(axis);
        projectionMatrix = mult(projectionMatrix, rotate(angle, axis));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    }*/
    
    moveCube();

    //modelMatrixNew = mult(modelMatrix, translate(0.1, 0.1, 0.1));
    //gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrixNew));

    //rotationMatrix = mult(rotationMatrix, rotate(angle,axis));
    //var translationMatrixTrans = mult(translationMatrix,translate(.65, .65, .65));
    //gl.uniformMatrix4fv(translationMatrixLoc,false,flatten(translationMatrixTrans));
    //console.log(translationMatrixTrans);


    for(var i=0;i<rubiksCubePoints.length;i++){
        trans[i] = checkCache(trans[i],i);
        modelMatrixNew = mult(modelMatrix, trans[i]);
        modelMatrixNew = checkCache(modelMatrixNew);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrixNew));

        

        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(rubiksCubeColors[i]), gl.STATIC_DRAW );

        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(rubiksCubePoints[i]), gl.STATIC_DRAW );

        gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        gl.drawArrays( gl.TRIANGLES, 0, NumVertices);
    }

    if(curFrameCount<numFrames-1 && cachedMoves[0]){
        console.log(curFrameCount);
        curFrameCount+=1;
        isMoving = true;
    }
    else if(cachedMoves[0]){
        cachedMoves.shift();
        curFrameCount=0;
        isMoving = true;
    }
    else if(!cachedMoves[0]){
        isMoving = false;
    }

    

    

    //gl.drawArrays( gl.TRIANGLES, 0, NumVertices);

    requestAnimFrame( render );
    
}
