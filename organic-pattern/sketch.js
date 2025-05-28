// オーガニックパターン生成スケッチ
// リアクション・ディフュージョンモデルを使用

let grid, nextGrid;
let cols, rows;
let scale = 1;

// Gray-Scottモデルのパラメータ
let dA = 1.0, dB = 0.5, feed = 0.037, k = 0.06;

function setup() {
  createCanvas(windowWidth, windowHeight);
  cols = width / scale;
  rows = height / scale; // 高さを0.25で割ることで、より細かいグリッドを作成
  pixelDensity(1); // ピクセル密度を1に設定
  
  // グリッドの初期化
  grid = [];
  nextGrid = [];
  
  for (let x = 0; x < cols; x++) {
    grid[x] = [];
    nextGrid[x] = [];
    for (let y = 0; y < rows; y++) {
      grid[x][y] = { a: 1, b: 0 };
      nextGrid[x][y] = { a: 1, b: 0 };
    }
  }
  
  // 画面全体にランダムにシードを配置
  for (let i = 0; i < 100; i++) {
    let x = floor(random(10, cols - 10));
    let y = floor(random(10, rows - 10));
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        if (x + dx >= 0 && x + dx < cols && y + dy >= 0 && y + dy < rows) {
          grid[x + dx][y + dy].b = random(0.3, 1);
        }
      }
    }
  }
}

function draw() {
  background(255);
  
  // リアクション・ディフュージョンの計算
  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      let a = grid[x][y].a;
      let b = grid[x][y].b;      
      // ラプラシアン（拡散）の計算
      let laplaceA = 0;
      let laplaceB = 0;
      
      laplaceA += grid[x][y].a * -1;
      laplaceA += grid[x - 1][y].a * 0.2;
      laplaceA += grid[x + 1][y].a * 0.2;
      laplaceA += grid[x][y - 1].a * 0.2;
      laplaceA += grid[x][y + 1].a * 0.2;
      laplaceA += grid[x - 1][y - 1].a * 0.05;
      laplaceA += grid[x + 1][y - 1].a * 0.05;
      laplaceA += grid[x - 1][y + 1].a * 0.05;
      laplaceA += grid[x + 1][y + 1].a * 0.05;
      
      laplaceB += grid[x][y].b * -1;
      laplaceB += grid[x - 1][y].b * 0.2;
      laplaceB += grid[x + 1][y].b * 0.2;
      laplaceB += grid[x][y - 1].b * 0.2;
      laplaceB += grid[x][y + 1].b * 0.2;
      laplaceB += grid[x - 1][y - 1].b * 0.05;
      laplaceB += grid[x + 1][y - 1].b * 0.05;
      laplaceB += grid[x - 1][y + 1].b * 0.05;
      laplaceB += grid[x + 1][y + 1].b * 0.05;
      
      // Gray-Scott方程式
      let abb = a * b * b;
      
      nextGrid[x][y].a = a + (dA * laplaceA - abb + feed * (1 - a));
      nextGrid[x][y].b = b + (dB * laplaceB + abb - (k + feed) * b);
      
      // 値を0-1の範囲に制限
      nextGrid[x][y].a = constrain(nextGrid[x][y].a, 0, 1);
      nextGrid[x][y].b = constrain(nextGrid[x][y].b, 0, 1);
    }
  }
  
  // グリッドの更新
  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
  
  // 描画
  loadPixels();
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let c = floor((grid[x][y].a - grid[x][y].b) * 255);
      c = constrain(c, 0, 255);
      
      // 白黒の強いコントラスト
      c = c > 128 ? 255 : 0;
      
      // ピクセルを塗る（スケールに応じて拡大）
      for (let dx = 0; dx < scale; dx++) {
        for (let dy = 0; dy < scale; dy++) {
          let pixelX = x * scale + dx;
          let pixelY = y * scale + dy;          if (pixelX < width && pixelY < height) {
            let index = (pixelX + pixelY * width) * 4;
            pixels[index] = c;     // R
            pixels[index + 1] = c; // G
            pixels[index + 2] = c; // B
            pixels[index + 3] = 255; // A
          }
        }
      }
    }
  }
  updatePixels();
}

// マウスクリックでシードを追加
function mousePressed() {
  let x = floor(mouseX / scale);
  let y = floor(mouseY / scale);
  
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (x + dx >= 0 && x + dx < cols && y + dy >= 0 && y + dy < rows) {
          grid[x + dx][y + dy].b = 1;
        }
      }
    }
  }
}

// キーでパラメータ調整
function keyPressed() {
  if (key === 'r' || key === 'R') {
    // リセット
    setup();
  } else if (key === '1') {
    feed = 0.037; k = 0.06; // 別のパターン
  } else if (key === '2') {
    feed = 0.055; k = 0.062; // デフォルト
  } else if (key === '3') {
    feed = 0.039; k = 0.058; // また別のパターン
  }
}

// ウィンドウサイズ変更に対応
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup(); // 新しいサイズで再初期化
}