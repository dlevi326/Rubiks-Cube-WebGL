// TODO
// - Work on loading and saving the cube


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
var cachedDirs = [];

var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;
var THETA = 0;
var PHI = 0;

var isMoving = false;

var savedMoves = [];
var savedDirs = [];


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

var moveDirection = 1;

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

    document.getElementById("permEnter").onclick = function(){
        var permNum = document.getElementById("permNumber").value;
        if(!permNum){permNum=0;}
        if(permNum<0){permNum=0;}
        randomlyPermute(permNum);
    };
    document.getElementById("load").onclick = function(){
        console.log("Loading...");
        var file = document.getElementById("loadFile").files[0];
        //var fullPath = file["RelativePath"]+file["name"];

        for(var ii=savedMoves.length-1;ii>=0;ii--){
            cachedMoves.push(savedMoves[ii]);
            cachedDirs.push(savedDirs[ii]*-1);
        }
        savedMoves = [];
        savedDirs = [];

        
        var fr = new FileReader();
        fr.onload = function( e ) {
            var data = JSON.parse( e.target.result );
            for(var i=0;i<data["moves"].length;i++){
                cachedMoves.push(data["moves"][i]);
                cachedDirs.push(data["dirs"][i]);
                savedMoves.push(data["moves"][i]);
                savedDirs.push(data["dirs"][i]);
            }
            
        };
        fr.readAsText(file);
    };
    document.getElementById("save").onclick = function(){
        console.log("Saving...");
        
        var data = {
            moves: savedMoves,
            dirs: savedDirs
        }

        var dataStr = JSON.stringify(data);

        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr));
        pom.setAttribute('download', "cube.json");

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    };


    document.getElementById("Red Center").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("TC");
            savedMoves.push("TC");
            savedDirs.push(1);
        }
    };
    document.getElementById("Yellow Center").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("BC");
            savedMoves.push("BC");
            savedDirs.push(1);
        }
    };
    document.getElementById("Blue Center").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("LC");
            savedMoves.push("LC");
            savedDirs.push(1);
        }
    };
    document.getElementById("Gray Center").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("FC");
            savedMoves.push("FC");
            savedDirs.push(1);
        }
    };
    document.getElementById("Green Center").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("RC");
            savedMoves.push("RC");
            savedDirs.push(1);
        }
    };
    document.getElementById("Magenta Center").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("BotC");
            savedMoves.push("BotC");
            savedDirs.push(1);
        }
    };
    document.getElementById("Middle1").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("MC1");
            savedMoves.push("MC1");
            savedDirs.push(1);
        }
    };
    document.getElementById("Middle2").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("MC2");
            savedMoves.push("MC2");
            savedDirs.push(1);
        }
    };
    document.getElementById("Middle3").onclick = function(){
        if(!isMoving){
            cachedDirs.push(1);
            cachedMoves.push("MC3");
            savedMoves.push("MC3");
            savedDirs.push(1);
        }
    };

    document.getElementById("Red Center CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("TC");
            savedMoves.push("TC");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Yellow Center CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("BC");
            savedMoves.push("BC");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Blue Center CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("LC");
            savedMoves.push("LC");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Gray Center CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("FC");
            savedMoves.push("FC");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Green Center CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("RC");
            savedMoves.push("RC");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Magenta Center CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("BotC");
            savedMoves.push("BotC");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Middle1 CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("MC1");
            savedMoves.push("MC1");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Middle2 CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("MC2");
            savedMoves.push("MC2");
            savedDirs.push(-1);
        }
    };
    document.getElementById("Middle3 CC").onclick = function(){
        if(!isMoving){
            cachedDirs.push(-1);
            cachedMoves.push("MC3");
            savedMoves.push("MC3");
            savedDirs.push(-1);
        }
    };

    document.addEventListener('keydown', function(event) {
        switch(event.key){
            case "q":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("TC");
                    savedMoves.push("TC");
                    savedDirs.push(1);
                }
                break;
            case "w":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("BC");
                    savedMoves.push("BC");
                    savedDirs.push(1);
                }
                break;
            case "e":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("LC");
                    savedMoves.push("LC");
                    savedDirs.push(1);
                }
                break;
            case "r":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("FC");
                    savedMoves.push("FC");
                    savedDirs.push(1);
                }
                break;
            case "t":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("RC");
                    savedMoves.push("RC");
                    savedDirs.push(1);
                }
                break;
            case "y":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("BotC");
                    savedMoves.push("BotC");
                    savedDirs.push(1);
                }
                break;
            case "u":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("MC1");
                    savedMoves.push("MC1");
                    savedDirs.push(1);
                }
                break;
            case "i":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("MC2");
                    savedMoves.push("MC2");
                    savedDirs.push(1);
                }
                break;
            case "o":
                if(!isMoving){
                    cachedDirs.push(1);
                    cachedMoves.push("MC3");
                    savedMoves.push("MC3");
                    savedDirs.push(1);
                }
                break;
            case "a":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("TC");
                    savedMoves.push("TC");
                    savedDirs.push(-1);
                }
                break;
            case "s":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("BC");
                    savedMoves.push("BC");
                    savedDirs.push(-1);
                }
                break;
            case "d":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("LC");
                    savedMoves.push("LC");
                    savedDirs.push(-1);
                }
                break;
            case "f":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("FC");
                    savedMoves.push("FC");
                    savedDirs.push(-1);
                }
                break;
            case "g":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("RC");
                    savedMoves.push("RC");
                    savedDirs.push(-1);
                }
                break;
            case "h":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("BotC");
                    savedMoves.push("BotC");
                    savedDirs.push(-1);
                }
                break;
            case "j":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("MC1");
                    savedMoves.push("MC1");
                    savedDirs.push(-1);
                }
                break;
            case "k":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("MC2");
                    savedMoves.push("MC2");
                    savedDirs.push(-1);
                }
                break;
            case "l":
                if(!isMoving){
                    cachedDirs.push(-1);
                    cachedMoves.push("MC3");
                    savedMoves.push("MC3");
                    savedDirs.push(-1);
                }
                break;

            default:
                break;
        }

        
    });

    

    render();
}

