
const body = document.getElementsByTagName('body')[0];
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const playerImg = document.getElementById('playerImg');
const ORIGIN_WIDTH = canvas.width;
const ORIGIN_HEIGHT = canvas.height;
let WIDTH_SCALE;
let HEIGHT_SCALE;
let PLAYER_SIZE;
let PLAYER_SPEED;
let ROAD_SIZE;
let ROAD_HEIGHT;
let HIDE_ROAD_SIZE;
let ROAD_MINI_SIZE;
let WALL_SIZE;
let POWER_WIDTH;
let POWER_HEIGHT;
let POWER_SPEED;
let CURRENTY_MOVE_SPEED;
let PLAYER_DOWN_SPEED;
let SHORT_ROAD_RANGE;
let ADD_SPEED;
let ADD_SPEED_RANGE;
let HIDE_RATE = 5;
let NONE_RATE = 1;

let player = { x: canvas.width / 2, y: 0, direct: 'right' }
let roads = [];
let showIndex = 0;
let power = 0;
let jumpOrigin = null;
let jumpTime = 0;
let addPower = false;
let currentY = 0;
let gameOver = true;
let score = 0;

function resize() {
    HEIGHT_SCALE = window.innerHeight / ORIGIN_HEIGHT;
    WIDTH_SCALE = HEIGHT_SCALE;
    canvas.width = ORIGIN_WIDTH * HEIGHT_SCALE;
    canvas.height = window.innerHeight;
    PLAYER_SIZE = 40 * WIDTH_SCALE;
    PLAYER_SPEED = 2.5 * WIDTH_SCALE;
    ROAD_SIZE = 150 * WIDTH_SCALE;
    ROAD_HEIGHT = 10 * HEIGHT_SCALE;
    HIDE_ROAD_SIZE = 75 * WIDTH_SCALE;
    ROAD_MINI_SIZE = 75 * WIDTH_SCALE;
    WALL_SIZE = 20 * WIDTH_SCALE;
    POWER_WIDTH = 100 * WIDTH_SCALE;
    POWER_HEIGHT = 20 * WIDTH_SCALE;
    POWER_SPEED = 3 * WIDTH_SCALE;
    CURRENTY_MOVE_SPEED = 20 * HEIGHT_SCALE;
    PLAYER_DOWN_SPEED = 10 * HEIGHT_SCALE;
    SHORT_ROAD_RANGE = 50 * WIDTH_SCALE;
    ADD_SPEED = 0.5 * WIDTH_SCALE;
    ADD_SPEED_RANGE = 500 * WIDTH_SCALE;
}

function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function paintWall() {
    ctx.fillStyle = 'brown';
    ctx.fillRect(0, 0, WALL_SIZE, canvas.height);
    ctx.fillRect(canvas.width - WALL_SIZE, 0, WALL_SIZE, canvas.height);
}

function paintPower() {
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(WALL_SIZE, 10, POWER_WIDTH, POWER_HEIGHT);
    ctx.fillStyle = 'green';
    ctx.fillRect(WALL_SIZE, 10, power, POWER_HEIGHT);
}

function paintPlayer() {
    if (player.direct == 'right') {
        ctx.drawImage(playerImg, player.x, toPaintY(player.y + PLAYER_SIZE + currentY), PLAYER_SIZE, PLAYER_SIZE);
    } else {
        flipHorizontally(playerImg, player.x, toPaintY(player.y + PLAYER_SIZE + currentY), PLAYER_SIZE, PLAYER_SIZE);
    }
}

