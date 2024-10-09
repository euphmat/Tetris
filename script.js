const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const retryBtn = document.getElementById('retry-btn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let board = createBoard();
let currentPiece = null;
let gameLoop = null;

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
];

const COLORS = ['cyan', 'yellow', 'purple', 'blue', 'orange', 'green', 'red'];

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    return {
        shape,
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

function drawPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = currentPiece.color;
                ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function moveDown() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        merge();
        removeRows();
        currentPiece = createPiece();
        if (collision()) {
            gameOver();
        }
    }
}

function moveLeft() {
    currentPiece.x--;
    if (collision()) {
        currentPiece.x++;
    }
}

function moveRight() {
    currentPiece.x++;
    if (collision()) {
        currentPiece.x--;
    }
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    const previousShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collision()) {
        currentPiece.shape = previousShape;
    }
}

function collision() {
    return currentPiece.shape.some((row, dy) =>
        row.some((value, dx) =>
            value &&
            (currentPiece.y + dy >= ROWS ||
             currentPiece.x + dx < 0 ||
             currentPiece.x + dx >= COLS ||
             board[currentPiece.y + dy][currentPiece.x + dx])
        )
    );
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = COLORS.indexOf(currentPiece.color) + 1;
            }
        });
    });
}

function removeRows() {
    let rowsToRemove = [];
    board.forEach((row, y) => {
        if (row.every(value => value !== 0)) {
            rowsToRemove.push(y);
        }
    });
    rowsToRemove.forEach(y => {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
    });
}

function gameOver() {
    clearInterval(gameLoop);
    gameOverScreen.classList.remove('hidden');
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece();
}

function startGame() {
    board = createBoard();
    currentPiece = createPiece();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameLoop = setInterval(() => {
        moveDown();
        update();
    }, 500);
}

document.getElementById('left-btn').addEventListener('click', () => {
    moveLeft();
    update();
});

document.getElementById('right-btn').addEventListener('click', () => {
    moveRight();
    update();
});

document.getElementById('down-btn').addEventListener('click', () => {
    moveDown();
    update();
});

document.getElementById('rotate-btn').addEventListener('click', () => {
    rotate();
    update();
});

// タッチデバイス対応のイベントリスナーを追加
function addTouchStartListener(element, callback) {
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        callback();
    });
    element.addEventListener('click', callback);
}

addTouchStartListener(startScreen, startGame);
addTouchStartListener(retryBtn, startGame);

// ダブルタップによるズームを防止
document.addEventListener('touchend', (e) => {
    e.preventDefault();
}, { passive: false });

// 初期表示
update();