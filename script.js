const VERSION = 'v0.04 ドラえもん削除';

const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');

const ROWS = 20;
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
const GAME_SPEED = 500;

const doraemonImg = document.getElementById('doraemon');

function createPiece() {
    if (Math.random() < 0.9) {  // 30% の確率でドラえもんを生成
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
                } else {
                    ctx.fillStyle = COLORS[value - 1];
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
                board[currentPosition.y + y][currentPosition.x + x] = currentPiece.color === 'doraemon' ? 'doraemon' : COLORS.indexOf(currentPiece.color) + 1;
            }
        });
    });
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
            if (board[y][x] === 0) continue outer;
        }
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
    }
    return linesCleared;
}

function rotate(piece) {
    let newShape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i])).reverse();
    return { shape: newShape, color: piece.color };
}

function update() {
    if (!isValidMove(currentPiece, {x: currentPosition.x, y: currentPosition.y + 1})) {
        merge();
        clearLines();
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
    let rotated = rotate(currentPiece);
    if (isValidMove(rotated, currentPosition)) {
        currentPiece = rotated;
        draw();
    }
});

window.onload = function() {
    document.getElementById('version').textContent = VERSION;
    startGame();
};