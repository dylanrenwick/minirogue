const title = 'MiniRogue', version = 'v0.0.1';
const charMap = {
    wall: '#', player: '@', empty: ' ', door: '%',
    uicorner: '+', uivert: '|', uihori: '-'
};
const colorMap = {
    wall: '#888', door: '#b58451'
};
const screenWidth = 99, screenHeight = 34;
var screen = [];
for (let y = 0; y < screenHeight; y++) {
    screen[y] = [];
    for (let x = 0; x < screenWidth; x++) {
        screen[y][x] = charMap.empty;
    }
}
var rooms = [];

var player = {
    position: [0, 0],
    health: 0, maxHealth: 10,
    atk: 1, def: 0
};

const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

function updateScreen() {
    document.getElementById('canv').innerHTML = screen.map(r => r.join('')).join('\n');
}

function drawChar(x, y, c, color) {
    if (x >= screenWidth || y >= screenHeight || x < 0 || y < 0) return;
    let colorTag = '', colorEnd = '';
    if (color !== undefined) {
        colorTag = '<span style="color: ' + color + '">';
        colorEnd = '</span>';
    }
    try {
        screen[y][x] = colorTag + c + colorEnd;
    } catch (e) {
        console.log(`{x: ${x}, y: ${y}}`);
        throw e;
    }
}
function drawChars(coords, c, color) {
    for (let i = 0; i < coords.length - (coords.length % 2); i += 2) {
        drawChar(coords[i], coords[i + 1], c, color);
    }
}
function drawGameChar(x, y, key) {
    let char = charMap[key];
    let color = colorMap[key];
    drawChar(x, y, char, color);
}
function drawText(x, x2, y, t, align = 0, color) {
    let areaWidth = x2 - x;
    let textWidth = t.length;

    switch(align) {
        case 1:
            x = areaWidth / 2 - textWidth / 2;
            break;
        case 2:
            x = areaWidth - textWidth
            break;
    }

    for (let i = 0; i < t.length; i++) {
        drawChar(x + i, y, t[i], color);
    }
}
function drawHLine(x, x2, y, c, color) {
    drawText(x, x2, y, c.repeat(x2 - x), 0, color);
}
function drawGameHLine(x, x2, y, key) {
    let char = charMap[key];
    let color = colorMap[key];
    drawHLine(x, x2, y, char, color);
}
function drawVLine(x, y, y2, c, color) {
    for (let i = y; i < y2; i++) {
        drawChar(x, i, c, color);
    }
}
function drawGameVLine(x, y, y2, key) {
    let char = charMap[key];
    let color = colorMap[key];
    drawVLine(x, y, y2, char, color);
}
function drawBox(x, y, w, h, corner, vert, hori, color) {
    if (vert === undefined) {
        vert = corner;
        hori = corner;
    } else if (hori === undefined) {
        hori = vert;
    }
    drawChars([x, y, x + w, y, x, y + h, x + w, y + h], corner, color);
    drawHLine(x + 1, x + w, y, hori, color);
    drawHLine(x + 1, x + w, y + h, hori, color);
    drawVLine(x, y + 1, y + h, vert, color);
    drawVLine(x + w, y + 1, y + h, vert, color);
}
function drawGameBox(x, y, w, h, key) {
    let char = charMap[key];
    let color = colorMap[key];
    drawBox(x, y, w, h, char, undefined, undefined, color)
}
function fillRect(x, y, w, h, c) {
    for (let i = y; i < y + h; i++) {
        drawHLine(x, x + w, i, c);
    }
}
function fillBox(x, y, w, h, fill, corner, vert, hori) {
    fillRect(x, y, w, h, fill);
    drawBox(x, y, w, h, corner, vert, hori);
}

function generateRoom(previousRoom) {
    let newRoom = {
        position: [0, 0],
        size: [0, 0],
        entrance: null,
        exit: [null, null],
        previous: null,
        realPos: () => {
            let prevRealPos = newRoom.previous ? newRoom.previous.realPos() : [0, 0];
            return newRoom.position.map((p, i) => p + prevRealPos[i]);
        },
        realDoorPos: () => {
            let realPos = newRoom.realPos();
            return [
                (newRoom.exit[0] % 2 === 0
                    ? realPos[0] + (newRoom.exit[0] > 1 ? newRoom.size[0] : 0)
                    : realPos[0] + newRoom.exit[1] + 1),
                (newRoom.exit[0] % 2 === 1
                    ? realPos[1] + (newRoom.exit[0] > 1 ? newRoom.size[1] : 0)
                    : realPos[1] + newRoom.exit[1] + 1)
            ]
        }
    };

    if (previousRoom) {
        newRoom.previous = previousRoom;
        let entranceDirection = (previousRoom.exit[0]+2) % 4;
        newRoom.entrance = [entranceDirection, rand(1, newRoom.size[1 - (entranceDirection % 2)] - 1)];
    }

    let height = rand(5, 15);
    let width = Math.floor(height * (2 + Math.random() * 2));
    newRoom.size = [
        width, height
    ];

    let exitDirection = rand(0, 3);
    if (previousRoom && exitDirection >= newRoom.entrance) exitDirection++;
    newRoom.exit = [exitDirection, rand(1, newRoom.size[1 - (exitDirection % 2)] - 1)];

    if (previousRoom) {
        let corridorLength = rand(2, 8);
        if (newRoom.entrance[0] % 2 === 0) {
            let posMin = -newRoom.size[1] + 1;
            let posMax = previousRoom.size[1] - 1;
            let xPos = newRoom.entrance === 0 ? corridorLength + previousRoom.size[0] : -corridorLength - newRoom.size[0];
            newRoom.position = [xPos, rand(posMin, posMax)];
        } else {
            let posMin = -newRoom.size[0] + 1;
            let posMax = previousRoom.size[0] - 1;
            let yPos = newRoom.entrance === 3 ? corridorLength + previousRoom.size[1] : -corridorLength - newRoom.size[1];
            newRoom.position = [rand(posMin, posMax), yPos];
        }
    } else {
        newRoom.position = newRoom.size.map(p => -Math.floor(p / 2));
    }

    return newRoom;
}

