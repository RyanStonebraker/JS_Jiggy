// Jiggy.js
// Ryan Stonebraker
// 5/16/2017
// A remake of the Jiggy C++ game in javascript

// for random shapes, have a vertex array storing the key vtxs of an object and then
// have a function that iterates through an array and creates a line to each
// have a break apart function that splits a base shape apart into an array of vtxArrays
var ctx;
var gameCanvas;

var game = {
    "width": 800,
    "height": 500,
    "scattered": false,
    "posTolerance": 100,
    "angTolerance": 100,
    "fps": 60,
    "counter": 0,
    "scatterTime": 0.5 * 60, // 2 seconds
    "pauseTime": 1 * 60,
    "maxScatterSpeedX": 15 * Math.random() + 5,
    "maxScatterSpeedY": 15 * Math.random() + 5,
    "maxScatterSpin": 30 * Math.random(),
    "scatterMargin": 0.1
};

var key = {
    "up": "W".charCodeAt(),
    "down": "S".charCodeAt(),
    "left": "A".charCodeAt(),
    "right": "D".charCodeAt(),
    "rotLeft": "Q".charCodeAt(),
    "rotRight": "E".charCodeAt()
};

var controller = {
    "xPos": 0,
    "yPos": 0,
    "xVelocity": 0,
    "yVelocity": 0,
    "angle": 0,
    "angleVelocity": 0,
    "friction": 1.2,
    "moveSpeed": 10,
    "rotSpeed": 5
};

var fractal = {
  "split" : 40
};

var objectArray = [];
var completedArray = [];

var blankPiece = {
    "outColor": "darkgrey",
    "xPos": 0,
    "yPos": 0,
    "width": 0,
    "height": 0,
    "angle": 0,
    "vtxArray": {
        x: [],
        y: []
    },
    "snapped": false,
    "initControl": false
};

function jiggyGame(gameDiv) {

    gameCanvas = gameDiv;

    if (gameCanvas.getContext) {
        ctx = gameCanvas.getContext("2d");

        // initiate canvas to the width and height defined in game object literal
        gameCanvas.width = game.width;
        gameCanvas.height = game.height;
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, game.width, game.height);

    this.populateArrayInit();

    this.refreshLoop();

    window.addEventListener('keydown', this.keys.bind(this), true);
}

jiggyGame.prototype.deepCopyArray = function (arr1, arr2) {
  for (var i = 0; i < arr1.length; ++i) {
    if (i >= arr2.length) {
      arr2.push(arr1[i]);
    }
    else {
      arr2[i] = arr1[i];
    }
  }
}

jiggyGame.prototype.makeShape = function (vtxArray) {
  var minPos = {
    "x" : vtxArray.x[0],
    "y" : vtxArray.y[0]
  };
  var maxPos = {
    "x" : vtxArray.x[0],
    "y" : vtxArray.y[0]
  };
  for (var i = 0; i < vtxArray.x.length; ++i) {
    minPos.x = ((vtxArray.x[i] < minPos.x) ? vtxArray.x[i] : minPos.x);
    minPos.y = ((vtxArray.y[i] < minPos.y) ? vtxArray.y[i] : minPos.y);

    maxPos.x = ((vtxArray.x[i] > maxPos.x) ? vtxArray.x[i] : maxPos.x);
    maxPos.y = ((vtxArray.y[i] > maxPos.y) ? vtxArray.y[i] : maxPos.y);
  }

  return {
    "outColor": "darkgrey",
    "xPos": minPos.x,
    "yPos": minPos.y,
    "width": maxPos.x - minPos.x,
    "height": maxPos.y - minPos.y,
    "angle": 0,
    "vtxArray": vtxArray,
    "snapped": false,
    "initControl": false
  };
}

