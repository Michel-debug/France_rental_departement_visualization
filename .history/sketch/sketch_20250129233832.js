let rentalData = {}; // 存储租金数据（字典格式）
let rentalDataArray = [];
let departementsGeoJSON;
let dataLoaded = false; // 数据加载标志

function setup() {
  createCanvas(1200, 1000);
  noLoop(); // 先停止自动绘制，等数据加载完成后再 redraw()
  
  // ✅ 加载租金 JSON 数据
  loadJSON('data/departement_rental_data.json', function(data) {
    if (Array.isArray(data)) {
      rentalDataArray = data; // 赋值数组数据
      data.forEach(item => {
        rentalData[item.departement_code] = item; // 转换为字典格式
      });
      console.log("✅ 租金 JSON 数据加载成功:", rentalData);
    } else {
      console.error("❌ rentalDataArray 不是数组:", data);
    }
    checkDataLoaded();
  });

  // ✅ 加载 GeoJSON 数据
  loadJSON('data/departements2.geojson', function(data) {
    departementsGeoJSON = data;
    console.log("✅ GeoJSON 数据加载成功:", departementsGeoJSON);
    checkDataLoaded();
  });
}

function drawdepartements() {
  let features = departementsGeoJSON.features; // 获取所有区域
  console.log("🚀 开始绘制区域:", features.length);
  // 遍历每个区域
  for (let i = 0; i < features.length; i++) {
    let departement = features[i];
    let coordinates = departement.geometry.coordinates;
    let departementCode = departement.properties.code; // 区域代码

    // 获取该区域对应的租金数据
    let rentalInfo = rentalData[departementCode];
    let medianPrice = rentalInfo ? rentalInfo.median : null;

    // 根据 median 租金值映射颜色
    if (medianPrice !== null) {
      // 假设 medianPrice 的范围在 10 到 30 之间
      let colorValue = map(medianPrice, 10, 35, 200, 30); // 颜色从浅到深
      fill(colorValue);
    } else {
      // 如果没有数据，则用灰色填充
      fill(220);
    }
    stroke(100);

    // 处理多边形坐标并绘制区域
    beginShape();
    if ( departementCode == 60 ){
      console.log("🚀 开始绘制区域:", departementCode,departement.properties.nom);
      console.log("🚀 开始绘制区域:", coordinates);
    }
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
      text(`${departement.properties.nom}\n${medianPrice.toFixed(1)} €/m²`, labelX, labelY);
    } else {
      text(departement.properties.nom, labelX, labelY);
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
    drawdepartements(); // **只有数据加载完成后才执行绘制**
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
  if (departementsGeoJSON && rentalDataArray.length > 0) {
    console.log("✅ 所有数据加载完成，开始绘制！");
    dataLoaded = true;
    redraw(); // 重新触发 draw()
  }
}
