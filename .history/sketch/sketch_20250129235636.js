let rentalData = {}; // 存储租金数据（字典格式）
let rentalDataArray = [];
let departementsGeoJSON;
let dataLoaded = false; // 数据加载标志

function setup() {
  createCanvas(1400, 1000);
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
  loadJSON('data/departements.geojson', function(data) {
    departementsGeoJSON = data;
    console.log("✅ GeoJSON 数据加载成功:", departementsGeoJSON);
    checkDataLoaded();
  });
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
      colorValue = map(medianPrice, 10, 35, 200, 30); // 可根据你的数据分布调整
    } else {
      colorValue = 220;  // 没有数据就用灰色
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
    let labelCentroid = calculateCentroid(coordinates);

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


function calculateCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;

  let totalArea = 0; // 总面积
  let centroidX = 0; // 加权质心 X
  let centroidY = 0; // 加权质心 Y

  // 遍历所有多边形
  for (let polygon of coordinates) {
    let area = 0; // 当前多边形的面积
    let polygonCentroidX = 0; // 当前多边形的质心 X
    let polygonCentroidY = 0; // 当前多边形的质心 Y

    // 计算当前多边形的面积和质心
    for (let i = 0; i < polygon.length; i++) {
      let ring = polygon[i];
      let ringArea = calculateRingArea(ring);
      let ringCentroid = calculateRingCentroid(ring);

      // 如果是外环（第一个环），累加面积和质心
      if (i === 0) {
        area += ringArea;
        polygonCentroidX += ringCentroid[0] * ringArea;
        polygonCentroidY += ringCentroid[1] * ringArea;
      } else {
        // 如果是内环（洞），减去面积
        area -= ringArea;
        polygonCentroidX -= ringCentroid[0] * ringArea;
        polygonCentroidY -= ringCentroid[1] * ringArea;
      }
    }

    // 累加当前多边形的加权质心
    if (area !== 0) {
      centroidX += polygonCentroidX / area;
      centroidY += polygonCentroidY / area;
      totalArea += area;
    }
  }

  // 计算整体质心
  if (totalArea !== 0) {
    return [centroidX / coordinates.length, centroidY / coordinates.length];
  } else {
    return null;
  }
}

// 计算单个环的面积
function calculateRingArea(ring) {
  let area = 0;
  let len = ring.length;
  for (let i = 0; i < len; i++) {
    let x1 = ring[i][0];
    let y1 = ring[i][1];
    let x2 = ring[(i + 1) % len][0];
    let y2 = ring[(i + 1) % len][1];
    area += (x1 * y2 - x2 * y1);
  }
  return Math.abs(area) / 2;
}

// 计算单个环的质心
function calculateRingCentroid(ring) {
  let centroidX = 0;
  let centroidY = 0;
  let len = ring.length;
  for (let i = 0; i < len; i++) {
    let x1 = ring[i][0];
    let y1 = ring[i][1];
    let x2 = ring[(i + 1) % len][0];
    let y2 = ring[(i + 1) % len][1];
    let factor = (x1 * y2 - x2 * y1);
    centroidX += (x1 + x2) * factor;
    centroidY += (y1 + y2) * factor;
  }
  let area = calculateRingArea(ring);
  if (area !== 0) {
    centroidX /= (6 * area);
    centroidY /= (6 * area);
  }
  return [centroidX, centroidY];
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
}

// ✅ **确保数据加载完成后再 redraw()**
function checkDataLoaded() {
  if (departementsGeoJSON && rentalDataArray.length > 0) {
    console.log("✅ 所有数据加载完成，开始绘制！");
    dataLoaded = true;
    redraw(); // 重新触发 draw()
  }
}
