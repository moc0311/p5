// このスケッチは「境界」を表現しています。
// 中と外、外と中、それが入れ替わるような曖昧な空間。
// --- 拡張構想 ---
// 黒い領域をクリックするとファイル（球体）が生成されます。
// ファイルをドラッグして境界を越えると、境界がウニョッと反応。
// そして、越えた先でドラッグを離すと、ファイルはぼんやりと消えていく…
// idea: 2025/05/25

let nodes = []; let numNodes = 50;
//減衰（摩擦）係数
let dampingNum = 0.98;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < numNodes; i++) {
    nodes.push(new Node(0 + i * 38, height / 2));
  }
  // 隣接ノードの設定
  for (let i = 0; i < numNodes; i++) {
    let left = i > 0 ? nodes[i - 1] : null;
    let right = i < numNodes - 1 ? nodes[i + 1] : null;
    nodes[i].neighbors = [left, right];
  }
}

function draw() {
  background(255, 70, 40);
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].checkHover(mouseX, mouseY);
    // 隣接ノードから影響を受ける
    for (let neighbor of nodes[i].neighbors) {
      if (neighbor) {
        nodes[i].influenceFrom(neighbor);
      }
    }
    // ドラッグ中でなければ更新
    if (!nodes[i].isActive()) nodes[i].update();

    nodes[i].display();
    if (i < nodes.length - 1) {
        // 2つのノードの間に線を引く
        stroke(0);
        strokeWeight(.1);
        noFill();
        line(nodes[i].pos.x, nodes[i].pos.y, nodes[i + 1].pos.x, nodes[i + 1].pos.y);
    }
  }
  drawBottomShape();
}

//(0,windowHeight),nodeの頂点群,(windowWidth,windowHeight)を
// 境界として画面下部を塗りつぶす関数
function drawBottomShape() {
  fill(0,0,0,180); // 境界の色
  beginShape();
  vertex(0, windowHeight);
  for (let n of nodes) {
    vertex(n.pos.x, n.pos.y);
  }
  vertex(windowWidth, windowHeight);
  endShape(CLOSE);
}

function mousePressed() {
  for (let n of nodes) n.checkPressed(mouseX, mouseY);
}

function mouseDragged() {
  for (let n of nodes) n.drag(mouseX, mouseY);
}

function mouseReleased() {
  for (let n of nodes) n.release();
}

class Node {
  // ノード（四角形）のクラス
  constructor(x, y) {
    // 初期位置（バネの原点）
    this.origin = createVector(x, y);
    // 現在位置
    this.pos = this.origin.copy();
    // 速度ベクトル
    this.vel = createVector(0, 0);
    // 加速度ベクトル
    this.acc = createVector(0, 0);
    // ドラッグ中かどうか
    this.dragging = false;
    // ホバー中かどうか
    this.hovering = false;
    // ノードの半径（当たり判定用）
    this.radius = 19;
    // 隣接ノードのリスト
    this.neighbors = [];
    // ドラッグまたはホバー状態の統一管理用プロパティ
    this.active = false;
  }

  // 外力を加える
  applyForce(force) {
    this.acc.add(force);
  }

  // 物理シミュレーションの更新
  update() {
    // 原点に戻るバネの力
    let spring = p5.Vector.sub(this.origin, this.pos).mult(0.1);
    this.applyForce(spring);

    // 速度・位置の更新
    this.vel.add(this.acc);
    this.vel.mult(dampingNum); // 減衰（摩擦）
    this.pos.add(this.vel);
    this.acc.set(0); // 加速度リセット

    this.pos.x = this.origin.x;
  }

  // ノードの描画
  display() {
    fill(this.dragging ? "#f66" : "#000"); // ドラッグ中は色を変える
    noStroke();
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y, 2, 2); // 四角形で描画
  }

  // マウスがノード上で押されたか判定
  checkPressed(mx, my) {
    if (dist(mx, my, this.pos.x, this.pos.y) < this.radius) {
      this.dragging = true;
      this.active = true;
    }
  }

  // ドラッグ中の位置更新
  drag(mx, my) {
    if (this.dragging) {
      let prevPos = this.pos.copy();
      this.pos.set(this.origin.x, my);

      // ドラッグで動かした差分を力として伝える
      let delta = p5.Vector.sub(this.pos, prevPos);
      for (let neighbor of this.neighbors) {
        if (neighbor && !neighbor.dragging) {
          neighbor.applyForce(delta.copy().mult(0.03)); // 適度な強さで伝える
        }
      }
    }
  }

  // ドラッグ終了
  release() {
    if (this.dragging) {
      this.dragging = false;
      this.active = false;
    }
  }

  // 隣接ノードからの影響を受ける
  influenceFrom(neighbor) {
    if (this.active) return;
    let dir = p5.Vector.sub(neighbor.pos, this.pos); // 隣接ノードへの方向ベクトル
    let dist = dir.mag(); // 距離
    if (dist > 1) {
      dir.normalize();
      let attenuation = 10 / dist; // 距離が遠いほど弱くする
      dir.mult(2.0 * attenuation);
      this.applyForce(dir);
    }
  }

  checkHover(mx, my) {
    if (dist(mx, my, this.pos.x, this.pos.y) < this.radius) {
      if (!this.hovering) {
        // 新しくホバーし始めた時のみ処理
        this.hovering = true;
        this.active = true;
      }
      
      let prevPos = this.pos.copy();
      // ホバー時は単純にマウスのY座標に追従
      this.pos.set(this.origin.x, my);
      
      // 隣接ノードに力を伝える（ホバー時は強めに）
      let delta = p5.Vector.sub(this.pos, prevPos);
      if (delta.mag() > 0.1) { // 微小な変化は無視
        for (let neighbor of this.neighbors) {
          if (neighbor && !neighbor.isActive()) {
            neighbor.applyForce(delta.copy().mult(0.05)); // ドラッグ時より強く
          }
        }
      }
    } else {
      this.hovering = false;
      this.active = false;
    }
  }

  isActive() {
    return this.dragging || this.hovering;
  }
}