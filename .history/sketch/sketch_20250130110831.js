let rentalData = {}; // 存储租金数据（字典格式）
let rentalDataArray = [];
let departementsGeoJSON;
let dataLoaded = false; // 数据加载标志
const MIN_PRICE = 5;  
const MAX_PRICE = 30;
let selectedDept = null;

function setup() {
  createCanvas(1400, 1200);
  noLoop(); // 先停止自动绘制，等数据加载完成后再 redraw()
  
  startColor = color(135, 206, 250); 
  endColor   = color(0, 0, 139);

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
  loadJSON('data/departements.geojson', function(data) {
    departementsGeoJSON = data;
    console.log("✅ GeoJSON 数据加载成功:", departementsGeoJSON);
    checkDataLoaded();
  });
}

function mouseClicked() {
    for (let dept of de)

}

function drawdepartement(coordinates) {
  if (coordinates.length > 1) {
    // 处理 MultiPolygon（多个多边形）
    for (let polygon of coordinates) {
      drawSinglePolygon(polygon);
    }
  } else {
    // 处理单个 Polygon
    drawSinglePolygon(coordinates[0]);
  }
}

function drawSinglePolygon(polygon) {
  beginShape();
  for (let coord of polygon) {
    let x = map(coord[0], -5, 10, 50, width - 50); // 经度映射到画布
    let y = map(coord[1], 41, 51, height - 50, 50); // 纬度映射到画布
    vertex(x, y);
  }
  endShape(CLOSE);
}

function drawDepartments() {
  let features = departementsGeoJSON.features;
  console.log("🚀 开始绘制区域:", features.length);

  for (let i = 0; i < features.length; i++) {
    let dept = features[i];
    let geometryType = dept.geometry.type;     // 可能是 "Polygon" 或 "MultiPolygon"
    let coordinates = dept.geometry.coordinates;
    let deptCode = dept.properties.code;       // 区域代码

    // 获取该区域对应的租金数据
    let rentalInfo = rentalData[deptCode];
    let medianPrice = rentalInfo ? rentalInfo.median : null;

    // 根据 medianPrice 映射颜色
    let colorValue;
    if (medianPrice !== null) {
      colorValue = map(medianPrice, MIN_PRICE, MAX_PRICE, 0, 1,true); // 可根据你的数据分布调整
      colorValue = lerpColor(startColor, endColor, colorValue);
    } else {
      colorValue = '#ADD8E6';  // 没有数据就用淡蓝色
    }
    fill(colorValue);
    stroke(100);

    // ============= 关键区别：Polygon vs MultiPolygon ============
    if (geometryType === "Polygon") {
      // geometry.coordinates 是一个“二维数组” [ [ring1], [ring2], ... ]
      // 每个 ring 都要绘制（第一个 ring 通常是外环，后续可能是内环/洞）
      for (let ring of coordinates) {
        drawSinglePolygon(ring);
      }
    } else if (geometryType === "MultiPolygon") {
      // geometry.coordinates 是一个“三维数组” [ [ [ring1], [ring2] ], [ [ring1], ...] ... ]
      // 先遍历子多边形 polygon，然后绘制各个 ring
      for (let polygon of coordinates) {
        for (let ring of polygon) {
          drawSinglePolygon(ring);
        }
      }
    } else {
      // 如果有其他类型，先打印一下看是什么
      console.warn("未知的几何类型: ", geometryType);
    }

    // ============ 计算质心并绘制文字 ============
    // 对于多多边形，如何选取质心？这里简单示例：取第一个多边形的第一个 ring。
    // 如果要更准确，需要计算所有多边形的合并中心或面积加权中心。
    let labelCentroid;
    if (geometryType === "Polygon") {
      labelCentroid = calculateCentroid(coordinates[0]); // 取外环
    } else if (geometryType === "MultiPolygon") {
      labelCentroid = calculateMultiPolygonCentroid(coordinates); // 取第一个多边形的外环
    }

    // 将质心的经纬度映射到画布坐标
    if (labelCentroid) {
      let labelX = map(labelCentroid[0], -5, 10, 50, width - 50);
      let labelY = map(labelCentroid[1], 41, 51, height - 50, 50);
      fill(0);
      textSize(10);
      textAlign(CENTER);

      if (medianPrice !== null) {
        text(`${dept.properties.nom}\n${medianPrice.toFixed(1)} €/m²`, labelX, labelY);
      } else {
        text(`${dept.properties.nom}\n no datasets`, labelX, labelY);
      }
    }
  }
}


// 计算多边形的质心，用于显示标签
function calculateCentroid(ring) {
  if (!ring || ring.length === 0) return null;
  let xSum = 0, ySum = 0;
  for (let coord of ring) {
    xSum += coord[0];
    ySum += coord[1];
  }
  let len = ring.length;
  return [xSum / len, ySum / len];
}

function calculateMultiPolygonCentroid(multiPolygon) {
  // multiPolygon 形如 [ [ [ring1], [ring2, ...] ], [ [ring1], ... ], ... ]
  let allPoints = [];
  for (let polygon of multiPolygon) {
    // 这里只取每个 polygon 的外环 polygon[0]
    // 如果你想包括内环，可把 polygon 中的每个 ring 都遍历
    let outerRing = polygon[0];
    allPoints = allPoints.concat(outerRing);
  }

  if (allPoints.length === 0) return null;

  let xSum = 0, ySum = 0;
  for (let coord of allPoints) {
    xSum += coord[0];
    ySum += coord[1];
  }
  let avgX = xSum / allPoints.length;
  let avgY = ySum / allPoints.length;
  
  return [avgX, avgY];
}


// ✅ **确保数据加载完成后再 redraw()**
function checkDataLoaded() {
  if (departementsGeoJSON && rentalDataArray.length > 0) {
    console.log("✅ 所有数据加载完成，开始绘制！");
    dataLoaded = true;
    redraw(); // 重新触发 draw()
  }
}

// --------------- 绘制图例 (Legend) ---------------
function drawLegend() {
  // 假设想在右上角放一个竖向渐变
  let legendX = width - 60;
  let legendY = 50;
  let legendHeight = 200;
  let legendWidth = 20;

  // 绘制一个渐变条(从 MIN_PRICE -> MAX_PRICE)
  // 这里我们用一个 for 循环离散模拟渐变
  noStroke();
  for (let i = 0; i < legendHeight; i++) {
    let value = map(i, 0, legendHeight, MIN_PRICE, MAX_PRICE);

    let t = map(value, MIN_PRICE, MAX_PRICE, 0, 1, true);

    let c = lerpColor('#ADD8E6', endColor, t);

    fill(c);
    rect(legendX-20, legendY + i, legendWidth, 1);

  }

  // 边框
  stroke(0);
  noFill();
  rect(legendX-20, legendY, legendWidth, legendHeight);

  // 文字说明
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${MIN_PRICE} €/m²`, legendX + legendWidth-15, legendY);
  text(`${MAX_PRICE} €/m²`, legendX + legendWidth-15, legendY + legendHeight);

  // 你也可以在中间加些刻度，或者额外写个标题
  text("Rent average legend", legendX-15, legendY-15);
}


function draw() {
  background(240);
  if (dataLoaded) {
    console.log("🎯 数据加载完毕，开始绘制...");
    drawDepartments(); // **只有数据加载完成后才执行绘制**
  } else {
    console.log("⌛ 数据加载中...");
    textSize(20);
    textAlign(CENTER, CENTER);
    fill(100);
    text("Loading data...", width / 2, height / 2);
  }
  drawLegend();
}