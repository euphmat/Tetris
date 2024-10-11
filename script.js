const VERSION='v0.14',canvas=document.getElementById('tetris-canvas'),ctx=canvas.getContext('2d'),
ROWS=18,COLS=10,BLOCK_SIZE=30,SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[1,1,1],[0,1,0]],[[1,1,1],[1,0,0]],
[[1,1,1],[0,0,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]],COLORS=['#FF0D72','#0DC2FF','#0DFF72','#F538FF',
'#FF8E0D','#FFE138','#3877FF'],GAME_SPEED=500;
canvas.width=COLS*BLOCK_SIZE;canvas.height=ROWS*BLOCK_SIZE;
let board=Array(ROWS).fill().map(()=>Array(COLS).fill(0)),currentPiece=null,currentPosition={x:0,y:0},
gameInterval=null;
const doraemonImg=document.getElementById('doraemon');

function createPiece(){
  const r=Math.random();
  if(r<.02)return{shape:[[1]],color:'dynamite'};
  if(r<.1)return{shape:[[1]],color:'bomb'};
  if(r<.08)return{shape:[[1]],color:'diamond'};
  if(r<.18)return{shape:[[1]],color:'doraemon'};
  const i=Math.floor(Math.random()*SHAPES.length);
  return{shape:SHAPES[i],color:COLORS[i]};
}

