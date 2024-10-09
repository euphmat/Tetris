const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const retryBtn = document.getElementById('retry-btn');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

const SHAPES = [
    [],
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
    [[4, 4], [4, 4]],
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
];

const COLORS = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

let board = createBoard();
let piece = null;
let dropCounter = 0;
let lastTime = 0;
let gameActive = false;

function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x, y, 1, 1);
            }
        });
    });
}

function drawPiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + piece.pos.x, y + piece.pos.y, 1, 1);
            }
        });
    });
}

function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
        pos: {x: Math.floor(COLS / 2) - 1, y: 0},
        shape: SHAPES[shapeIndex]
    };
}

function collide() {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0 &&
                (board[y + piece.pos.y] &&
                board[y + piece.pos.y][x + piece.pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

function rotate() {
    const rotated = piece.shape[0].map((_, index) =>
        piece.shape.map(row => row[index])
    ).reverse();
    const prevShape = piece.shape;
    piece.shape = rotated;
    if (collide()) {
        piece.shape = prevShape;
    }
}

function moveLeft() {
    piece.pos.x--;
    if (collide()) {
        piece.pos.x++;
    }
}

function moveRight() {
    piece.pos.x++;
    if (collide()) {
        piece.pos.x--;
    }
}

function moveDown() {
    piece.pos.y++;
    if (collide()) {
        piece.pos.y--;
        merge();
        piece = createPiece();
        if (collide()) {
            gameOver();
        }
    }
    dropCounter = 0;
}

function clearLines() {
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
    }
}

function gameOver() {
    gameActive = false;
    overlay.style.display = 'flex';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'block';
}

function update(time = 0) {
    if (!gameActive) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > 1000) {
        moveDown();
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBoard();
    drawPiece();
    clearLines();

    requestAnimationFrame(update);
}

function startGame() {
    gameActive = true;
    board = createBoard();
    piece = createPiece();
    overlay.style.display = 'none';
    update();
}

overlay.addEventListener('click', () => {
    if (!gameActive) {
        startGame();
    }
});

retryBtn.addEventListener('click', startGame);

document.getElementById('left-btn').addEventListener('click', moveLeft);
document.getElementById('right-btn').addEventListener('click', moveRight);
document.getElementById('down-btn').addEventListener('click', moveDown);
document.getElementById('rotate-btn').addEventListener('click', rotate);

// キーボード操作のサポート
document.addEventListener('keydown', event => {
    if (!gameActive) return;

    switch (event.keyCode) {
        case 37: // 左矢印
            moveLeft();
            break;
        case 39: // 右矢印
            moveRight();
            break;
        case 40: // 下矢印
            moveDown();
            break;
        case 38: // 上矢印
            rotate();
            break;
    }
});

// ダブルタップによるズームを防ぐ
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);