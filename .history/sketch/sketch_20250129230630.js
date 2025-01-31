
// }
let rentalData = {}; // 存储租金数据（字典格式）
let rentalDataArray = [];
let regionsGeoJSON;
let dataLoaded = false; // 数据加载标志

function setup() {
  createCanvas(800, 600);
  noLoop(); // 先停止自动绘制，等数据加载完成后再 redraw()
  
  // ✅ 加载租金 JSON 数据
  loadJSON('data/region_rental_data.json', function(data) {
    if (Array.isArray(data)) {
      rentalDataArray = data; // 赋值数组数据
      data.forEach(item => {
        rentalData[item.region_code] = item; // 转换为字典格式
      });
      console.log("✅ 租金 JSON 数据加载成功:", rentalData);
    } else {
      console.error("❌ rentalDataArray 不是数组:", data);
    }
    checkDataLoaded();
  });

  // ✅ 加载 GeoJSON 数据
  loadJSON('data/regions.geojson', function(data) {
    regionsGeoJSON = data;
    console.log("✅ GeoJSON 数据加载成功:", regionsGeoJSON);
    checkDataLoaded();
  });
}

function drawRegions() {
  let features = regionsGeoJSON.features; // 获取所有区域

  // 遍历每个区域
  for (let i = 0; i < features.length; i++) {
    let region = features[i];
    let coordinates = region.geometry.coordinates;
    let regionCode = region.properties.code; // 区域代码

    // 获取该区域对应的租金数据
    let rentalInfo = rentalData[regionCode];
    let medianPrice = rentalInfo ? rentalInfo.median : null;

    // 根据 median 租金值映射颜色
    if (medianPrice !== null) {
      // 假设 medianPrice 的范围在 10 到 30 之间
      let colorValue = map(medianPrice, 10, 30, 200, 50); // 颜色从浅到深
      fill(colorValue);
    } else {
      // 如果没有数据，则用灰色填充
      fill(220);
    }
    stroke(100);

    // 处理多边形坐标并绘制区域
    beginShape();
    for (let coord of coordinates[0]) {
      let x = map(coord[0], -5, 10, 50, width - 50); // 经度映射到画布
      let y = map(coord[1], 41, 51, height - 50, 50); // 纬度映射到画布
      vertex(x, y);
    }
    endShape(CLOSE);

    // 显示区域名称和中位数租金
    let centroid = calculateCentroid(coordinates[0]);
    let labelX = map(centroid[0], -5, 10, 50, width - 50);
    let labelY = map(centroid[1], 41, 51, height - 50, 50);
    fill(0);
    textSize(10);
    textAlign(CENTER);
    if (rentalInfo) {
      text(`${region.properties.nom}\n${medianPrice.toFixed(1)} €/m²`, labelX, labelY);
    } else {
      text(region.properties.nom, labelX, labelY);
    }
  }
}

// 计算多边形的质心，用于显示标签
function calculateCentroid(polygon) {
  let xSum = 0, ySum = 0;
  for (let coord of polygon) {
    xSum += coord[0];
    ySum += coord[1];
  }
  return [xSum / polygon.length, ySum / polygon.length];
}

function draw() {
  background(240);
  if (dataLoaded) {
    console.log("🎯 数据加载完毕，开始绘制...");
    drawRegions(); // **只有数据加载完成后才执行绘制**
  } else {
    console.log("⌛ 数据加载中...");
    textSize(20);
    textAlign(CENTER, CENTER);
    fill(100);
    text("Loading data...", width / 2, height / 2);
  }
}

// ✅ **确保数据加载完成后再 redraw()**
function checkDataLoaded() {
  if (regionsGeoJSON && rentalDataArray.length > 0) {
    console.log("✅ 所有数据加载完成，开始绘制！");
    dataLoaded = true;
    redraw(); // 重新触发 draw()
  }
}