jiggyGame.prototype.fractalize = function (base) {

  var bounds = {
    "horizontal": [],
    "vertical": []
  };
  var currentCheckX = 0;
  var currentCheckY = 0;

  var rndHz = Math.ceil(Math.random() * 4);
  var rndVt = Math.ceil(Math.random() * 4);

  for (var i = 0; i < rndHz; ++i) {
    bounds.horizontal.push(Math.floor(fractal.split + base.yPos + fractal.split * i));
  }

  for (var i = 0; i < rndVt; ++i) {
    bounds.vertical.push(Math.floor(fractal.split + base.xPos + fractal.split * i));
  }

  for (var i = 0; i < (rndHz+1) * (rndVt+1); ++i) {
    var currentShapeVtxArr = {
      "x" : [],
      "y" : []
    };

    for (var j = 0; j < base.vtxArray.x.length; ++j) {

      if (base.vtxArray.x[j] <= bounds.vertical[currentCheckX] && base.vtxArray.y[j] <= bounds.horizontal[currentCheckY]) {
        currentShapeVtxArr.x.push(base.vtxArray.x[j]);
        currentShapeVtxArr.y.push(base.vtxArray.y[j]);

        if (base.vtxArray.x[j+1] > bounds.vertical[currentCheckX]) {
          currentShapeVtxArr.x.push(bounds.vertical[currentCheckX]);
          if (base.vtxArray.y[j+1] <= bounds.horizontal[currentCheckY]) {
            currentShapeVtxArr.y.push((base.vtxArray.y[j+1] - base.vtxArray.y[j])/(base.vtxArray.x[j+1] - base.vtxArray.x[j]) * bounds.vertical[currentCheckX]);
          }
          ++currentCheckX;
        }

        if (base.vtxArray.y[j+1] > bounds.horizontal[currentCheckY]) {
          currentShapeVtxArr.y.push(bounds.horizontal[currentCheckY]);
          if (base.vtxArray.x[j+1] <= bounds.vertical[currentCheckX]) {
            currentShapeVtxArr.x.push(bounds.horizontal[currentCheckY] / (base.vtxArray.y[j+1] - base.vtxArray.y[j])/(base.vtxArray.x[j+1] - base.vtxArray.x[j]));
          }
          ++currentCheckY;
        }
      }

      else if (base.vtxArray.x[j-1] <= bounds.vertical[currentCheckX] && base.vtxArray.y[j-1] <= bounds.horizontal[currentCheckY]) {
        currentShapeVtxArr.x.push(bounds.vertical[currentCheckX]);
        currentShapeVtxArr.y.push(bounds.horizontal[currentCheckY]);
      }

      objectArray.push(this.makeShape(currentShapeVtxArr));
    }
  }
}

jiggyGame.prototype.populateArrayInit = function() {
    // objectArray.push(testPiece);

    // objectArray.push(testPiece2);
    // objectArray.push(testPiece3);

    this.fractalize(testPiece);

    for (var i = 0; i < objectArray.length; ++i) {
        completedArray.push({
          "xPos": objectArray[i].xPos,
          "yPos": objectArray[i].yPos,
          "angle": objectArray[i].angle,
        });

    }
}

var testPiece = {
    "inColor": "grey",
    "outColor": "darkgrey",
    "xPos": game.width/2 - 150,
    "yPos": game.height/2 - 125,
    "width": 300,
    "height": 250,
    "angle": 0,
    "vtxArray": {
        x: [],
        y: []
    },
    "snapped": false,
    "initControl": false
};

testPiece.vtxArray.x.push(0);
testPiece.vtxArray.y.push(0);

testPiece.vtxArray.x.push(testPiece.width);
testPiece.vtxArray.y.push(0);

testPiece.vtxArray.x.push(testPiece.width);
testPiece.vtxArray.y.push(testPiece.height);

testPiece.vtxArray.x.push(50);
testPiece.vtxArray.y.push(200);

testPiece.vtxArray.x.push(90);
testPiece.vtxArray.y.push(230);

testPiece.vtxArray.x.push(0);
testPiece.vtxArray.y.push(testPiece.height);

var testPiece3 = {
    "inColor": "grey",
    "outColor": "darkgrey",
    "xPos": game.width/2 - 70,
    "yPos": game.height/2 - 30,
    "width": 52,
    "height": 40,
    "angle": 20,
    "vtxArray": {
        x: [],
        y: []
    },
    "snapped": false,
    "initControl": false
};

testPiece3.vtxArray.x.push(0);
testPiece3.vtxArray.y.push(0);

testPiece3.vtxArray.x.push(testPiece3.width);
testPiece3.vtxArray.y.push(0);

testPiece3.vtxArray.x.push(testPiece3.width);
testPiece3.vtxArray.y.push(testPiece3.height);

testPiece3.vtxArray.x.push(100);
testPiece3.vtxArray.y.push(30);

testPiece3.vtxArray.x.push(0);
testPiece3.vtxArray.y.push(testPiece3.height);


var testPiece2 = {
    "inColor": "grey",
    "outColor": "darkgrey",
    "xPos": game.width/2 - 60,
    "yPos": game.height/2 - 35,
    "width": 50,
    "height": 30,
    "angle": 170,
    "vtxArray": {
        x: [],
        y: []
    },
    "snapped": false,
    "initControl": false
};

testPiece2.vtxArray.x.push(0);
testPiece2.vtxArray.y.push(0);

testPiece2.vtxArray.x.push(testPiece2.width);
testPiece2.vtxArray.y.push(0);

testPiece2.vtxArray.x.push(testPiece2.width);
testPiece2.vtxArray.y.push(testPiece2.height);

testPiece2.vtxArray.x.push(14);
testPiece2.vtxArray.y.push(10);

testPiece2.vtxArray.x.push(0);
testPiece2.vtxArray.y.push(testPiece2.height);


// updates the correct piece being controlled
jiggyGame.prototype.controlObject = function(shape) {
    if (shape.initControl) {
        shape.outColor = "blue";
        shape.xPos = controller.xPos;
        shape.yPos = controller.yPos;
        shape.angle = controller.angle;
    } else if (!shape.initControl) {
        controller.xPos = shape.xPos;
        controller.yPos = shape.yPos;
        controller.angle = shape.angle;
        shape.initControl = true;
    }

    this.drawObject(shape);
}