function flipHorizontally(img, x, y, size) {
    ctx.translate(x + size, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, size, size);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function paintRoad(road) {
    ctx.fillStyle = road.color;
    ctx.fillRect(road.x, toPaintY(road.y + currentY), road.width, ROAD_HEIGHT);
}

function paintRoads() {
    for (let i = showIndex; i < roads.length; i++) {
        paintRoad(roads[i]);
    }
}

function paintScore() {
    ctx.font = "32px Arial";
    ctx.fillStyle = "green";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("SCORE:" + score, canvas.width - 100, 25);
}

function paintGameOver() {
    if (gameOver) {
        ctx.font = "60px Arial";
        ctx.fillStyle = "red";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "32px Arial";
        ctx.fillText("Space to start", canvas.width / 2, canvas.height / 2 + 50);
    }
}

function init() {
    player = { x: canvas.width / 2, y: 0, direct: 'right' }
    roads = [];
    showIndex = 0;
    power = 0;
    jumpOrigin = null;
    jumpTime = 0;
    addPower = false;
    currentY = 0;
    gameOver = false;
    score = 0;
    generateRoads();
}

function generateRoads() {
    roads = [];
    for (let i = 2; i < 1000; i++) {
        let rand = Math.random() * 10;
        if (rand <= NONE_RATE) {
            continue;
        }
        let hideRoad = rand <= HIDE_RATE;
        let road = {
            x: Math.random() * 100 * WIDTH_SCALE + (200 * WIDTH_SCALE * (i % 2)),
            y: i * 50 * HEIGHT_SCALE,
            index: i,
            width: (hideRoad ? HIDE_ROAD_SIZE : ROAD_SIZE) - parseInt(i / SHORT_ROAD_RANGE) * 10,
            hide: hideRoad,
            color: hideRoad ? 'darkblue' : 'white'
        };
        if (road.width < ROAD_MINI_SIZE) {
            road.width = ROAD_MINI_SIZE;
        }
        roads.push(road);
    }
}

function playerMove() {
    if (jumpOrigin != null) {
        let afterJumpX = jumpOrigin.x + (player.direct == 'right' ? 200 * WIDTH_SCALE : -200 * WIDTH_SCALE) * (jumpOrigin.power) / 100;
        let topJumpX = jumpOrigin.x + (player.direct == 'right' ? 100 * WIDTH_SCALE : -100 * WIDTH_SCALE) * (jumpOrigin.power) / 100;
        if (afterJumpX >= canvas.width - WALL_SIZE - PLAYER_SIZE) {
            afterJumpX = canvas.width - WALL_SIZE - PLAYER_SIZE;
        } else if (afterJumpX <= 0 + WALL_SIZE) {
            afterJumpX = 0 + WALL_SIZE;
        }
        let p = getQuadraticBezierXYatT(jumpOrigin, { x: topJumpX, y: jumpOrigin.y + 500 * HEIGHT_SCALE * (jumpOrigin.power) / 100 },
            { x: afterJumpX, y: jumpOrigin.y }, jumpTime);
        let touchRoad = null;
        if (jumpTime > 0.5) {
            touchRoad = checkTouchRoad(player, p);
        } else {
            if (toPaintY(player.y + currentY) <= 200 * HEIGHT_SCALE) {
                currentY -= CURRENTY_MOVE_SPEED;
                score = parseInt(Math.abs(currentY / 5));
            }
        }
        if (touchRoad != null) {
            player.x = p.x;
            player.y = touchRoad.y;
            jumpOrigin = null;
        } else {
            player.x = p.x;
            player.y = p.y;
            if (jumpTime >= 1) {
                jumpOrigin = null;
            }
        }
    } else {
        let originPlayer = { x: player.x, y: player.y };
        if (player.x >= canvas.width - WALL_SIZE - PLAYER_SIZE) {
            player.direct = 'left';
        } else if (player.x <= 0 + WALL_SIZE) {
            player.direct = 'right';
        }
        if (player.direct == 'right') {
            player.x += PLAYER_SPEED + parseInt(score / ADD_SPEED_RANGE) * ADD_SPEED;
        } else {
            player.x -= PLAYER_SPEED; +parseInt(score / ADD_SPEED_RANGE) * ADD_SPEED;
        }
        let afterPlayer = { x: player.x, y: player.y };
        let touchRoad = checkTouchRoad(originPlayer, afterPlayer);
        if (player.y > 0 && touchRoad == null) {
            player.y -= PLAYER_DOWN_SPEED;
            let touchRoad = checkTouchRoad(originPlayer, player);
            if (touchRoad != null) {
                player.y = touchRoad.y;
            }
            if (player.y < 0) {
                player.y = 0;
            }
        }
        if (touchRoad != null && touchRoad.hide) {
            touchRoad.color = 'blue';
        }
    }
}

function checkTouchRoad(originPoint, p) {
    var touchRoad = null;
    for (let i = showIndex; i < roads.length; i++) {
        let road = roads[i];
        let roadY = road.y;
        if ((p.x > road.x - PLAYER_SIZE && p.x < road.x + road.width) && roadY <= originPoint.y && roadY >= p.y) {
            touchRoad = road;
            break;
        }
        if (road.hide) {
            road.color = 'darkblue';
        }
    };
    return touchRoad;
}

function toPaintY(y) {
    return canvas.height - (y);
}

function getQuadraticBezierXYatT(startPt, controlPt, endPt, T) {
    var x = Math.pow(1 - T, 2) * startPt.x + 2 * (1 - T) * T * controlPt.x + Math.pow(T, 2) * endPt.x;
    var y = Math.pow(1 - T, 2) * startPt.y + 2 * (1 - T) * T * controlPt.y + Math.pow(T, 2) * endPt.y;
    return ({ x: x, y: y });
}


function updateJumpTime() {
    jumpTime += 0.05;
    if (jumpTime <= 1.05) {
        setTimeout(updateJumpTime, 1000 / 60);
    } else {
        jumpTime = 0;
    }
}

function checkPower() {
    if (addPower) {
        power += POWER_SPEED;
        if (power > POWER_WIDTH) {
            power = 0;
        }
    }
}

function draw() {
    cleanCanvas();
    paintPlayer();
    paintRoads();
    paintWall();
    paintPower();
    paintScore();
    paintGameOver();
}

function refresh() {
    updateData();
    draw();
}

function updateData() {
    if (!gameOver) {
        checkPower();
        playerMove();
        checkGameOver();
    }
}

function checkGameOver() {
    if (player.y + currentY < -30 * HEIGHT_SCALE) {
        gameOver = true;
    }
}

function controlPower() {
    if (gameOver) {
        init();
    }
    if (jumpOrigin == null) {
        if (power == 0) {
            power = 30;
        }
        addPower = true;
    }
}

function jump() {
    addPower = false;
    if (jumpOrigin == null && power >= 30) {
        jumpOrigin = { x: player.x, y: player.y, power: power };
        updateJumpTime();
    }
    power = 0;
}

window.addEventListener('resize', function () {
    resize();
    gameOver = true;
})

body.addEventListener('keydown', (evt) => {
    switch (evt.keyCode) {
        case 32:  // space
            controlPower();
            break;
    }
});

body.addEventListener('keyup', (evt) => {
    switch (evt.keyCode) {
        case 32: // space
            jump();
            break;
    }
});
body.addEventListener('touchstart', (evt) => {
    controlPower();
});

body.addEventListener('touchend', (evt) => {
    jump();
});

resize();
setInterval(refresh, 1000 / 60);