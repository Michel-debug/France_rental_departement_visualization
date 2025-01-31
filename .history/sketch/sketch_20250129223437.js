let regionsGeoJSON;
let rentalData = {};
let rentalDataArray = [];

function preload() {
  try {
    // 加载 JSON 数据
    rentalDataArray = loadJSON('data/region_rental_data.json', function(data){
      console.log(JSON.stringify(data));
    });
    regionsGeoJSON = loadJSON('data/regions.geojson');
    console.log("hello",rentalDataArray)
    // 检查 rentalDataArray 是否是数组
    if (Array.isArray(rentalDataArray)) {
      rentalDataArray.forEach(item => {
        rentalData[item.region_code] = item;
      });
    } else {
      console.error("rentalDataArray is not an array:", rentalDataArray);
    }
  } catch (error) {
    console.error("Failed to load JSON data:", error);
  }
}

function setup() {
  createCanvas(800, 600);
  noLoop(); // 地图是静态的，只绘制一次

  // 检查数据是否加载完成
  if (regionsGeoJSON && rentalDataArray) {
    drawRegions();
  } else {
    console.log("Waiting for data to load...");
  }
}

function draw() {
  background(240);
  if (regionsGeoJSON && rentalDataArray) {
    drawRegions();
  } else {
    console.log("Waiting for data to load...");
  }
}

function drawRegions() {
  let features = regionsGeoJSON.features; // 获取所有区域
  for (let i = 0; i < features.length; i++) {
    let region = features[i];
    let coordinates = region.geometry.coordinates;
    let regionCode = region.properties.code; // 区域代码

    // 获取该区域对应的租金数据
    let rentalInfo = rentalData[regionCode];
    if (rentalInfo) {
      // 使用 median 租金值映射颜色
      let medianPrice = rentalInfo.median;
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