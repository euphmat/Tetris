// バージョン情報
const VERSION = 'v0.14';

// キャンバスの設定
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');

// ゲームボードのサイズ設定
const ROWS = 18;
const COLS = 10;
const BLOCK_SIZE = 30;

// キャンバスのサイズを設定
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// テトリミノの形状定義（7種類）
const SHAPES = [
  [[1, 1, 1, 1]],  // I字
  [[1, 1], [1, 1]],  // O字
  [[1, 1, 1], [0, 1, 0]],  // T字
  [[1, 1, 1], [1, 0, 0]],  // L字
  [[1, 1, 1], [0, 0, 1]],  // J字
  [[1, 1, 0], [0, 1, 1]],  // S字
  [[0, 1, 1], [1, 1, 0]]   // Z字
];

// テトリミノの色定義（SHAPESと対応）
const COLORS = [
  '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF',
  '#FF8E0D', '#FFE138', '#3877FF'
];

// ゲームボードの初期化（0で埋める）
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));

// 現在のピースと位置の初期化
let currentPiece = null;
let currentPosition = {x: 0, y: 0};

// ゲームのインターバル設定
let gameInterval = null;
const GAME_SPEED = 500;  // ミリ秒

// ドラえもん画像の取得
const doraemonImg = document.getElementById('doraemon');

// 新しいピースを作成する関数
function createPiece() {
  const random = Math.random();
  // 特殊ピースの生成確率
  if (random < 0.02) {
    return { shape: [[1]], color: 'dynamite' };
  } else if (random < 0.10) {
    return { shape: [[1]], color: 'bomb' };
  } else if (random < 0.08) {
    return { shape: [[1]], color: 'diamond' };
  } else if (random < 0.18) {
    return { shape: [[1]], color: 'doraemon' };
  }
  
  // 通常のテトリミノを生成
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  const color = COLORS[shapeIndex];
  const shape = SHAPES[shapeIndex];
  return { shape, color };
}

// ゲームボードを描画する関数
function drawBoard() {
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawBlock(x, y, value);
      }
    });
  });
}

// 現在のピースを描画する関数
function drawPiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawBlock(currentPosition.x + x, currentPosition.y + y, currentPiece.color);
      }
    });
  });
}

// ブロックを描画する関数
function drawBlock(x, y, value) {
  if (value === 'doraemon') {
    // ドラえもんの画像を描画
    ctx.drawImage(doraemonImg, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  } else if (value === 'bigDoraemon') {
    // 大きなドラえもんの画像を描画
    ctx.drawImage(doraemonImg, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE * 2, BLOCK_SIZE * 2);
  } else if (['bomb', 'diamond', 'dynamite'].includes(value)) {
    // 特殊アイテムの絵文字を描画
    ctx.font = `${BLOCK_SIZE}px Arial`;
    const emoji = value === 'bomb' ? '💣' : value === 'diamond' ? '💎' : '🧨';
    ctx.fillText(emoji, x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
  } else {
    // 通常のブロックを描画
    ctx.fillStyle = value;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }
}

// ピースをボードにマージする関数
function merge() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        if (currentPiece.color === 'bomb') {
          explodeBomb(currentPosition.x + x, currentPosition.y + y);
        } else if (currentPiece.color === 'dynamite') {
          explodeDynamite(currentPosition.x + x, currentPosition.y + y);
        } else {
          board[currentPosition.y + y][currentPosition.x + x] = currentPiece.color;
        }
      }
    });
  });
  checkAndExpandDoraemon();
}

// 爆弾の爆発を処理する関数
function explodeBomb(bombX, bombY) {
  animateExplosion(bombX, bombY);
}

// ダイナマイトの爆発を処理する関数
function explodeDynamite(dynamiteX, dynamiteY) {
  animateExplosion(dynamiteX, dynamiteY, true);
}