function drawBlock(x,y,v){
  if(v==='doraemon')ctx.drawImage(doraemonImg,x*BLOCK_SIZE,y*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
  else if(v==='bigDoraemon')ctx.drawImage(doraemonImg,x*BLOCK_SIZE,y*BLOCK_SIZE,BLOCK_SIZE*2,BLOCK_SIZE*2);
  else if(['bomb','diamond','dynamite'].includes(v)){
    ctx.font=`${BLOCK_SIZE}px Arial`;
    ctx.fillText(v==='bomb'?'💣':v==='diamond'?'💎':'🧨',x*BLOCK_SIZE,(y+1)*BLOCK_SIZE);
  }else{
    ctx.fillStyle=v;ctx.fillRect(x*BLOCK_SIZE,y*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
    ctx.strokeStyle='#000';ctx.strokeRect(x*BLOCK_SIZE,y*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
  }
}

function drawBoard(){board.forEach((r,y)=>r.forEach((v,x)=>v&&drawBlock(x,y,v)));}
function drawPiece(){currentPiece.shape.forEach((r,y)=>r.forEach((v,x)=>v&&drawBlock(currentPosition.x+x,currentPosition.y+y,currentPiece.color)));}

function animateExplosion(x,y,d=false){
  const f=['💥','🔥','💨','✨'];let i=0;
  function anim(){
    ctx.clearRect(0,0,canvas.width,canvas.height);drawBoard();
    ctx.font=`${BLOCK_SIZE}px Arial`;ctx.fillText(f[i],x*BLOCK_SIZE,(y+1)*BLOCK_SIZE);
    if(++i<f.length)setTimeout(anim,100);
    else{
      const r=d?4:1;
      for(let j=y-r;j<=y+r;j++)for(let k=x-r;k<=x+r;k++)
        if(j>=0&&j<ROWS&&k>=0&&k<COLS)board[j][k]=0;
      draw();
    }
  }
  anim();
}

function merge(){
  currentPiece.shape.forEach((r,y)=>r.forEach((v,x)=>{
    if(v){
      if(currentPiece.color==='bomb')animateExplosion(currentPosition.x+x,currentPosition.y+y);
      else if(currentPiece.color==='dynamite')animateExplosion(currentPosition.x+x,currentPosition.y+y,true);
      else board[currentPosition.y+y][currentPosition.x+x]=currentPiece.color;
    }
  }));
  checkAndExpandDoraemon();
}

function isValidMove(p,pos){
  return p.shape.every((r,y)=>r.every((v,x)=>{
    const nx=pos.x+x,ny=pos.y+y;
    return !v||(nx>=0&&nx<COLS&&ny<ROWS&&board[ny]&&!board[ny][nx]);
  }));
}

function clearLines(){
  let l=0;
  for(let y=ROWS-1;y>=0;y--){
    if(board[y].every(v=>v&&v!=='diamond'&&v!=='bigDoraemon')){
      board.splice(y,1);
      board.unshift(Array(COLS).fill(0).map((_,x)=>board[y][x]==='diamond'?'diamond':0));
      l++;y++;
    }
  }
  return l;
}

function rotate(p){
  if(p.shape.length===1&&p.shape[0].length===4)return{shape:[[1],[1],[1],[1]],color:p.color};
  if(p.shape.length===4&&p.shape[0].length===1)return{shape:[[1,1,1,1]],color:p.color};
  return{shape:p.shape[0].map((_,i)=>p.shape.map(r=>r[i])).reverse(),color:p.color};
}

function tryRotate(){
  let r=rotate(currentPiece),k=0,m=currentPiece.shape[0].length===4||currentPiece.shape.length===4?3:2;
  if(isValidMove(r,currentPosition)){currentPiece=r;return;}
  for(k=1;k<=m;k++){
    if(isValidMove(r,{x:currentPosition.x-k,y:currentPosition.y})){
      currentPiece=r;currentPosition.x-=k;return;
    }
    if(isValidMove(r,{x:currentPosition.x+k,y:currentPosition.y})){
      currentPiece=r;currentPosition.x+=k;return;
    }
  }
  if(m===3){
    if(isValidMove(r,{x:currentPosition.x,y:currentPosition.y-1})){
      currentPiece=r;currentPosition.y--;return;
    }
    if(isValidMove(r,{x:currentPosition.x,y:currentPosition.y-2})){
      currentPiece=r;currentPosition.y-=2;return;
    }
  }
}

function update(){
  if(!isValidMove(currentPiece,{x:currentPosition.x,y:currentPosition.y+1})){
    merge();
    if(currentPiece.color!=='bomb'&&currentPiece.color!=='dynamite')clearLines();
    currentPiece=createPiece();
    currentPosition={x:Math.floor(COLS/2)-1,y:0};
    if(!isValidMove(currentPiece,currentPosition)){
      alert('Game Over!');
      board=Array(ROWS).fill().map(()=>Array(COLS).fill(0));
      startGame();
    }
  }else currentPosition.y++;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBoard();
  drawPiece();
}

function gameLoop(){update();draw();}

function startGame(){
  currentPiece=createPiece();
  currentPosition={x:Math.floor(COLS/2)-1,y:0};
  clearInterval(gameInterval);
  gameInterval=setInterval(gameLoop,GAME_SPEED);
}

function checkAndExpandDoraemon(){
  for(let y=0;y<ROWS-1;y++)
    for(let x=0;x<COLS-1;x++)
      if(board[y][x]==='doraemon'&&board[y][x+1]==='doraemon'&&
         board[y+1][x]==='doraemon'&&board[y+1][x+1]==='doraemon'){
        board[y][x]='bigDoraemon';
        board[y][x+1]=board[y+1][x]=board[y+1][x+1]=0;
      }
}

['left','right','down','rotate'].forEach(d=>{
  document.getElementById(`${d}-btn`).addEventListener('click',()=>{
    if(d==='left'&&isValidMove(currentPiece,{x:currentPosition.x-1,y:currentPosition.y}))currentPosition.x--;
    else if(d==='right'&&isValidMove(currentPiece,{x:currentPosition.x+1,y:currentPosition.y}))currentPosition.x++;
    else if(d==='down'&&isValidMove(currentPiece,{x:currentPosition.x,y:currentPosition.y+1}))currentPosition.y++;
    else if(d==='rotate')tryRotate();
    draw();
  });
});

window.onload=()=>{document.getElementById('version').textContent=VERSION;startGame();};