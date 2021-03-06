window.addEventListener('load', Load);
var ctx, canvas;
//player object
var player;
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
// const to calculate the reload bar
var atkCounterConst = 25;
//make the sound effevt of explosion
MakeExplosionSound = function(){
    var audio = new Audio("Style/Sound/explosion.wav");
    audio.play();
    
}


// test the collision between the rectangles
TestCollisionRect = function (rect1, rect2) {
    return rect1.x <= rect2.x + rect2.width
        && rect2.x <= rect1.x + rect1.width
        && rect1.y <= rect2.y + rect2.height
        && rect2.y <= rect1.y + rect1.height;
}

Entity = function(type, key, x, y,xs,ys,width,height,color){
    var self = {
        type: type,
        xPos:x,
        yPos: y,
        xSpeed: xs,
        ySpeed: ys,
        width: width,
        height:height,
        color:color,
        key:key
    }
    //get the distance between 2 points. NOT IN USE ATM
    self.GetDistance = function(o){
        var dx = self.xPos - o.xPos;
        var dy = self.yPos - o.yPos;
        return Math.sqrt(dx * dx + dy * dy);
    }
    // test the collision between self and another object
    self.TestCollision = function(o){
        //checks if the palyer is immune at the moment
        if (self.type == "player" && o.type == "enemy" && self.immune) {
            return false;
        }
        var rect1 = {
            x: self.xPos - self.width / 2,
            y: self.yPos - self.height / 2,
            width: self.width,
            height: self.height
        };
        var rect2 = {
            x: o.xPos - o.width / 2,
            y: o.yPos - o.height / 2,
            width: o.width,
            height: o.height
        };
        return TestCollisionRect(rect1, rect2);
    }
    //update the position of a given object and drawing it
    self.Update = function () {
        self.UpdatePosition();
        self.Draw();
    }
    //draw the object
    self.Draw = function(){
        ctx.save();
        ctx.fillStyle = self.color;
        ctx.fillRect(self.xPos - self.width / 2, self.yPos - self.height / 2, self.width, self.height);
        ctx.restore();
    }
    //update the position of the object
    self.UpdatePosition = function(){
            if (self.xPos > canvas.width - self.width / 2 || self.xPos < self.width / 2) {
                self.xSpeed = -self.xSpeed;
            }
            if (self.yPos > canvas.height - self.height / 2 || self.yPos < self.height / 2) {
                self.ySpeed = -self.ySpeed;
            }
            self.xPos += self.xSpeed;
            self.yPos += self.ySpeed;    
    }
    return self;
}

Actor = function(type, key, x, y,xs,ys,width,height,color, hp, atkSpeed){
    var self = Entity(type, key, x, y,xs,ys,width,height,color);
    self.hp = hp;
    self.aimAngle = 0;
    self.atkSpeed = atkSpeed;
    self.atkCounter = 0;
    var entityUpdate = self.Update;
    self.Update = function(){
        entityUpdate();
        self.atkCounter += self.atkSpeed;
    }
    self.performAttack = function(){
        if (self.atkCounter > atkCounterConst) {
            CreateAimedBullet(self);
            self.atkCounter = 0;
        }
    }
    self.performSpecialAttack = function(){
        if (self.atkCounter > 50) {
            CreateAimedBullet(self, self.aimAngle - 20);
            CreateAimedBullet(self);
            CreateAimedBullet(self, self.aimAngle + 20);
            self.atkCounter = 0;
        }
    }
    return self;
}

Player = function(){
    var self = Actor("player", "ID", 10, 10, 10, 10, 20, 20, 'green', 10, 1);
    self.UpdatePosition = function(){
        if (self.right) {
            self.xPos += self.xSpeed;
            if (self.xPos >= canvas.width - self.width / 2) {
                self.xPos = canvas.width - self.width / 2;
            }
        }
        if (self.left) {
            self.xPos -= self.xSpeed;
            if (self.xPos <= self.width/2) {
                self.xPos = self.width / 2;
            }
        }
        if (self.down) {
            self.yPos += self.ySpeed;
            if (self.yPos >= canvas.height - self.height / 2) {
                self.yPos = canvas.height - self.height / 2 ;
            }
        }
        if (self.up) {
            self.yPos -= self.ySpeed;
            if (self.yPos <= self.height / 2) {
                self.yPos = self.height / 2;
            }
        }
        //calculate the aiming angle after the user moved the player
        CalculateBulletAngle();
    }
    self.down = false;
    self.up = false;
    self.right = false;
    self.left = false;
    self.immune = false;
    self.immuneFrames = 0;
    var entityUpdate = self.Update;
    self.Update = function(){
    //decrease the immune time
    immunityManager();
    entityUpdate()
    //player lost
        if (self.hp <= 0) {
            var endTime = Date.now();
            console.log("you lost", (endTime - startTime) / 1000);
            StartNewGame();
        }
    }
    return self;
}