function randomlyPermute(num){
    var moves = ["TC","LC","BC","RC","FC","BotC","MC1","MC2","MC3"];
    var dirs = [-1,1];
    for(var i=0;i<num;i++){
        var ind1 = Math.floor(Math.random() * 9); // 0-8
        var ind2 = Math.floor(Math.random() * 2); // 0-1
        cachedMoves.push(moves[ind1]);
        cachedDirs.push(dirs[ind2]);
        savedMoves.push(moves[ind1]);
        savedDirs.push(dirs[ind2]);
    }
}

var cubeNames = ["FTL","FTC","FTR","FML","FMC","FMR","FBL","FBC","FBR","MTL","MTC",
"MTR","MML","MMC","MMR","MBL","MBC","MBR","BTL","BTC","BTR","BML","BMC","BMR","BBL",
"BBC","BBR"];

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
const origTrans = [
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
];

var numFrames = 9;
var curFrameCount = 0;
var cubeCount=0;

var middleColors = ["Gray","Blue","Yellow","Green","Red","Magenta"]
//                  [front,left,back,right,top,bottom]

function checkCache(model,i){
    
    var modelNew = model;
    if(cachedMoves[0]){
        moveDirection = cachedDirs[0]
        switch(cachedMoves[0]){
            case "TC":
                if(i==cubeNames.indexOf("FTL") || i==cubeNames.indexOf("FTC") || i==cubeNames.indexOf("FTR") ||
                    i==cubeNames.indexOf("MTL") || i==cubeNames.indexOf("MTC") || i==cubeNames.indexOf("MTR") ||
                    i==cubeNames.indexOf("BTL") || i==cubeNames.indexOf("BTC") || i==cubeNames.indexOf("BTR")){
                
                    modelNew = mult(rotateY(90/numFrames*moveDirection),modelNew);

                    
                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                                var FTL = cubeNames.indexOf("FTL"); 
                                var FTC = cubeNames.indexOf("FTC");
                                var FTR = cubeNames.indexOf("FTR");
                                var MTL = cubeNames.indexOf("MTL");
                                var MTR = cubeNames.indexOf("MTR");
                                var BTL = cubeNames.indexOf("BTL");
                                var BTC = cubeNames.indexOf("BTC");
                                var BTR = cubeNames.indexOf("BTR");

                                var tempFTC = cubeNames[FTC];
                                var tempFTL = cubeNames[FTL];
                                var tempMTL = cubeNames[MTL];
                                var tempBTL = cubeNames[BTL]

                                cubeNames[FTL] = cubeNames[FTR];
                                cubeNames[FTC] = cubeNames[MTR];
                                cubeNames[FTR] = cubeNames[BTR];
                                cubeNames[MTL] = tempFTC;
                                cubeNames[MTR] = cubeNames[BTC];
                                cubeNames[BTL] = tempFTL;
                                cubeNames[BTC] = tempMTL;
                                cubeNames[BTR] = tempBTL;
                        }

                        


                        cubeCount=0;
                    }
                    cubeCount+=1

                }
                else{
                    modelNew = model;
                }
                break;

            case "BC":
                if(i==cubeNames.indexOf("BBL") || i==cubeNames.indexOf("BBC") || i==cubeNames.indexOf("BBR") ||
                    i==cubeNames.indexOf("BML") || i==cubeNames.indexOf("BMC") || i==cubeNames.indexOf("BMR") ||
                    i==cubeNames.indexOf("BTL") || i==cubeNames.indexOf("BTC") || i==cubeNames.indexOf("BTR")){
                
                    modelNew = mult(rotateZ(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var BTL = cubeNames.indexOf("BTL"); 
                            var BTC = cubeNames.indexOf("BTC");
                            var BTR = cubeNames.indexOf("BTR");
                            var BML = cubeNames.indexOf("BML");
                            var BMR = cubeNames.indexOf("BMR");
                            var BBL = cubeNames.indexOf("BBL");
                            var BBC = cubeNames.indexOf("BBC");
                            var BBR = cubeNames.indexOf("BBR");

                            var tempBTC = cubeNames[BTC];
                            var tempBTL = cubeNames[BTL];
                            var tempBML = cubeNames[BML];
                            var tempBBL = cubeNames[BBL]

                            cubeNames[BTL] = cubeNames[BTR];
                            cubeNames[BTC] = cubeNames[BMR];
                            cubeNames[BTR] = cubeNames[BBR];
                            cubeNames[BML] = tempBTC;
                            cubeNames[BMR] = cubeNames[BBC];
                            cubeNames[BBL] = tempBTL;
                            cubeNames[BBC] = tempBML;
                            cubeNames[BBR] = tempBBL;
                        }

                        

                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;

            case "LC":
                if(i==cubeNames.indexOf("FTL") || i==cubeNames.indexOf("FML") || i==cubeNames.indexOf("FBL") ||
                    i==cubeNames.indexOf("MTL") || i==cubeNames.indexOf("MML") || i==cubeNames.indexOf("MBL") ||
                    i==cubeNames.indexOf("BTL") || i==cubeNames.indexOf("BML") || i==cubeNames.indexOf("BBL")){
                
                    modelNew = mult(rotateX(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var FTL = cubeNames.indexOf("FTL"); 
                            var FML = cubeNames.indexOf("FML");
                            var FBL = cubeNames.indexOf("FBL");
                            var MTL = cubeNames.indexOf("MTL");
                            var MBL = cubeNames.indexOf("MBL");
                            var BTL = cubeNames.indexOf("BTL");
                            var BML = cubeNames.indexOf("BML");
                            var BBL = cubeNames.indexOf("BBL");

                            var tempFML = cubeNames[FML];
                            var tempFTL = cubeNames[FTL];
                            var tempMTL = cubeNames[MTL];
                            var tempBTL = cubeNames[BTL]

                            cubeNames[FTL] = cubeNames[FBL];
                            cubeNames[FML] = cubeNames[MBL];
                            cubeNames[FBL] = cubeNames[BBL];
                            cubeNames[MTL] = tempFML;
                            cubeNames[MBL] = cubeNames[BML];
                            cubeNames[BTL] = tempFTL;
                            cubeNames[BML] = tempMTL;
                            cubeNames[BBL] = tempBTL;
                        }


                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;

            case "FC":
                if(i==cubeNames.indexOf("FTR") || i==cubeNames.indexOf("FTC") || i==cubeNames.indexOf("FTL") ||
                    i==cubeNames.indexOf("FMR") || i==cubeNames.indexOf("FMC") || i==cubeNames.indexOf("FML") ||
                    i==cubeNames.indexOf("FBR") || i==cubeNames.indexOf("FBC") || i==cubeNames.indexOf("FBL")){
                
                    modelNew = mult(rotateZ(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var FTL = cubeNames.indexOf("FTL"); 
                            var FTC = cubeNames.indexOf("FTC");
                            var FTR = cubeNames.indexOf("FTR");
                            var FML = cubeNames.indexOf("FML");
                            var FMR = cubeNames.indexOf("FMR");
                            var FBL = cubeNames.indexOf("FBL");
                            var FBC = cubeNames.indexOf("FBC");
                            var FBR = cubeNames.indexOf("FBR");

                            var tempFTC = cubeNames[FTC];
                            var tempFTL = cubeNames[FTL];
                            var tempFML = cubeNames[FML];
                            var tempFBL = cubeNames[FBL]

                            cubeNames[FTL] = cubeNames[FTR];
                            cubeNames[FTC] = cubeNames[FMR];
                            cubeNames[FTR] = cubeNames[FBR];
                            cubeNames[FML] = tempFTC;
                            cubeNames[FMR] = cubeNames[FBC];
                            cubeNames[FBL] = tempFTL;
                            cubeNames[FBC] = tempFML;
                            cubeNames[FBR] = tempFBL;
                        }

                        

                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;

            case "RC":
                if(i==cubeNames.indexOf("FTR") || i==cubeNames.indexOf("FMR") || i==cubeNames.indexOf("FBR") ||
                    i==cubeNames.indexOf("MTR") || i==cubeNames.indexOf("MMR") || i==cubeNames.indexOf("MBR") ||
                    i==cubeNames.indexOf("BTR") || i==cubeNames.indexOf("BMR") || i==cubeNames.indexOf("BBR")){
                
                    modelNew = mult(rotateX(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var FTR = cubeNames.indexOf("FTR"); 
                            var FMR = cubeNames.indexOf("FMR");
                            var FBR = cubeNames.indexOf("FBR");
                            var MTR = cubeNames.indexOf("MTR");
                            var MBR = cubeNames.indexOf("MBR");
                            var BTR = cubeNames.indexOf("BTR");
                            var BMR = cubeNames.indexOf("BMR");
                            var BBR = cubeNames.indexOf("BBR");

                            var tempFMR = cubeNames[FMR];
                            var tempFTR = cubeNames[FTR];
                            var tempMTR = cubeNames[MTR];
                            var tempBTR = cubeNames[BTR];

                            //
                            cubeNames[FTR] = cubeNames[FBR];
                            cubeNames[FMR] = cubeNames[MBR];
                            cubeNames[FBR] = cubeNames[BBR];
                            cubeNames[MTR] = tempFMR;
                            cubeNames[MBR] = cubeNames[BMR];
                            cubeNames[BTR] = tempFTR;
                            cubeNames[BMR] = tempMTR;
                            cubeNames[BBR] = tempBTR;
                        }

                        

                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;

            case "BotC":
                if(i==cubeNames.indexOf("FBL") || i==cubeNames.indexOf("FBC") || i==cubeNames.indexOf("FBR") ||
                    i==cubeNames.indexOf("MBL") || i==cubeNames.indexOf("MBC") || i==cubeNames.indexOf("MBR") ||
                    i==cubeNames.indexOf("BBL") || i==cubeNames.indexOf("BBC") || i==cubeNames.indexOf("BBR")){
                
                    modelNew = mult(rotateY(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var FBL = cubeNames.indexOf("FBL"); 
                            var FBC = cubeNames.indexOf("FBC");
                            var FBR = cubeNames.indexOf("FBR");
                            var MBL = cubeNames.indexOf("MBL");
                            var MBR = cubeNames.indexOf("MBR");
                            var BBL = cubeNames.indexOf("BBL");
                            var BBC = cubeNames.indexOf("BBC");
                            var BBR = cubeNames.indexOf("BBR");

                            var tempFBC = cubeNames[FBC];
                            var tempFBL = cubeNames[FBL];
                            var tempMBL = cubeNames[MBL];
                            var tempBBL = cubeNames[BBL];

                            //
                            cubeNames[FBL] = cubeNames[FBR];
                            cubeNames[FBC] = cubeNames[MBR];
                            cubeNames[FBR] = cubeNames[BBR];
                            cubeNames[MBL] = tempFBC;
                            cubeNames[MBR] = cubeNames[BBC];
                            cubeNames[BBL] = tempFBL;
                            cubeNames[BBC] = tempMBL;
                            cubeNames[BBR] = tempBBL;
                        }

                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;

            
            case "MC1":
                if(i==cubeNames.indexOf("FML") || i==cubeNames.indexOf("FMC") || i==cubeNames.indexOf("FMR") ||
                    i==cubeNames.indexOf("MML") || i==cubeNames.indexOf("MMC") || i==cubeNames.indexOf("MMR") ||
                    i==cubeNames.indexOf("BML") || i==cubeNames.indexOf("BMC") || i==cubeNames.indexOf("BMR")){
                
                    modelNew = mult(rotateY(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var t0 = middleColors[0];
                            middleColors[0] = middleColors[1];
                            middleColors[1] = middleColors[2];
                            middleColors[2] = middleColors[3];
                            middleColors[3] = t0;
                            

                            var FML = cubeNames.indexOf("FML"); 
                            var FMC = cubeNames.indexOf("FMC");
                            var FMR = cubeNames.indexOf("FMR");
                            var MML = cubeNames.indexOf("MML");
                            var MMR = cubeNames.indexOf("MMR");
                            var BML = cubeNames.indexOf("BML");
                            var BMC = cubeNames.indexOf("BMC");
                            var BMR = cubeNames.indexOf("BMR");

                            var tempFMC = cubeNames[FMC];
                            var tempFML = cubeNames[FML];
                            var tempMML = cubeNames[MML];
                            var tempBML = cubeNames[BML];

                            //
                            cubeNames[FML] = cubeNames[FMR];
                            cubeNames[FMC] = cubeNames[MMR];
                            cubeNames[FMR] = cubeNames[BMR];
                            cubeNames[MML] = tempFMC;
                            cubeNames[MMR] = cubeNames[BMC];
                            cubeNames[BML] = tempFML;
                            cubeNames[BMC] = tempMML;
                            cubeNames[BMR] = tempBML;
                        }


                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;
                
            case "MC2":
                if(i==cubeNames.indexOf("FTC") || i==cubeNames.indexOf("FMC") || i==cubeNames.indexOf("FBC") ||
                    i==cubeNames.indexOf("MTC") || i==cubeNames.indexOf("MMC") || i==cubeNames.indexOf("MBC") ||
                    i==cubeNames.indexOf("BTC") || i==cubeNames.indexOf("BMC") || i==cubeNames.indexOf("BBC")){
                
                    modelNew = mult(rotateX(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var t4 = middleColors[4];
                            middleColors[4] = middleColors[2];
                            middleColors[2] = middleColors[5];
                            middleColors[5] = middleColors[0];
                            middleColors[0] = t4;

                            var FTC = cubeNames.indexOf("FTC"); 
                            var FMC = cubeNames.indexOf("FMC");
                            var FBC = cubeNames.indexOf("FBC");
                            var MTC = cubeNames.indexOf("MTC");
                            var MBC = cubeNames.indexOf("MBC");
                            var BTC = cubeNames.indexOf("BTC");
                            var BMC = cubeNames.indexOf("BMC");
                            var BBC = cubeNames.indexOf("BBC");

                            var tempFMC = cubeNames[FMC];
                            var tempFTC = cubeNames[FTC];
                            var tempMTC = cubeNames[MTC];
                            var tempBTC = cubeNames[BTC];

                            //
                            cubeNames[FTC] = cubeNames[FBC];
                            cubeNames[FMC] = cubeNames[MBC];
                            cubeNames[FBC] = cubeNames[BBC];
                            cubeNames[MTC] = tempFMC;
                            cubeNames[MBC] = cubeNames[BMC];
                            cubeNames[BTC] = tempFTC;
                            cubeNames[BMC] = tempMTC;
                            cubeNames[BBC] = tempBTC;
                        }


                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;
            case "MC3":
                if(i==cubeNames.indexOf("MTL") || i==cubeNames.indexOf("MTC") || i==cubeNames.indexOf("MTR") ||
                    i==cubeNames.indexOf("MML") || i==cubeNames.indexOf("MMC") || i==cubeNames.indexOf("MMR") ||
                    i==cubeNames.indexOf("MBL") || i==cubeNames.indexOf("MBC") || i==cubeNames.indexOf("MBR")){
                
                    modelNew = mult(rotateZ(90/numFrames*moveDirection),modelNew);

                    if(curFrameCount>=numFrames-1 && cubeCount>=9){

                        // Indexes of all cubes on the face
                        var times=1;
                        if(moveDirection<0){
                            times+=2;
                        }
                        
                        for(var ii=0;ii<times;ii++){
                            var t4 = middleColors[4];
                            middleColors[4] = middleColors[1];
                            middleColors[1] = middleColors[5];
                            middleColors[5] = middleColors[3];
                            middleColors[3] = t4;

                            var MTL = cubeNames.indexOf("MTL"); 
                            var MTC = cubeNames.indexOf("MTC");
                            var MTR = cubeNames.indexOf("MTR");
                            var MML = cubeNames.indexOf("MML");
                            var MMR = cubeNames.indexOf("MMR");
                            var MBL = cubeNames.indexOf("MBL");
                            var MBC = cubeNames.indexOf("MBC");
                            var MBR = cubeNames.indexOf("MBR");

                            var tempMTC = cubeNames[MTC];
                            var tempMTL = cubeNames[MTL];
                            var tempMML = cubeNames[MML];
                            var tempMBL = cubeNames[MBL];

                            //
                            cubeNames[MTL] = cubeNames[MTR];
                            cubeNames[MTC] = cubeNames[MMR];
                            cubeNames[MTR] = cubeNames[MBR];
                            cubeNames[MML] = tempMTC;
                            cubeNames[MMR] = cubeNames[MBC];
                            cubeNames[MBL] = tempMTL;
                            cubeNames[MBC] = tempMML;
                            cubeNames[MBR] = tempMBL;
                        }


                        cubeCount = 0;
                    }

                    cubeCount+=1

                    
                }
                else{
                    modelNew = model;
                }
                break;




            /*case "FC":
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
                    //modelNew = mult(model,translate(.1,0,0));
                }
                else{
                    modelNew = model;
                }
                break;*/
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

var orig = ["FTL","FTC","FTR","FML","FMC","FMR","FBL","FBC","FBR","MTL","MTC",
    "MTR","MML","MMC","MMR","MBL","MBC","MBR","BTL","BTC","BTR","BML","BMC","BMR","BBL",
    "BBC","BBR"];

function checkIfSolved(){

    if(orig.length !== cubeNames.length)
        return;
    for(var i = orig.length; i--;) {
        if(orig[i] !== cubeNames[i])
            return;
    }
    cachedMoves = [];
    cachedDirs = [];
    window.confirm("Solved!");
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    moveCube();


    for(var i=0;i<rubiksCubePoints.length;i++){
        trans[i] = checkCache(trans[i],i);
        modelMatrixNew = mult(modelMatrix, trans[i]);
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
    //var middleColors = ["Gray","Blue","Yellow","Green","Red","Magenta"]

    if(curFrameCount<numFrames-1 && cachedMoves[0]){
        //console.log(curFrameCount);
        curFrameCount+=1;
        isMoving = true;
    }
    else if(cachedMoves[0]){
        cachedMoves.shift();
        cachedDirs.shift();
        curFrameCount=0;
        isMoving = true;

        document.getElementById("Red Center").innerHTML = "<strong>"+middleColors[4]+"</strong>"+" center C (q)";
        document.getElementById("Yellow Center").innerHTML = "<strong>"+middleColors[2]+"</strong>"+" center C (w)";
        document.getElementById("Blue Center").innerHTML = "<strong>"+middleColors[1]+"</strong>"+" center C (e)";
        document.getElementById("Gray Center").innerHTML = "<strong>"+middleColors[0]+"</strong>"+" center C (r)";
        document.getElementById("Green Center").innerHTML = "<strong>"+middleColors[3]+"</strong>"+" center C (t)";
        document.getElementById("Magenta Center").innerHTML = "<strong>"+middleColors[5]+"</strong>"+" center C (y)";
        document.getElementById("Middle1").innerHTML = "<strong>"+"["+middleColors[3]+", "+middleColors[2]+", "+middleColors[1]+", "+middleColors[0]+"]"+"</strong>"+" center C (u)";
        document.getElementById("Middle2").innerHTML = "<strong>"+"["+middleColors[2]+", "+middleColors[4]+", "+middleColors[0]+", "+middleColors[5]+"]"+"</strong>"+" center C (i)";
        document.getElementById("Middle3").innerHTML = "<strong>"+"["+middleColors[3]+", "+middleColors[4]+", "+middleColors[1]+", "+middleColors[5]+"]"+"</strong>"+" center C (o)";
    
        document.getElementById("Red Center CC").innerHTML = "<strong>"+middleColors[4]+"</strong>"+" center CC (a)";
        document.getElementById("Yellow Center CC").innerHTML = "<strong>"+middleColors[2]+"</strong>"+" center CC (s)";
        document.getElementById("Blue Center CC").innerHTML = "<strong>"+middleColors[1]+"</strong>"+" center CC (d)";
        document.getElementById("Gray Center CC").innerHTML = "<strong>"+middleColors[0]+"</strong>"+" center CC (f)";
        document.getElementById("Green Center CC").innerHTML = "<strong>"+middleColors[3]+"</strong>"+" center CC (g)";
        document.getElementById("Magenta Center CC").innerHTML = "<strong>"+middleColors[5]+"</strong>"+" center CC (h)";
        document.getElementById("Middle1 CC").innerHTML = "<strong>"+"["+middleColors[3]+", "+middleColors[2]+", "+middleColors[1]+", "+middleColors[0]+"]"+"</strong>"+" center CC (j)";
        document.getElementById("Middle2 CC").innerHTML = "<strong>"+"["+middleColors[2]+", "+middleColors[4]+", "+middleColors[0]+", "+middleColors[5]+"]"+"</strong>"+" center CC (k)";
        document.getElementById("Middle3 CC").innerHTML = "<strong>"+"["+middleColors[3]+", "+middleColors[4]+", "+middleColors[1]+", "+middleColors[5]+"]"+"</strong>"+" center CC (l)";
        if(!cachedMoves[0]){checkIfSolved();}
        
    }
    else if(!cachedMoves[0]){
        isMoving = false;
    }

    

    

    //gl.drawArrays( gl.TRIANGLES, 0, NumVertices);

    requestAnimFrame( render );
    
}
