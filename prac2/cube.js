// TODO
// - Create individual cubes
// - Figure out translations
// - Figure out how to store them

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

var sensitivity = .5;

var cBuffer, vColor, vBuffer, vPosition;

function trackballView( x,  y ) {
    var d, a;
    var v = [];

    v[0] = x;
    v[1] = y;

    d = v[0]*v[0] + v[1]*v[1];
    if (d < 1.0)
      v[2] = Math.sqrt(1.0 - d);
    else {
      v[2] = 0.0;
      a = 1.0 /  Math.sqrt(d);
      v[0] *= a;
      v[1] *= a;
    }
    return v;
}

function mouseMotion()
{
    var dx, dy, dz;

    var x = 2*event.clientX/canvas.width-1;
    var y = 2*(canvas.height-event.clientY)/canvas.height-1;

    var curPos = trackballView(x, y);
    if(trackingMouse) {
      dx = curPos[0] - lastPos[0];
      dy = curPos[1] - lastPos[1];
      dz = curPos[2] - lastPos[2];

      if (dx || dy || dz) {
            angle = -1 * sensitivity * Math.sqrt(dx*dx + dy*dy + dz*dz);


            axis[0] = lastPos[1]*curPos[2] - lastPos[2]*curPos[1];
            axis[1] = lastPos[2]*curPos[0] - lastPos[0]*curPos[2];
            axis[2] = lastPos[0]*curPos[1] - lastPos[1]*curPos[0];

            lastPos[0] = curPos[0];
            lastPos[1] = curPos[1];
            lastPos[2] = curPos[2];
      }
    }
    render();
}

function startMotion()
{
    var x = 2*event.clientX/canvas.width-1;
    var y = 2*(canvas.height-event.clientY)/canvas.height-1;
    trackingMouse = true;
    startX = x;
    startY = y;
    curx = x;
    cury = y;

    lastPos = trackballView(x, y);
	trackballMove=true;
}

function stopMotion()
{
    trackballMove = false;
    var x = 2*event.clientX/canvas.width-1;
    var y = 2*(canvas.height-event.clientY)/canvas.height-1;
    trackingMouse = false;
    if (startX != x || startY != y) {
    }
    else {
	     angle = 0.0;
	     trackballMove = false;
    }
}



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

    canvas.addEventListener("mousedown", function(event){
        startMotion();
    });
  
    canvas.addEventListener("mouseup", function(event){
        stopMotion();
    });

    canvas.addEventListener("mousemove", function(event){
        mouseMotion();
    });

    /*canvas.addEventListener( 'mousedown', moveMouseStart, false );
    canvas.addEventListener( 'mouseup', moveMouseStop, false );
    canvas.addEventListener( 'mouseout', moveMouseStop, false );
    canvas.addEventListener( 'mousemove', moveMouseMove, false );*/
    

    render();
}

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

    generateSmallCube([0,0,0,1,7,4]); // middle-top-left
    generateSmallCube([0,0,0,1,7,0]); // middle-top-center
    generateSmallCube([0,3,0,1,0,0]); // middle-top-right
    generateSmallCube([0,0,0,0,7,4]); // middle-middle-left
    generateSmallCube([0,0,0,0,0,0]); // middle-middle-center XXXXXX
    generateSmallCube([0,3,0,0,0,0]); // middle-middle-right
    generateSmallCube([0,0,5,0,0,4]); // middle-bottom-left
    generateSmallCube([0,0,5,0,0,0]); // middle-bottom-center
    generateSmallCube([0,3,5,0,0,0]); // middle-bottom-right

    generateSmallCube([2,0,0,1,0,4]); // back-top-left
    generateSmallCube([2,0,0,1,0,0]); // back-top-center
    generateSmallCube([2,3,0,1,0,0]); // back-top-right
    generateSmallCube([2,0,0,0,0,4]); // back-middle-left
    generateSmallCube([2,0,0,0,0,0]); // back-middle-center XXXXXX
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
    console.log(rubiksCubePoints);
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

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //gl.uniform3fv(thetaLoc, theta);


    if(trackballMove) {
        axis = normalize(axis);
        projectionMatrix = mult(projectionMatrix, rotate(angle, axis));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    }

    //modelMatrixNew = mult(modelMatrix, translate(0.1, 0.1, 0.1));
    //gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrixNew));

    //rotationMatrix = mult(rotationMatrix, rotate(angle,axis));
    //var translationMatrixTrans = mult(translationMatrix,translate(.65, .65, .65));
    //gl.uniformMatrix4fv(translationMatrixLoc,false,flatten(translationMatrixTrans));
    //console.log(translationMatrixTrans);

    for(var i=0;i<rubiksCubePoints.length;i++){
        modelMatrixNew = mult(modelMatrix, translations[i]);//translate(0.1*i, 0.1*i, 0.1*i));
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

    

    //gl.drawArrays( gl.TRIANGLES, 0, NumVertices);

    requestAnimFrame( render );
    
}
