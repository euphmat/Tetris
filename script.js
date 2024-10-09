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
                ctx.strokeStyle = 'black';
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
        color: shapeIndex + 1,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

function drawPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[currentPiece.color - 1];
                ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'black';
                ctx.strokeRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function moveDown() {
    currentPiece.y++;
    if (collision()) {
        currentPiece.y--;
        mergePiece();
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
    const prevShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collision()) {
        currentPiece.shape = prevShape;
    }
}

function collision() {
    return currentPiece.shape.some((row, dy) =>
        row.some((value, dx) =>
            value && (
                currentPiece.y + dy >= ROWS ||
                currentPiece.x + dx < 0 ||
                currentPiece.x + dx >= COLS ||
                board[currentPiece.y + dy][currentPiece.x + dx]
            )
        )
    );
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        });
    });
}

function removeRows() {
    const newBoard = board.filter(row => row.some(cell => !cell));
    const removedRows = ROWS - newBoard.length;
    const newRows = Array.from({ length: removedRows }, () => Array(COLS).fill(0));
    board = [...newRows, ...newBoard];
}

function gameOver() {
    clearInterval(gameLoop);
    gameOverScreen.style.display = 'flex';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece();
}

function gameStart() {
    board = createBoard();
    currentPiece = createPiece();
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameLoop = setInterval(() => {
        moveDown();
        draw();
    }, 500);
}

document.getElementById('left-btn').addEventListener('click', () => {
    moveLeft();
    draw();
});

document.getElementById('right-btn').addEventListener('click', () => {
    moveRight();
    draw();
});

document.getElementById('down-btn').addEventListener('click', () => {
    moveDown();
    draw();
});

document.getElementById('rotate-btn').addEventListener('click', () => {
    rotate();
    draw();
});

startScreen.addEventListener('click', gameStart);
retryBtn.addEventListener('click', gameStart);

// 初期画面表示
startScreen.style.display = 'flex';
gameOverScreen.style.display = 'none';