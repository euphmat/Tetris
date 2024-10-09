const VERSION = 'v0.10 回転ロジック修正';

const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');

const ROWS = 18; // 20から18に減らしました
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
];

const COLORS = [
    '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF',
    '#FF8E0D', '#FFE138', '#3877FF'
];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentPosition = {x: 0, y: 0};
let gameInterval = null;
const GAME_SPEED = 300;

const doraemonImg = document.getElementById('doraemon');

function createPiece() {
    const random = Math.random();
    if (random < 0.05) {  // 5% の確率で爆弾を生成
        return { shape: [[1]], color: 'bomb' };
    } else if (random < 0.13) {  // 8% の確率でダイヤモンドを生成
        return { shape: [[1]], color: 'diamond' };
    } else if (random < 0.18) {  // 5% の確率でドラえもんを生成
        return { shape: [[1]], color: 'doraemon' };
    }
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const color = COLORS[shapeIndex];
    const shape = SHAPES[shapeIndex];
    return { shape, color };
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                if (value === 'doraemon') {
                    ctx.drawImage(doraemonImg, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                } else if (value === 'bomb') {
                    ctx.font = `${BLOCK_SIZE}px Arial`;
                    ctx.fillText('💣', x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
                } else if (value === 'diamond') {
                    ctx.font = `${BLOCK_SIZE}px Arial`;
                    ctx.fillText('💎', x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
                } else {
                    ctx.fillStyle = value;
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        });
    });
}

function drawPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                if (currentPiece.color === 'doraemon') {
                    ctx.drawImage(doraemonImg, (currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                } else if (currentPiece.color === 'bomb') {
                    ctx.font = `${BLOCK_SIZE}px Arial`;
                    ctx.fillText('💣', (currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y + 1) * BLOCK_SIZE);
                } else if (currentPiece.color === 'diamond') {
                    ctx.font = `${BLOCK_SIZE}px Arial`;
                    ctx.fillText('💎', (currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y + 1) * BLOCK_SIZE);
                } else {
                    ctx.fillStyle = currentPiece.color;
                    ctx.fillRect((currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect((currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        });
    });
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                if (currentPiece.color === 'bomb') {
                    explodeBomb(currentPosition.x + x, currentPosition.y + y);
                } else {
                    board[currentPosition.y + y][currentPosition.x + x] = currentPiece.color;
                }
            }
        });
    });
}

function explodeBomb(bombX, bombY) {
    animateExplosion(bombX, bombY);
}

function animateExplosion(bombX, bombY) {
    const explosionFrames = ['💥', '🔥', '💨', '✨'];
    let frameIndex = 0;

    function drawExplosionFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();

        ctx.font = `${BLOCK_SIZE}px Arial`;
        ctx.fillText(explosionFrames[frameIndex], bombX * BLOCK_SIZE, (bombY + 1) * BLOCK_SIZE);

        frameIndex++;

        if (frameIndex < explosionFrames.length) {
            setTimeout(drawExplosionFrame, 100);
        } else {
            for (let y = bombY - 1; y <= bombY + 1; y++) {
                for (let x = bombX - 1; x <= bombX + 1; x++) {
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                        board[y][x] = 0;
                    }
                }
            }
            draw();
        }
    }

    drawExplosionFrame();
}

function isValidMove(piece, position) {
    return piece.shape.every((row, y) => {
        return row.every((value, x) => {
            let newX = position.x + x;
            let newY = position.y + y;
            return (
                value === 0 ||
                (newX >= 0 && newX < COLS && newY < ROWS && board[newY] && board[newY][newX] === 0)
            );
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0 || board[y][x] === 'diamond') continue outer;
        }
        const newRow = Array(COLS).fill(0);
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 'diamond') {
                newRow[x] = 'diamond';
            }
        }
        board.splice(y, 1);
        board.unshift(newRow);
        linesCleared++;
        y++;
    }
    return linesCleared;
}

function rotate(piece) {
    if (piece.shape.length === 1 && piece.shape[0].length === 4) {
        return {
            shape: [[1], [1], [1], [1]],
            color: piece.color
        };
    } else if (piece.shape.length === 4 && piece.shape[0].length === 1) {
        return {
            shape: [[1, 1, 1, 1]],
            color: piece.color
        };
    }
    let newShape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i])).reverse();
    return { shape: newShape, color: piece.color };
}

function tryRotate() {
    let rotated = rotate(currentPiece);
    let kick = 0;
    let maxKick = currentPiece.shape[0].length === 4 || currentPiece.shape.length === 4 ? 3 : 2;

    if (isValidMove(rotated, currentPosition)) {
        currentPiece = rotated;
        return;
    }

    for (kick = 1; kick <= maxKick; kick++) {
        if (isValidMove(rotated, {x: currentPosition.x - kick, y: currentPosition.y})) {
            currentPiece = rotated;
            currentPosition.x -= kick;
            return;
        }
        if (isValidMove(rotated, {x: currentPosition.x + kick, y: currentPosition.y})) {
            currentPiece = rotated;
            currentPosition.x += kick;
            return;
        }
    }

    if (maxKick === 3) {
        if (isValidMove(rotated, {x: currentPosition.x, y: currentPosition.y - 1})) {
            currentPiece = rotated;
            currentPosition.y -= 1;
            return;
        }
        if (isValidMove(rotated, {x: currentPosition.x, y: currentPosition.y - 2})) {
            currentPiece = rotated;
            currentPosition.y -= 2;
            return;
        }
    }
}

function update() {
    if (!isValidMove(currentPiece, {x: currentPosition.x, y: currentPosition.y + 1})) {
        merge();
        if (currentPiece.color !== 'bomb') {
            clearLines();
        }
        currentPiece = createPiece();
        currentPosition = {x: Math.floor(COLS / 2) - 1, y: 0};
        if (!isValidMove(currentPiece, currentPosition)) {
            alert('Game Over!');
            board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
            startGame();
        }
    } else {
        currentPosition.y++;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece();
}

function gameLoop() {
    update();
    draw();
}

function startGame() {
    currentPiece = createPiece();
    currentPosition = {x: Math.floor(COLS / 2) - 1, y: 0};
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, GAME_SPEED);
}

document.getElementById('left-btn').addEventListener('click', () => {
    if (isValidMove(currentPiece, {x: currentPosition.x - 1, y: currentPosition.y})) {
        currentPosition.x--;
        draw();
    }
});

document.getElementById('right-btn').addEventListener('click', () => {
    if (isValidMove(currentPiece, {x: currentPosition.x + 1, y: currentPosition.y})) {
        currentPosition.x++;
        draw();
    }
});

document.getElementById('down-btn').addEventListener('click', () => {
    if (isValidMove(currentPiece, {x: currentPosition.x, y: currentPosition.y + 1})) {
        currentPosition.y++;
        draw();
    }
});

document.getElementById('rotate-btn').addEventListener('click', () => {
    tryRotate();
    draw();
});

window.onload = function() {
    document.getElementById('version').textContent = VERSION;
    startGame();
};