var immunityManager = function(){
    if (player.immuneFrames > 0) {
        player.immuneFrames--;
        if (player.immuneFrames % 2 == 0) {
            player.color = player.color == "green" ? "white" : "green";
        }
    }
    else{
        player.immune = false;
        player.color = "green";
    }
}
//enemy constractur
Enemy = function (x, y, xs, ys, key, width, height, color) {
    var self = Actor("enemy", key, x,y,xs,ys,width,height,color, 10, 1);
    var entityUpdate = self.Update;
    self.Update = function(){
        entityUpdate();
        //self.performAttack();
        // testing to see if the player and the enemies are colliding
        var collision = player.TestCollision(self);
        //decrease player HP if so
        if (collision) {
            enemyCollision();
        }
    }
    enemyList[key] = self;
}

var enemyCollision = function(){
    player.hp -= 1;
    player.immune = true;
    player.immuneFrames = 40;
}
//upgrade constractur
Upgrade = function (x, y, xs, ys, key, width, height, color, category) {
    var self = Entity("upgrade", key, x,y,xs,ys,width,height,color);
    self.category = category;
    var entityUpdate = self.Update;
    self.Update = function(){
        entityUpdate();
        //testing to see if the player is colliding with an upgrade
        var collision = player.TestCollision(self);
        //give the bonuse according to the type
        if (collision) {
            //giving the player between 0-500 points
            if (self.category == 0) {
                score += Math.round(Math.random() * 500);
                delete upgradeList[self.key];
            }
            //increase the player attack speed
            else if (self.category == 1) {
                player.atkSpeed = 5;
                delete upgradeList[self.key];
            }
            


        }
    }

    upgradeList[key] = self;
}
//bullet constractur
Bullet = function (x, y, xs, ys, key, width, height, color) {
    var self = Entity("bullet", key, x,y,xs,ys,width,height,color);
    self.timer = 0;
    var entityUpdate = self.Update;
    self.Update = function(){
        entityUpdate();
        var toRemove = false;
        self.timer++;
        //deleting all the bullets which are alive for too long
        if (self.timer > bulletTimer) {
            toRemove = true;
        }
        //check to see if the bullet hit an enemy
        for (var eKey in enemyList) {
            var enemy = enemyList[eKey];
            var collision = self.TestCollision(enemy);
            //delete the enemy if so
            if (collision) {
                delete enemyList[eKey];
                delete bulletList[key];
                score += 100;
                //BOOM
                MakeExplosionSound();
            }
        }
        if(toRemove){
            delete bulletList[self.key];
        }
    }
    bulletList[key] = self;
}
//shot a bullet everytime the user left click the mouse 
document.onclick = function (e) {
    player.performAttack();
}
// shot a special attack when the user right click the mouse
document.oncontextmenu = function (e) {
    player.performSpecialAttack();
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
    //deleting the canvas before drawing everything again
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //drawing all the enemies, upgrades and bullets
    for (var key in enemyList) {
        var enemy = enemyList[key];
        enemy.Update();
    }
    for (var key in upgradeList) {
        var upgrade = upgradeList[key];
        upgrade.Update();
    }
    for (var key in bulletList) {
        var bullet = bulletList[key];
        bullet.Update();
    }

    //updating the position of the player
    player.Update();
    //drawing hp and score
    ctx.fillText(player.hp + "HP", 0, 30);
    ctx.fillText("Score: " + score, 150, 30);
    ctx.fillText("Reload: ", 350, 30);
    ctx.strokeRect(460, 11,100, 20);
    barToDraw = (player.atkCounter / atkCounterConst) * 100;
    barToDraw = barToDraw >= 100 ? 100 : barToDraw;
    ctx.fillRect(460, 11, barToDraw, 20);
}
//reset all the variables after the user lost
StartNewGame = function () {
    player.hp = 10;
    player.atkSpeed = 1;
    player.immune = false;
    player.immuneFrames = 0;
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
    var category;
    if (Math.random() > 0.1) {
        category = 0;
        color = 'orange';
        var width = 10;
        var height = 10;
    }
    else {
        category = 1;
        color = 'blue';
        width = 5;
        height = 5;
    }
    Upgrade(x, y, xs, ys, key, width, height, color, category);
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
    player = Player();
}
    