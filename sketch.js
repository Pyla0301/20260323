let seaweeds = []; // 用來儲存所有水草的屬性物件
let bubbles = []; // 用來儲存氣泡的陣列
let popSound; // 宣告音效變數

function preload() {
  // 預先載入音效檔，請確認檔名與路徑正確
  popSound = loadSound('pop.mp3');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);

  // 調低 pop 音效的音量 (範圍 0.0 ~ 1.0)
  popSound.setVolume(0.2);

  // 定義顏色陣列
  let colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];

  // 初始化 50 根水草的屬性
  for (let i = 0; i < 50; i++) {
    // 預先產生顏色並設定更高的透明度，讓重疊效果更明顯
    let c = color(colors[floor(random(colors.length))]);
    c.setAlpha(160); // 調低數值 (0~255)，數值越小越透明

    // 將屬性存入物件陣列中
    seaweeds.push({
      baseXRatio: random(1),          // X 座標比例 (0~1)
      heightRatio: random(0.2, 0.66), // 高度比例 (0.2~0.66)
      color: c,                       // 顏色
      thickness: random(30, 60),      // 粗細
      speed: random(0.001, 0.01),     // 搖晃的頻率 (速度)
      noiseOffsetX: random(1000)      // 雜訊位移量 (讓搖晃不同步)
    });
  }

  // 初始化 30 顆氣泡
  for (let i = 0; i < 30; i++) {
    bubbles.push(new Bubble());
  }
}

function draw() {
  // 每一幀先完全清除畫布，避免半透明背景無限疊加產生殘影
  clear();
  // 設定 0.2 透明度的背景顏色 (RGB 為 202, 240, 248，Alpha 為 255 * 0.2 ≒ 51)
  background(202, 240, 248, 51);

  // 設定混合模式為 BLEND，讓顏色與透明度自然重疊
  blendMode(BLEND);

  // 設定水草的視覺樣式
  noFill();
  strokeCap(ROUND);  // 讓水草頂端呈圓弧狀
  strokeJoin(ROUND); // 轉折處圓滑處理

  // 加入全局海波效果，讓所有水草有一致的緩慢波動
  let globalWave = sin(frameCount * 0.01) * 20;

  // 繪製陣列中的每一根小草
  for (let weed of seaweeds) {
    // 根據視窗寬高與比例，計算出這幀實際的座標與高度
    let grassBaseX = weed.baseXRatio * width;
    let topY = height - (weed.heightRatio * height);
    
    stroke(weed.color);
    strokeWeight(weed.thickness);

    beginShape();
    let firstPoint = true;
    let lastX, lastY;
    
    // 由視窗底部 (height) 往上畫至隨機決定的 topY 位置
    // y 每次減少 10，代表水草節點的密度
    for (let y = height, i = 0; y > topY; y -= 10, i++) {
      
      // 1. 利用 noise 產生平滑的隨機值 (介於 0 到 1 之間)
      // 傳入 noiseOffsetX 讓每根水草有不同的搖晃方向
      // 傳入 y * 0.002 讓不同高度有更平滑的相位差
      // 傳入 frameCount * speed 讓雜訊隨時間推移（不同水波搖晃速度）
      let n = noise(weed.noiseOffsetX, y * 0.002, frameCount * weed.speed);
      
      // 2. 利用 map 決定不同高度的搖晃「最大幅度」
      // 底部 (y = height) 綁定為 0（不搖晃），越往上 (y = topY) 幅度漸增至 150
      let swayAmount = map(y, height, topY, 0, 150);
      
      // 3. 採用新的滑鼠互動邏輯，模擬全域的水流推力
      let hh = height - topY; // 該根水草的實際高度
      let mouseFactor = map(i, 0, 500, 0, 1) * log(hh) / 10;
      let mouseDelta = map(mouseX, 0, width, -200, 200);
      let mouseOffset = mouseDelta * mouseFactor;
      
      // 4. 將 noise 搖晃、全域海波以及滑鼠吸引力加總起來
      let xOffset = map(n, 0, 1, -swayAmount, swayAmount) + globalWave + mouseOffset;

      let currentX = grassBaseX + xOffset;
      
      // curveVertex 需要重複第一個點來作為曲線的控制點
      if (firstPoint) {
        curveVertex(currentX, y);
        firstPoint = false;
      }

      // 結合基礎 X 座標與計算好的偏移量來畫出曲線頂點
      curveVertex(currentX, y);
      
      // 記錄最後一個點的座標
      lastX = currentX;
      lastY = y;
    }
    // curveVertex 需要重複最後一個點來作為曲線的控制點
    if (lastX !== undefined) {
      curveVertex(lastX, lastY);
    }
    endShape();
  }

  // 更新與繪製每一顆氣泡
  for (let b of bubbles) {
    b.update();
    b.display();
  }
}

// 當使用者縮放瀏覽器視窗時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Bubble {
  constructor() {
    this.reset(true);
  }

  // 重置氣泡狀態，讓它從畫面底部重新出發
  reset(initial = false) {
    this.x = random(width);
    // 初始產生時讓氣泡散佈在畫面底部以下不同深度，避免一開始全部擠在一起
    this.y = initial ? random(height, height + 800) : height + random(50);
    this.size = random(10, 30);
    this.speed = random(1, 3);
    this.popHeight = random(50, height / 2); // 每顆氣泡隨機決定的破裂高度
    this.state = 'rising'; // 狀態：'rising' 上升中, 'popping' 破裂中
    this.popTimer = 0;
    this.maxPopTimer = 15; // 破裂動畫的持續影格數
    this.wobbleOffset = random(1000); // 左右搖晃的相位差
  }

  update() {
    if (this.state === 'rising') {
      this.y -= this.speed;
      // 利用 sin 產生微微的左右搖晃
      this.x += sin(frameCount * 0.05 + this.wobbleOffset) * 1;

      // 當上升到達指定高度後，切換為破裂狀態
      if (this.y < this.popHeight) {
        this.state = 'popping';
        // 播放破裂音效
        if (popSound && popSound.isLoaded()) {
          popSound.play();
        }
      }
    } else if (this.state === 'popping') {
      this.popTimer++;
      // 動畫結束後重置氣泡
      if (this.popTimer > this.maxPopTimer) {
        this.reset();
      }
    }
  }

  display() {
    if (this.state === 'rising') {
      noStroke();
      // 水泡主體 (白色，透明度 0.5 -> 255 * 0.5 ≒ 127)
      fill(255, 255, 255, 127);
      circle(this.x, this.y, this.size);
      
      // 水泡上的反光亮點 (白色小圓，透明度 0.7 -> 255 * 0.7 ≒ 178)
      fill(255, 255, 255, 178);
      circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
    } else if (this.state === 'popping') {
      // 破裂效果：產生一個向外擴張並逐漸變透明消失的圓環
      noFill();
      // 透明度隨時間遞減
      let alpha = map(this.popTimer, 0, this.maxPopTimer, 127, 0);
      // 大小隨時間擴張至原本的兩倍
      let expandSize = map(this.popTimer, 0, this.maxPopTimer, this.size, this.size * 2);
      
      stroke(255, 255, 255, alpha);
      strokeWeight(2);
      circle(this.x, this.y, expandSize);
    }
  }
}