// draws any object given an object literal w/vtx array and a base location/angle
jiggyGame.prototype.drawObject = function(object) {
    // make sure object is on the screen before drawing it
    if (object.xPos + object.width < 0) {
      object.xPos = game.width;
      object.initControl = false;
    }
    else if (object.xPos > game.width) {
      object.xPos = -object.width;
      object.initControl = false;
    }
    if (object.yPos + object.height < 0) {
      object.yPos = game.height + object.height;
      object.initControl = false;
    }
    else if (object.yPos - object.height > game.height) {
      object.yPos = 0;
      object.initControl = false;
    }


    var rad = -object.angle * Math.PI / 180;

    ctx.save();

    ctx.translate(object.xPos + object.width / 2, object.yPos + object.height / 2);
    ctx.rotate(rad);

    ctx.beginPath();

    var startX = -object.width / 2;
    var startY = -object.height / 2;

    ctx.moveTo(startX, startY);
    ctx.strokeStyle = object.outColor;

    for (var i = 1; i < object.vtxArray.x.length; ++i) {
        ctx.lineTo(startX + object.vtxArray.x[i], startY + object.vtxArray.y[i]);
    }

    ctx.lineTo(startX, startY);

    ctx.stroke();
    ctx.closePath();

    ctx.restore();
}

jiggyGame.prototype.updatePosition = function() {
    controller.xPos += controller.xVelocity;
    controller.yPos += controller.yVelocity;
    controller.angle += controller.angleVelocity;
    controller.angle = controller.angle % 360;
    if (controller.angle < 0)
      controller.angle += 360;

    controller.xVelocity *= 1 / controller.friction;
    controller.yVelocity *= 1 / controller.friction;

    controller.angleVelocity *= 1 / controller.friction;
}


// TODO add functions for creating random initial shape and animating it breaking up, store shape objects
// in an array, implement adjacency matrix

jiggyGame.prototype.iterateControl = function(initBind) {
    var bindController = initBind;
    for (var i = 0; i < objectArray.length; ++i) {
        if (!objectArray[i].snapped && !bindController) {
            this.controlObject(objectArray[i]);
            bindController = true;
        } else
            this.drawObject(objectArray[i]);
    }
}

jiggyGame.prototype.checkSnap = function() {
    for (var i = 0; i < objectArray.length; ++i) {
        if (!objectArray[i].snapped) {
            if (Math.abs(objectArray[i].xPos - completedArray[i].xPos) <= game.posTolerance && Math.abs(objectArray[i].yPos - completedArray[i].yPos) <= game.posTolerance && Math.abs(objectArray[i].angle - completedArray[i].angle) <= game.angTolerance) {
              objectArray[i].xPos = completedArray[i].xPos;
              objectArray[i].yPos = completedArray[i].yPos;
              objectArray[i].angle = completedArray[i].angle;
              objectArray[i].outColor = "black";
              objectArray[i].snapped = true;
            }
        }
    }
}

jiggyGame.prototype.scatterPieces = function(pieceArr) {
  for (var i = 0; i < pieceArr.length; ++i) {
    var switchNeg = (i%2 ? -1 : 1);
    pieceArr[i].xPos += Math.random() * game.maxScatterSpeedX * switchNeg;
    pieceArr[i].yPos += Math.random() * game.maxScatterSpeedY * switchNeg;
    pieceArr[i].angle += Math.random() * game.maxScatterSpin;
    pieceArr[i].angle = pieceArr[i].angle % 360;
  }
}

jiggyGame.prototype.refreshLoop = function() {

    var self = this;

    setTimeout(function() {
        requestAnimationFrame(function() {
            self.refreshLoop();
        })
    }, 1000 / game.fps);

    // if (game.counter === 0) {
    //     for (var i = 0; i < objectArray.length; ++i) {
    //         objectArray[i].xPos = 0;
    //         objectArray[i].yPos = 0;
    //     }
    // }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, game.width, game.height);

    if (game.counter < game.pauseTime)
      this.iterateControl(true);

    if (game.counter <= game.scatterTime + game.pauseTime && game.counter > game.pauseTime) {
      this.scatterPieces(objectArray);
      this.iterateControl(true);
    }

    this.updatePosition();

    if (game.counter > game.scatterTime + game.pauseTime) {
      this.iterateControl(false);
      this.checkSnap();
    }

    ++game.counter;
}

jiggyGame.prototype.keys = function(evt) {
    switch (evt.keyCode) {
        case key.left:
            controller.xVelocity -= controller.moveSpeed;
            break;
        case key.right:
            controller.xVelocity += controller.moveSpeed;
            break;
        case key.up:
            controller.yVelocity -= controller.moveSpeed;
            break;
        case key.down:
            controller.yVelocity += controller.moveSpeed;
            break;
        case key.rotLeft:
            controller.angleVelocity -= controller.rotSpeed;
            break;
        case key.rotRight:
            controller.angleVelocity += controller.rotSpeed;
            break;
    }
}
