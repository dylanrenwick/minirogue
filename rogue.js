const title = 'MiniRogue', version = 'v0.0.3';
const charMap = {
    wall: '#', player: '@', empty: ' ', enemy: '&',
    door: '%', lockedDoor: '%', item: '$',
    uicorner: '+', uivert: '|', uihori: '-'
};
const colorMap = {
    wall: '#888', door: '#b58451', lockedDoor: '#c00',
    item: '#fd0', enemy: '#f00'
};
const entityWeights = [
    { type: 0, key: 'item', weight: 2 },
    { type: 1, key: 'enemy', weight: 3}
];
const screenWidth = 99, screenHeight = 34;
var screen = [];
for (let y = 0; y < screenHeight; y++) {
    screen[y] = [];
    for (let x = 0; x < screenWidth; x++) {
        screen[y][x] = charMap.empty;
    }
}
var rooms = [];
var entities = [];

var player = {
    position: [0, 0],
    screenPos: [1 + Math.floor((screenWidth - 2) / 2), 5 + Math.floor((screenHeight - 9) / 2)],
    health: 0, maxHealth: 10,
    atk: 1, def: 0
};
var tooltip = "";

const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);
const randInRect = (pos, size) => [rand(pos[0] + 1, pos[0] + size[0] - 1), rand(pos[1] + 1, pos[1] + size[1] - 1)];
const updateScreen = () => document.getElementById('canv').innerHTML = screen.map(r => r.join('')).join('\n');

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
    drawChar(x, y, charMap[key], colorMap[key]);
}
function drawText(x, x2, y, t, align = 0, color) {
    let areaWidth = x2 - x;
    let textWidth = t.length;

    switch(align) {
        case 1:
            x += Math.floor(areaWidth / 2 - textWidth / 2);
            break;
        case 2:
            x += areaWidth - textWidth
            break;
    }

    for (let i = 0; i < t.length; i++) {
        drawChar(x + i, y, t[i], color);
    }
}
function drawHLine(x, x2, y, c, color) {
    drawText(Math.min(x, x2), Math.max(x, x2), y, c.repeat(Math.abs(x2 - x)), 0, color);
}
function drawGameHLine(x, x2, y, key) {
    drawHLine(x, x2, y, charMap[key], colorMap[key]);
}
function drawVLine(x, y, y2, c, color) {
    for (let i = Math.min(y, y2); i < Math.max(y, y2); i++) {
        drawChar(x, i, c, color);
    }
}
function drawGameVLine(x, y, y2, key) {
    drawVLine(x, y, y2, charMap[key], colorMap[key]);
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
    drawBox(x, y, w, h, charMap[key], undefined, undefined, colorMap[key])
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
        previous: null
    };
    let height = rand(5, 15);
    let width = Math.floor(height * (2 + Math.random() * 2));
    newRoom.size = [width, height];
    if (previousRoom) {
        newRoom.previous = previousRoom;
        let entranceDirection = (previousRoom.exit[0] + 2) % 4;
        let corridorLength = rand(2, 8);
        let prevDoorPos = previousRoom.exit[1];
        if (entranceDirection % 2 === 0) {
            let posMin = -newRoom.size[1] + prevDoorPos + 2;
            let posMax = prevDoorPos - 1;
            let xPos = entranceDirection === 0 ? corridorLength + previousRoom.size[0] : -corridorLength - newRoom.size[0];
            newRoom.position = [xPos, rand(posMin, posMax)];
        } else {
            let posMin = -newRoom.size[0] + prevDoorPos + 2;
            let posMax = prevDoorPos - 1;
            let yPos = entranceDirection === 1 ? corridorLength + previousRoom.size[1] : -corridorLength - newRoom.size[1];
            newRoom.position = [rand(posMin, posMax), yPos];
        }
        newRoom.realPos = newRoom.position.map((p, i) => p + previousRoom.realPos[i]);
        newRoom.entrance = [entranceDirection, -(newRoom.position[1 - (entranceDirection % 2)] - prevDoorPos)];
        newRoom.realEntrancePos = [
            (newRoom.entrance[0] % 2 === 0
                ? newRoom.realPos[0] + (newRoom.entrance[0] > 1 ? newRoom.size[0] : 0)
                : newRoom.realPos[0] + newRoom.entrance[1] + 1),
            (newRoom.entrance[0] % 2 === 1
                ? newRoom.realPos[1] + (newRoom.entrance[0] > 1 ? newRoom.size[1] : 0)
                : newRoom.realPos[1] + newRoom.entrance[1] + 1)
        ]
        let features = Math.max(rand(0, 2) * (1 + Math.floor((newRoom.size[0] * newRoom.size[1] / 250) ** 2)), 1);
        for (let i = 0; i < features; i++) {
            let entity = {
                position: randInRect(newRoom.realPos, newRoom.size),
                update: null,
                charKey: 'empty',
                room: newRoom,
                type: null
            };
            let weightTotals = entityWeights.map(e => e.weight).reduce((a, b) => a + b, 0);
            let generatedWeight = rand(0, weightTotals) + 1;
            for (let i = 0, runningTotal = 0; i < entityWeights.length; i++) {
                if (runningTotal + generatedWeight <= entityWeights[i].weight) {
                    entity.type = entityWeights[i].type;
                    entity.charKey = entityWeights[i].key;
                    break;
                }
                runningTotal += entityWeights[i].weight;
            }
            entities.push(entity);
        }
    } else {
        newRoom.position = newRoom.size.map(p => -Math.floor(p / 2));
        newRoom.realPos = newRoom.position;
    }
    let exitDirection = rand(0, 3);
    if (previousRoom && exitDirection >= newRoom.entrance[0]) exitDirection = (exitDirection + 1) % 4;
    newRoom.exit = [exitDirection, rand(1, newRoom.size[1 - (exitDirection % 2)] - 1)];
    newRoom.realExitPos = [
        (newRoom.exit[0] % 2 === 0
            ? newRoom.realPos[0] + (newRoom.exit[0] > 1 ? newRoom.size[0] : 0)
            : newRoom.realPos[0] + newRoom.exit[1] + 1),
        (newRoom.exit[0] % 2 === 1
            ? newRoom.realPos[1] + (newRoom.exit[0] > 1 ? newRoom.size[1] : 0)
            : newRoom.realPos[1] + newRoom.exit[1] + 1)
    ];
    return newRoom;
}