// 爆発のアニメーションを描画する関数
function animateExplosion(centerX, centerY, isDynamite = false) {
  const explosionFrames = ['💥', '🔥', '💨', '✨'];
  let frameIndex = 0;
  function drawExplosionFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    ctx.font = `${BLOCK_SIZE}px Arial`;
    ctx.fillText(explosionFrames[frameIndex], centerX * BLOCK_SIZE, (centerY + 1) * BLOCK_SIZE);
    frameIndex++;
    if (frameIndex < explosionFrames.length) {
      setTimeout(drawExplosionFrame, 100);
    } else {
      // 爆発の範囲を設定（ダイナマイトの場合は広範囲）
      const range = isDynamite ? 4 : 1;
      for (let y = centerY - range; y <= centerY + range; y++) {
        for (let x = centerX - range; x <= centerX + range; x++) {
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            board[y][x] = 0;  // 爆発範囲のブロックを消去
          }
        }
      }
      draw();
    }
  }
  drawExplosionFrame();
}

// 移動が有効かチェックする関数
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

// 完成したラインを消去する関数
function clearLines() {
  let linesCleared = 0;
  outer: for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 0 || board[y][x] === 'diamond' || board[y][x] === 'bigDoraemon') continue outer;
    }
    const newRow = Array(COLS).fill(0);
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 'diamond') {
        newRow[x] = 'diamond';  // ダイアモンドは消去されない
      }
    }
    board.splice(y, 1);  // 完成したラインを削除
    board.unshift(newRow);  // 新しい空のラインを追加
    linesCleared++;
    y++;  // 削除したラインの分、インデックスを調整
  }
  return linesCleared;
}

// ピースを回転させる関数
function rotate(piece) {
  // I字テトリミノの特別な回転処理
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
  // 通常の回転処理
  let newShape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i])).reverse();
  return { shape: newShape, color: piece.color };
}

// 回転を試みる関数（壁蹴りも含む）
function tryRotate() {
  let rotated = rotate(currentPiece);
  let kick = 0;
  let maxKick = currentPiece.shape[0].length === 4 || currentPiece.shape.length === 4 ? 3 : 2;
  if (isValidMove(rotated, currentPosition)) {
    currentPiece = rotated;
    return;
  }
  // 左右の壁蹴りを試みる
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
  // I字テトリミノの場合、上方向の壁蹴りも試みる
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

// ゲームの状態を更新する関数
function update() {
  if (!isValidMove(currentPiece, {x: currentPosition.x, y: currentPosition.y + 1})) {
    merge();
    if (currentPiece.color !== 'bomb' && currentPiece.color !== 'dynamite') {
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
    currentPosition.y++;  // ピースを1マス下に移動
  }
}

// ゲーム画面を描画する関数
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPiece();
}

// ゲームループ関数
function gameLoop() {
  update();
  draw();
}

// ゲームを開始する関数
function startGame() {
  currentPiece = createPiece();
  currentPosition = {x: Math.floor(COLS / 2) - 1, y: 0};
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, GAME_SPEED);
}

// ドラえもんブロックの拡大をチェックする関数
function checkAndExpandDoraemon() {
  for (let y = 0; y < ROWS - 1; y++) {
    for (let x = 0; x < COLS - 1; x++) {
      if (
        board[y][x] === 'doraemon' &&
        board[y][x + 1] === 'doraemon' &&
        board[y + 1][x] === 'doraemon' &&
        board[y + 1][x + 1] === 'doraemon'
      ) {
        // 2x2のドラえもンブロックを見つけた場合、拡大する
        board[y][x] = 'bigDoraemon';
        board[y][x + 1] = 0;
        board[y + 1][x] = 0;
        board[y + 1][x + 1] = 0;
      }
    }
  }
}

// ボタンのイベントリスナー設定
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

// ページ読み込み時の処理
window.onload = function() {
  document.getElementById('version').textContent = VERSION;
  startGame();
};