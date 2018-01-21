window.addEventListener('load', Load);
var ctx, canvas;
//player object
var player = {
    xPos: 10,
    yPos: 10,
    xSpeed: 10,
    ySpeed: 10,
    hp: 10,
    width: 20,
    height: 20,
    color: 'green',
    atkSpeed: 1,
    atkCounter: 0,
    down: false,
    up: false,
    right: false,
    left: false,
    aimAngle: 0
};
//global variable and consts 
var enemyList = {};
var upgradeList = {};
var bulletList = {};
var startTime = Date.now();
var enemyCounter = 0;
var frameCounter = 0;
var bulletCounter = 0;
var upgradeCounter = 0;
var score = 0;
// used to remove a bullet after few frames
var bulletTimer = 18;
// used to calculate the aiming angle
var lastMouseX = 0;
var lastMouseY = 0;
//get the distance between 2 points. NOT IN USE ATM
GetDistance = function (o1, o2) {
    var dx = o1.xPos - o2.xPos;
    var dy = o1.yPos - o2.yPos;
    return Math.sqrt(dx * dx + dy * dy);
}
// test the collision between 2 objects
TestCollision = function (o1, o2) {
    var rect1 = {
        x: o1.xPos - o1.width / 2,
        y: o1.yPos - o1.height / 2,
        width: o1.width,
        height: o1.height
    };
    var rect2 = {
        x: o2.xPos - o2.width / 2,
        y: o2.yPos - o2.height / 2,
        width: o2.width,
        height: o2.height
    };
    return TestCollisionRect(rect1, rect2);
}
// test the collision between the rectangles
TestCollisionRect = function (rect1, rect2) {
    return rect1.x <= rect2.x + rect2.width
        && rect2.x <= rect1.x + rect1.width
        && rect1.y <= rect2.y + rect2.height
        && rect2.y <= rect1.y + rect1.height;
}
//enemy constractur
Enemy = function (x, y, xs, ys, key, width, height, color) {
    var temp = {
        xPos: x,
        yPos: y,
        xSpeed: xs,
        ySpeed: ys,
        key: key,
        width: width,
        height: height,
        color: color,
        aimAngle: 0
    };
    enemyList[key] = temp;
}
//upgrade constractur
Upgrade = function (x, y, xs, ys, key, width, height, color, type) {
    var temp = {
        xPos: x,
        yPos: y,
        xSpeed: xs,
        ySpeed: ys,
        key: key,
        width: width,
        height: height,
        color: color,
        type: type
    };
    upgradeList[key] = temp;
}
//bullet constractur
Bullet = function (x, y, xs, ys, key, width, height, color) {
    var temp = {
        xPos: x,
        yPos: y,
        xSpeed: xs,
        ySpeed: ys,
        key: key,
        width: width,
        height: height,
        color: color,
        timer: 0
    };
    bulletList[key] = temp;
}
//shot a bullet everytime the user left click the mouse 
document.onclick = function (e) {
    if (player.atkCounter > 25) {
        CreateAimedBullet(player);
        player.atkCounter = 0;
    }
}
// shot a special attack when the user right click the mouse
document.oncontextmenu = function (e) {
    if (player.atkCounter > 50) {
        CreateAimedBullet(player, player.aimAngle - 20);
        CreateAimedBullet(player);
        CreateAimedBullet(player, player.aimAngle + 20);
        player.atkCounter = 0;
    }
    e.preventDefault();
}
//the function the render the game
Render = function () {
    //increase the framecounter and the score every frame
    frameCounter++;
    score++;
    //spawn enemy every 30 frame
    if (frameCounter % 30 == 0) {
        CreateRandomEnemy();
    }
    //spawn upgrade every 420 frame
    if (frameCounter % 420 == 0) {//blaze it
        CreateRandomUpgrade();
    }
    //charging the attack
    player.atkCounter += player.atkSpeed;
    //deleting the canvas before drawing everything again
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //drawing all the enemies, upgrades and bullets
    for (var key in enemyList) {
        var enemy = enemyList[key];
        UpdateObject(enemy);
        // testing to see if the player and the enemies are colliding
        var collision = TestCollision(player, enemy);
        //decrease player HP if so
        if (collision) {
            player.hp -= 1;


        }
    }
    for (var key in upgradeList) {
        var upgrade = upgradeList[key];
        Drawobject(upgrade);
        //testing to see if the player is colliding with an upgrade
        var collision = TestCollision(player, upgrade);
        //give the bonuse according to the type
        if (collision) {
            //giving the player between 0-500 points
            if (upgrade.type == 0) {
                score += Math.round(Math.random() * 500);
                delete upgradeList[key];
            }
            //increase the player attack speed
            else if (upgrade.type == 1) {
                player.atkSpeed = 5;
                delete upgradeList[key];
            }
            


        }
    }
    for (var key in bulletList) {
        var bullet = bulletList[key];
        UpdateObject(bullet);
        bullet.timer++;
        //deleting all the bullets which are alive for too long
        if (bullet.timer == bulletTimer) {
            delete bulletList[key];
            continue;
        }
        //check to see if the bullet hit an enemy
        for (var eKey in enemyList) {
            var enemy = enemyList[eKey];
            var collision = TestCollision(bullet, enemy);
            //delete the enemy if so
            if (collision) {
                delete enemyList[eKey];
                delete bulletList[key];
                score += 100;
                break;
            }
        }

    }
    //player lost
    if (player.hp <= 0) {
        var endTime = Date.now();
        console.log("you lost", (endTime - startTime) / 1000);
        StartNewGame();
    }
    //updating the position of the player
    updatePlayerPosition();
    //drawing the player
    Drawobject(player);
    //drawing hp and score
    ctx.fillText(player.hp + "HP", 0, 30);
    ctx.fillText("score: " + score, 200, 30);
}
//reset all the variables after the user lost
StartNewGame = function () {
    player.hp = 10;
    player.atkSpeed = 1;
    startTime = Date.now();
    frameCounter = 0;
    enemyList = {};
    upgradeList = {};
    bulletList = {};
    score = 0;
    CreateRandomEnemy();
    CreateRandomEnemy();
    CreateRandomEnemy();
}
//calculating the aiming angle everytime the user move the mouse
document.onmousemove = function (e) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    CalculateBulletAngle();
    
}
//checking which movment keys the user is holding down
document.onkeydown = function (e) {
    if (e.keyCode == 68) {
        player.right = true;
    }// D key
    else if (e.keyCode == 83) {
        player.down = true;
    } // S key
    else if (e.keyCode == 65) {
        player.left = true;
    } // A key
    else if (e.keyCode == 87) {
        player.up = true;
    } // W Key
}
// checking if the user released and movment keys
document.onkeyup = function (e) {
    if (e.keyCode == 68) {
        player.right = false;
    }
    else if (e.keyCode == 83) {
        player.down = false;
    }
    else if (e.keyCode == 65) {
        player.left = false;
    }
    else if (e.keyCode == 87) {
        player.up = false;
    }
}
//update the player position according to the keys the user presses
updatePlayerPosition = function () {
    if (player.right) {
        player.xPos += player.xSpeed;
        if (player.xPos >= canvas.width - player.width / 2) {
            player.xPos = canvas.width - player.width / 2;
        }
    }
    if (player.left) {
        player.xPos -= player.xSpeed;
        if (player.xPos <= player.width/2) {
            player.xPos = player.width / 2;
        }
    }
    if (player.down) {
        player.yPos += player.ySpeed;
        if (player.yPos >= canvas.height - player.height / 2) {
            player.yPos = canvas.height - player.height / 2 ;
        }
    }
    if (player.up) {
        player.yPos -= player.ySpeed;
        if (player.yPos <= player.height / 2) {
            player.yPos = player.height / 2;
        }
    }
    //calculate the aiming angle after the user moved the player
    CalculateBulletAngle();
}
//update the position of a given object and drawing it
UpdateObject = function (object) {
    UpdateObjectPosition(object);
    Drawobject(object);
}
//update the position of a given object
UpdateObjectPosition = function (object) {
    if (object.xPos > canvas.width - object.width / 2 || object.xPos < object.width / 2) {
        object.xSpeed = -object.xSpeed;
    }
    if (object.yPos > canvas.height - object.height / 2 || object.yPos < object.height / 2) {
        object.ySpeed = -object.ySpeed;
    }
    object.xPos += object.xSpeed;
    object.yPos += object.ySpeed;
}
//draw a given object
Drawobject = function (object) {
    ctx.save();
    ctx.fillStyle = object.color;
    ctx.fillRect(object.xPos - object.width / 2, object.yPos - object.height / 2, object.width, object.height);
    ctx.restore();
}
//create a random enemy
CreateRandomEnemy = function () {
    var width = Math.random() * 70 + 30;
    var height = Math.random() * 70 + 30;
    var x = Math.random() * canvas.width;
    var y = Math.random() * canvas.height;
    if (x + width * 1.5 > canvas.width) {
        x -= width;
    }
    if (x - width * 0.5 < 0) {
        x += width;
    }
    if (y + height * 1.5 > canvas.height) {
        y -= height;
    }
    if (y - height * 0.5 < 0) {
        y += height;
    }
    var xs = Math.random() * 8 + 2;
    var ys = Math.random() * 8 + 2;
    var key = enemyCounter.toString();
    enemyCounter++;
    var color = 'red';
    Enemy(x, y, xs, ys, key, width, height, color);
}
//create a random upgrade
CreateRandomUpgrade = function () {
    var x = Math.random() * (canvas.width - 20) + 10;
    var y = Math.random() * (canvas.height - 20) + 10;
    var xs = 0;
    var ys = 0;
    var key = upgradeCounter.toString();
    upgradeCounter++;
    var type;
    if (Math.random() > 0.1) {
        type = 0;
        color = 'orange';
        var width = 10;
        var height = 10;
    }
    else {
        type = 1;
        color = 'blue';
        width = 5;
        height = 5;
    }
    Upgrade(x, y, xs, ys, key, width, height, color, type);
}
//create a random bullet. NOT IN USE ATM
CreateRandomBullet = function (o) {
    var width = 10;
    var height = 10;
    var x = o.xPos;
    var y = o.yPos;
    var angel = Math.random() * 360;

    var xs = Math.cos(angel / 180 * Math.PI) * 30;
    var ys = Math.sin(angel / 180 * Math.PI) * 30;
    var key = bulletCounter.toString();
    bulletCounter++;
    var color = 'black';
    Bullet(x, y, xs, ys, key, width, height, color);
}
//create a bullet according to the player aimAngle
CreateAimedBullet = function (o, overWriteAngle) {
    var width = 10;
    var height = 10;
    var x = o.xPos;
    var y = o.yPos;
    var angle = o.aimAngle;
    //if this parameter is given it will change it the angle of the bullet
    if (overWriteAngle != undefined) {
        angle = overWriteAngle;
    }
    var xs = Math.cos(angle / 180 * Math.PI) * 30;
    var ys = Math.sin(angle / 180 * Math.PI) * 30;
    var key = bulletCounter.toString();
    bulletCounter++;
    var color = 'black';
    Bullet(x, y, xs, ys, key, width, height, color);
}
//calculate the angle of the bullet according to the player position and mouse location
CalculateBulletAngle = function () {
    var calculetedX = lastMouseX - player.xPos;
    var calculetedY = lastMouseY - player.yPos
    player.aimAngle = Math.atan2(calculetedY, calculetedX) / Math.PI * 180;
}
//loading the game and initializing the render loop to happen 25 times a second
function Load() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.font = "30px Arial";
    //init the render loop
    var Moveiter = setInterval(Render, 40);
    //creating the first 3 enemies
    CreateRandomEnemy();
    CreateRandomEnemy();
    CreateRandomEnemy();
}