function draw() {
    fillRect(1, 5, screenWidth - 2, screenHeight - 9, charMap.empty);
    let firstRoom = rooms.length > 1 ? rooms.length - 2 : 0;
    for (let i = firstRoom; i < rooms.length; i++) {
        let realRoomPos = rooms[i].realPos.map((p, i) => player.screenPos[i] + p - player.position[i]);;
        drawGameBox(
            realRoomPos[0], realRoomPos[1],
            rooms[i].size[0], rooms[i].size[1], 'wall');
        let entrancePos = rooms[i].realEntrancePos;
        if (entrancePos) {
            entrancePos = entrancePos.map((p, i) => player.screenPos[i] + p - player.position[i]);;
            drawGameChar(
                entrancePos[0], entrancePos[1],
                i === rooms.length - 1 ? 'empty' : 'lockedDoor'
            );
            if (i === rooms.length - 1 && i > 0) {
                let corridorStart = rooms[i - 1].realExitPos.map((p, i) => player.screenPos[i] + p - player.position[i]);;
                let corridorEnd = entrancePos;
                let horizontal = corridorStart[1] === corridorEnd[1];
                if (horizontal) {
                    drawGameHLine(corridorStart[0], corridorEnd[0], corridorStart[1] - 1, 'wall');
                    drawGameHLine(corridorStart[0], corridorEnd[0], corridorStart[1] + 1, 'wall');
                } else {
                    drawGameVLine(corridorStart[0] - 1, corridorStart[1], corridorEnd[1], 'wall');
                    drawGameVLine(corridorStart[0] + 1, corridorStart[1], corridorEnd[1], 'wall');
                }
            }
        }
        let exitPos = rooms[i].realExitPos.map((p, i) => player.screenPos[i] + p - player.position[i]);;
        drawGameChar(
            exitPos[0], exitPos[1],
            i === rooms.length - 1 ? 'door' : 'empty'
        );
    }
    
    let playerScreenPos = [1 + Math.floor((screenWidth - 2) / 2), 5 + Math.floor((screenHeight - 9) / 2)];
    drawGameChar(playerScreenPos[0], playerScreenPos[1], 'player');
    for (let i = 0; i < entities.length; i++) {
        let entityPos = entities[i].position.map((p, i) => player.screenPos[i] + p - player.position[i]);;
        drawGameChar(entityPos[0], entityPos[1], entities[i].charKey);
    }

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

    if (tooltip.length > 0) {
        fillBox(4, screenHeight - 9, screenWidth - 8, 4, charMap.empty, charMap.uicorner, charMap.uivert, charMap.uihori);
        let lines = tooltip.split('\n');
        for (let i = 0; i < lines.length; i++) {
            drawText(5, screenWidth - 5, screenHeight + (lines.length === 1 ? -7 : -8 + i), lines[i].trim(), 1);
        }
        tooltip = "";
    }

    updateScreen();
}

function checkCollision(pos, blockDoors = false) {
    let firstRoom = rooms.length > 1 ? rooms.length - 2 : 0;
    for (let i = firstRoom; i < rooms.length; i++) {
        let r = rooms[i];
        let roomPos = r.realPos;
        if (!blockDoors) {
            let exitPos = r.realExitPos;
            if (pos[0] === exitPos[0] && pos[1] === exitPos[1]) continue;
            let entrancePos = r.realEntrancePos;
            if (entrancePos && pos[0] === entrancePos[0] && pos[1] === entrancePos[1]) continue;
        }
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
        draw();
    }
}

function updateGame() {
    let doorPos = rooms[rooms.length - 1].realExitPos;
    if (player.position[0] === doorPos[0] && player.position[1] === doorPos[1]) {
        rooms.push(generateRoom(rooms[rooms.length - 1]));
        player.currentRoom++;
    }

    entities = entities.filter(e => rooms.indexOf(e.room) !== -1 && rooms.indexOf(e.room) >= rooms.length - 2);
    for (let i = 0; i < entities.length; i++) {
        switch (entities[i].type) {
            case 0:
                if (player.position[0] === entities[i].position[0] && player.position[1] === entities[i].position[1]) {
                    // TODO: Pickup item
                }
                break;
            case 1:
                if (entities[i].direction === undefined) entities[i].direction = rand(0, 4);
                let newPos = [entities[i].position[0], entities[i].position[1]];
                newPos[entities[i].direction % 2] += Math.floor(entities[i].direction / 2) * 2 - 1;
                if (!checkCollision(newPos, true)) {
                    console.log(`moving ${entities[i].position} in direction ${entities[i].direction}`);
                    entities[i].position = newPos;
                } else {
                    console.log(`switching direction`);
                    entities[i].direction = (entities[i].direction + 2) % 4;
                    console.log(`moving ${entities[i].position} in direction ${entities[i].direction}`);
                    entities[i].position[entities[i].direction % 2] += Math.floor(entities[i].direction / 2) * 2 - 1;
                }
                break;
        }
    }
}

document.body.addEventListener('keydown', onKeyDown);
rooms.push(generateRoom());
player.health = player.maxHealth;
draw();