function drawUI() {
    fillBox(0, 0, screenWidth - 1, 4, charMap.empty, charMap.uicorner, charMap.uivert, charMap.uihori);
    drawBox(0, 4, screenWidth - 1, screenHeight - 8, charMap.uicorner, charMap.uivert, charMap.uihori);
    fillBox(0, screenHeight - 4, screenWidth - 1, 3, charMap.empty, charMap.uicorner, charMap.uivert, charMap.uihori);

    drawText(0, screenWidth, 2, title, 1);
    drawText(1, screenWidth - 1, 3, version, 2);
    drawText(2, 6, screenHeight - 3, `HP: `);
    let hpAmt = player.health / player.maxHealth;
    let hpColor = "#0f0";
    if (hpAmt < 0.25) hpColor = "#f00";
    else if (hpAmt < 0.6) hpColor = "#f80";
    drawText(6, 12, screenHeight - 3, `${player.health}/${player.maxHealth}`, 0, hpColor)
    drawText(screenWidth - 10, screenWidth - 1, screenHeight - 3, `ATK: ${player.atk}`);
    drawText(screenWidth - 10, screenWidth - 1, screenHeight - 2, `DEF: ${player.def}`);
}

function drawMap() {
    let mapOffset = [1, 5];
    let mapWidth = screenWidth - 2;
    let mapHeight = screenHeight - 9;

    fillRect(mapOffset[0], mapOffset[1], mapWidth, mapHeight, charMap.empty);

    let playerScreenPos = [mapOffset[0] + Math.floor(mapWidth / 2), mapOffset[1] + Math.floor(mapHeight / 2)];

    for (let i = 0; i < rooms.length; i++) {
        drawGameBox(
            playerScreenPos[0] + rooms[i].position[0] - player.position[0],
            playerScreenPos[1] + rooms[i].position[1] - player.position[1],
            rooms[i].size[0], rooms[i].size[1], 'wall');
        let doorPos = rooms[i].realDoorPos();
        drawGameChar(
            playerScreenPos[0] + doorPos[0] - player.position[0],
            playerScreenPos[1] + doorPos[1] - player.position[1],
            'door'
        );
    }

    drawGameChar(playerScreenPos[0], playerScreenPos[1], 'player');
}

function checkCollision(pos) {
    for (let i = 0; i < rooms.length; i++) {
        let r = rooms[i];
        let roomPos = r.realPos();
        let doorPos = r.realDoorPos();
        if (pos[0] === doorPos[0] && pos[1] === doorPos[1]) continue;
        if ((pos[0] === roomPos[0] || pos[0] === roomPos[0] + r.size[0]) && pos[1] >= roomPos[1] && pos[1] < roomPos[1] + r.size[1]) return true;
        if ((pos[1] === roomPos[1] || pos[1] === roomPos[1] + r.size[1]) && pos[0] >= roomPos[0] && pos[0] < roomPos[0] + r.size[0]) return true;
    }
}

function onKeyDown(e) {
    let keyString = e.key || e.code;
    if (!keyString) return;
    keyString = keyString.toLowerCase();
    let redraw = false;
    if (keyString === "arrowleft" || keyString === "a") {
        if (!checkCollision([player.position[0]-1, player.position[1]])) {
            player.position[0]--;
            redraw = true;
        }
    } else if (keyString === "arrowright" || keyString === "d") {
        if (!checkCollision([player.position[0]+1, player.position[1]])) {
            player.position[0]++;
            redraw = true;
        }
    } else if (keyString === "arrowup" || keyString === "w") {
        if (!checkCollision([player.position[0], player.position[1]-1])) {
            player.position[1]--;
            redraw = true;
        }
    } else if (keyString === "arrowdown" || keyString === "s") {
        if (!checkCollision([player.position[0], player.position[1]+1])) {
            player.position[1]++;
            redraw = true;
        }
    }

    if (redraw) {
        updateGame();
        drawGame();
    }
}

function drawGame() {
    drawMap();
    drawUI();
    updateScreen();
}

function updateGame() {
    if (rooms.length === 1) {
        let doorPos = rooms[0].realDoorPos();
        if (player.position[0] === doorPos[0] && player.position[1] === doorPos[1]) {
            rooms.push(generateRoom(rooms[0]));
        }
    }
}

document.body.addEventListener('keydown', onKeyDown);

/* Generate map */
rooms.push(generateRoom());

player.health = player.maxHealth;
drawGame();