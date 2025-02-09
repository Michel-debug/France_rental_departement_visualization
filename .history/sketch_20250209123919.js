let rentalData = {}; // 存储租金数据（字典格式）
let rentalDataArray = [];
let departementsGeoJSON;
let dataLoaded = false; // 数据加载标志
const MIN_PRICE = 5;
const MAX_PRICE = 30;

let etablissementsData = [];
let cyclingStationsData = [];
let bikeIcon;

let etablissementStastic = [];
let stationDeptData = [];
let etabDeptTotals = {};
let stationDeptTotals = {};

let minCap = Infinity, maxCap = -Infinity;

selectedDept = null;
let deptBbox = null;
let hoveredItem = null;

function setup() {
  createCanvas(1400, 1200);
  noLoop(); // 等数据加载完成后再 redraw()

  startColor = color(135, 206, 250);
  endColor = color(0, 0, 139);

  // ✅ 加载租金 JSON 数据
  loadJSON('data/departement_rental_data.json', function (data) {
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
  loadJSON('data/departements.geojson', function (data) {
    departementsGeoJSON = data;
    console.log("✅ GeoJSON 数据加载成功:", departementsGeoJSON);
    checkDataLoaded();
  });

  // load cycling station data
  loadJSON('data/cycling_stations_departement.json', function (data) {
    cyclingStationsData = data;

    for (let st of cyclingStationsData) {
      if (st.capacite < minCap) minCap = st.capacite;
      if (st.capacite > maxCap) maxCap = st.capacite;
    }
    console.log("✅ Cycling station data loaded:", cyclingStationsData);
    console.log("Capacity range:", minCap, "~", maxCap);
    checkDataLoaded();
  });

  // load etablissement data 
  loadJSON('data/etablissement_departement.json', function (data) {
    etablissementsData = data;
    console.log("✅ Etablissement data loaded:", etablissementsData);
    checkDataLoaded();
  });

  loadJSON('data/etablissement_statistic.json', function (data) {
    etablissementStastic = data;
    console.log("✅ Etablissement stastic data loaded:", etablissementStastic);
    checkDataLoaded();
  });

  loadJSON('data/cycling_stations_statistic.json', function (data) {
    stationDeptData = data;
    console.log("✅ Cycling station statistic data loaded:", stationDeptData);
    checkDataLoaded();
  });
  // load bike icon
  bikeIcon = loadImage('data/bike_station.png');
  privateIcon = loadImage('data/private.png');
  publicIcon = loadImage('data/public.png');
}

function aggregateEtablissementData() {
  etabDeptTotals = {};
  for(let e of etablissementStastic) {
    let dept = e.departement_code;
    let c = e.count;
    if(etabDeptTotals[dept]) {
      etabDeptTotals[dept] += c;
    } else {
      etabDeptTotals[dept] = c;
    }
  }
}

function aggregateStations(){
  stationDeptTotals = {};
  for(let s of stationDeptData) {
    let dept = s.departement_code;
    let c = s.count;
    if(stationDeptTotals[dept]) {
      stationDeptTotals[dept] += c;
    } else {
      stationDeptTotals[dept] = c;
    }
  }
}


function drawPieChartEtablissements(){
  
}

function getDeptBoundingBox(deptCode) {
  let features = departementsGeoJSON.features;
  let geom = null;
  for (let f of features) {
    if (f.properties.code === deptCode) {
      geom = f.geometry;
      break;
    }
  }
  console.log("Selected dept geometry: ", geom);
  let minLon = 999, maxLon = -999;
  let minLat = 999, maxLat = -999;

  // 递归处理 Polygon / MultiPolygon
  if (geom.type === "Polygon") {
    for (let ring of geom.coordinates) {
      for (let coord of ring) {
        let lon = coord[0];
        let lat = coord[1];
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  } else if (geom.type === "MultiPolygon") {
    for (let polygon of geom.coordinates) {
      for (let ring of polygon) {
        for (let coord of ring) {
          let lon = coord[0];
          let lat = coord[1];
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }
  }

  return { minLon, maxLon, minLat, maxLat };
}

function drawSinglePolygonInBbox(ring, bbox) {
  beginShape();
  for (let coord of ring) {
    let lon = coord[0];
    let lat = coord[1];
    let sx = map(lon, bbox.minLon, bbox.maxLon, 50, width - 50);
    // lat越大越往上 => 需要反转
    let sy = map(lat, bbox.minLat, bbox.maxLat, height - 50, 50);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawIconLegend() {
  // 决定一下图例在画布右上角，稍微留点边距
  let legendX = width - 600;
  let legendY = 100;
  let iconSize = 24; 
  let lineSpacing = 35; // 每行的垂直间距
  let textOffsetX = 30; // 文字相对图标的水平偏移
  let boxWidth = 200;
  let boxHeight = 120; // 大概够放3行

  // 画背景框(可选)
  fill(255, 230);
  stroke(0);
  rect(legendX, legendY, boxWidth, boxHeight, 8);

  // 设置绘制模式
  imageMode(CORNER);
  textAlign(LEFT, CENTER);
  textSize(14);
  fill(0);
  noStroke();

  // 第1行: Public school
  image(publicIcon, legendX + 5, legendY + 5, iconSize, iconSize);
  text("Public School", legendX + 5 + iconSize + textOffsetX, legendY + 5 + iconSize/2);

  // 第2行: Private school
  let secondLineY = legendY + 5 + lineSpacing;
  image(privateIcon, legendX + 5, secondLineY, iconSize, iconSize);
  text("Private School", legendX + 5 + iconSize + textOffsetX, secondLineY + iconSize/2);

  // 第3行: Bike station
  let thirdLineY = legendY + 5 + 2 * lineSpacing;
  image(bikeIcon, legendX + 5, thirdLineY, iconSize, iconSize);
  text("Cycling Station", legendX + 5 + iconSize + textOffsetX, thirdLineY + iconSize/2);
}

function drawCapacityLegend() {
  let legendX = width - 200;
  let legendY = 50;
  let legendW = 20;
  let legendH = 200;
  noStroke();
  for (let i = 0; i < legendH; i++) {
    // i 从 0~(legendH-1)
    let t = i / (legendH - 1); // 确保 t=0 → 灰色起点，t=1 → 黑色终点
    // 计算灰度值（从 128 到 0 线性递减）
    let grayVal = Math.round(lerp(128, 0, t));
    // 直接设置灰度颜色（RGB 相同值）
    fill(grayVal, grayVal, grayVal);

    // 画 1px 高度的矩形
    rect(legendX, legendY + (legendH - i), legendW, 1);
  }

  // 边框
  stroke(0);
  noFill();
  rect(legendX, legendY, legendW, legendH);

  // 文字说明: capacity min / max
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);

  text(`high capacity`, legendX + legendW + 10, legendY );
 
  text(`low capacity`, legendX + legendW + 10, legendY + legendH );
  let iconSize = 20;
  let iconX = legendX - 15 - iconSize;
  let iconY = legendY - 15;
  imageMode(CENTER);
  image(bikeIcon, iconX, iconY, iconSize, iconSize);
  text("Bike Capacity", legendX - 15, legendY - 15 );
}


function mouseClicked() {
  if (!dataLoaded) return;
  if (selectedDept == null) {
    let features = departementsGeoJSON.features;
    let foundDept = null;
    for (let i = 0; i < features.length; i++) {
      let dept = features[i];
      let deptCode = dept.properties.code;
      let inside = isPointInDept(mouseX, mouseY, dept.geometry);
      if (inside) {
        foundDept = deptCode;
        break;
      }
    }
    if (foundDept) {
      console.log("Selected dept: ", foundDept);
      selectedDept = foundDept;
      deptBbox = getDeptBoundingBox(selectedDept);
      redraw();
    }
  } else {
    let btnX = 20, btnY = 20;
    let btnW = 80, btnH = 30;
    if (
      mouseX >= btnX && mouseX <= btnX + btnW &&
      mouseY >= btnY && mouseY <= btnY + btnH
    ) {
      // 点中了“Back”按钮 => 返回全国地图
      selectedDept = null;
      deptBbox = null;
      redraw();
    }
  }
}
function drawDeptEtablissements(deptCode) {
  let bestDist = Infinity;
  // 遍历 etablissementData，过滤出 departement_code == deptCode
  for (let e of etablissementsData) {

    if (e.departement_code === deptCode) {

      let lon = e.X;
      let lat = e.Y;

      // 将地理坐标映射到屏幕
      let sx = map(lon, deptBbox.minLon, deptBbox.maxLon, 50, width - 50);
      // 注意：lat 一般是往上的，要反转一下
      let sy = map(lat, deptBbox.minLat, deptBbox.maxLat, height - 50, 50);
      // 根据 secteur 选择颜色
      let secteur = e["secteur d'\u00e9tablissement"] || "public";
      // 你也可以统一改成 e.secteur
      let iconImg = (secteur === "public") ? publicIcon : privateIcon;

      tint(255, 255)
      imageMode(CENTER);
      image(iconImg, sx, sy, 28, 28);

      let d = dist(mouseX, mouseY, sx, sy);
      if (d < 14 && d < bestDist) {
        bestDist = d;
        hoveredItem = {
          type: "etablissement",
          x: sx,
          y: sy,
          data: e
        };
      }
    }
  }
}

function drawDeptCyclingStations(deptCode) {

  let bestDist = Infinity;
  let flickerAlpha = 200 + 55 * sin(frameCount * 0.2);
  for (let station of cyclingStationsData) {
    if (station.departement_code === deptCode) {
      let lon = station.X;
      let lat = station.Y;
      let capacite = station.capacite;

      // 映射到屏幕
      let sx = map(lon, deptBbox.minLon, deptBbox.maxLon, 50, width - 50);
      let sy = map(lat, deptBbox.minLat, deptBbox.maxLat, height - 50, 50);

      let baseAlpha = map(capacite, minCap, maxCap, 80, 255);
      let alphaVal = lerp(baseAlpha, flickerAlpha, 0.5);
      push();
      imageMode(CENTER);
      tint(255, alphaVal);
      image(bikeIcon, sx, sy, 20, 20);
      pop();
      // 显示容量信息，可选
      let d = dist(mouseX, mouseY, sx, sy);
      if (d < 12 && d < bestDist) {
        bestDist = d;
        hoveredItem = {
          type: "station",
          x: sx,
          y: sy,
          data: station
        };
      }
    }
  }
}

function drawTooltip(item) {
  let infoText = "";
  if (item.type === "station") {
    let st = item.data;
    infoText = `Cycling Station
      Capacity: ${st.capacite}
      Acces: ${st.acces}
      Mobilier: ${st.mobilier}
      gratuit: ${st.gratuit}`;
  } else if (item.type === "etablissement") {
    let e = item.data;
    infoText = `Etablissement name: ${e["name"]}
    Type: ${e["type d'\u00e9tablissement"]}
    Secteur: ${e["secteur d'\u00e9tablissement"]}`;
  }

  // 准备绘制
  textSize(12);
  textAlign(LEFT, TOP);

  // 拆分多行
  let lines = infoText.split('\n');

  // 找最宽的一行
  let maxW = 0;
  for (let line of lines) {
    let w = textWidth(line);
    if (w > maxW) maxW = w;
  }

  let lineH = 16;       // 行高
  let padding = 6;
  let boxW = maxW + padding * 2;
  let boxH = lineH * lines.length + padding * 2;

  // 计算 tooltip 位置，防止溢出
  let tooltipX = item.x + 10;
  let tooltipY = item.y + 10;
  if (tooltipX + boxW > width) {
    tooltipX = width - boxW - 10;
  }
  if (tooltipY + boxH > height) {
    tooltipY = height - boxH - 10;
  }

  // 画背景
  fill(255, 230);
  stroke(0);
  rect(tooltipX, tooltipY, boxW, boxH, 5);

  // 画文字
  fill(0);
  noStroke();
  let ty = tooltipY + padding;
  for (let line of lines) {
    text(line, tooltipX + padding, ty);
    ty += lineH;
  }
}


// ====================== 关键：改用 mouseMoved() 触发 redraw() =====================
// 当鼠标移动时，自动调用 redraw()，以实现动态效果
function mouseMoved() {
  if (dataLoaded) {
    redraw();
  }
}

// 新增函数：判断点是否在部门内
function isPointInDept(x, y, geometry) {
  const coords = geometry.coordinates;
  const type = geometry.type;

  if (type === 'Polygon') {
    return checkPolygon(x, y, coords);
  }
  if (type === 'MultiPolygon') {
    for (let polygon of coords) {
      if (checkPolygon(x, y, polygon)) return true;
    }
  }
  return false;
}

// 辅助函数：检查单个多边形
function checkPolygon(x, y, coordinates) {
  const screenPoly = coordinates[0].map(coord => {
    const px = map(coord[0], -5, 10, 50, width - 50);
    const py = map(coord[1], 41, 51, height - 50, 50);
    return { x: px, y: py };
  });
  return isPointInPolygon(x, y, screenPoly);
}

// 新增函数：射线法判断点是否在多边形内
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// --------------- 绘制箱线图 (可与之前一致) ---------------
function drawBoxPlot(deptCode) {
  const data = rentalData[deptCode];
  if (!data || !data.min || !data.q1 || !data.median || !data.q3 || !data.max) return;

  // 设置绘图参数
  const plotX = 50;
  const plotY = 50; // 调整起始 Y 坐标，确保与文本不重叠
  const plotWidth = 320;
  const plotHeight = 150;

  fill(255, 120);
  stroke(0);
  rect(plotX, plotY, plotWidth, plotHeight, 5);

  // 定义动态放大比例
  const expansionFactor = 0.2;
  const expandedMin = data.min - (data.max - data.min) * expansionFactor;
  const expandedMax = data.max + (data.max - data.min) * expansionFactor;

  // 映射函数
  const priceToY = price => {
    return map(price,
      expandedMin,
      expandedMax,
      plotY + plotHeight - 30,
      plotY + 30
    );
  };

  // 计算数据点坐标
  const minY = priceToY(data.min);
  const q1Y = priceToY(data.q1);
  const medianY = priceToY(data.median);
  const q3Y = priceToY(data.q3);
  const maxY = priceToY(data.max);

  // 绘制箱线图
  const boxX = plotX + 180;
  const boxWidth = 80;

  // 绘制须线
  stroke(0);
  line(boxX + boxWidth / 2, minY, boxX + boxWidth / 2, maxY);
  line(boxX, minY, boxX + boxWidth, minY);
  line(boxX, maxY, boxX + boxWidth, maxY);

  // 绘制箱体
  fill('#ADD8E6');
  rect(boxX, q3Y, boxWidth, q1Y - q3Y);

  // 绘制中位线
  stroke(255, 0, 0);
  line(boxX, medianY, boxX + boxWidth, medianY);

  // 绘制文本标签
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT);

  const textStartY = maxY - 20;
  text(`Dept: ${deptCode}`, plotX + 20, textStartY);
  text(`Min: ${data.min.toFixed(1)} €`, plotX + 20, textStartY + 20);
  text(`Q1: ${data.q1.toFixed(1)} €`, plotX + 20, textStartY + 40);
  text(`Median: ${data.median.toFixed(1)} €`, plotX + 20, textStartY + 60);
  text(`Q3: ${data.q3.toFixed(1)} €`, plotX + 20, textStartY + 80);
  text(`Max: ${data.max.toFixed(1)} €`, plotX + 20, textStartY + 100);
}

// 改造后的单个多边形绘制：可传入 scaleFactor
function drawSinglePolygon(ring, scaleFactor = 1, fillCol = '#ADD8E6') {
  // 先把原始坐标转换到屏幕坐标
  let screenCoords = ring.map(coord => {
    let x = map(coord[0], -5, 10, 50, width - 50);
    let y = map(coord[1], 41, 51, height - 50, 50);
    return createVector(x, y);
  });

  // 计算质心(屏幕坐标)
  let centroid = calculateCentroidScreen(screenCoords);

  // 开始绘制
  fill(fillCol);
  stroke(100);
  beginShape();
  for (let v of screenCoords) {
    // 如果要放大，就围绕质心进行缩放
    let sx = centroid.x + scaleFactor * (v.x - centroid.x);
    let sy = centroid.y + scaleFactor * (v.y - centroid.y);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 计算屏幕坐标下的质心
function calculateCentroidScreen(screenCoords) {
  if (!screenCoords || screenCoords.length === 0) return createVector(0, 0);
  let xSum = 0, ySum = 0;
  for (let v of screenCoords) {
    xSum += v.x;
    ySum += v.y;
  }
  let len = screenCoords.length;
  return createVector(xSum / len, ySum / len);
}

// 原先多边形质心（地理坐标）不再直接用于放大，但可以用来做文字标签
function calculateCentroidGeo(ring) {
  let xSum = 0, ySum = 0;
  for (let coord of ring) {
    xSum += coord[0];
    ySum += coord[1];
  }
  let len = ring.length;
  return [xSum / len, ySum / len];
}

// =============== 核心：绘制所有部门，并检测鼠标悬停 ===============
function drawDepartments() {
  let features = departementsGeoJSON.features;
  let hoveredDept = null; // 记录鼠标悬停的部门
  let hoveredDeptMedian = null; // 用于后续显示标签

  for (let i = 0; i < features.length; i++) {
    let dept = features[i];
    let geometryType = dept.geometry.type;
    let coordinates = dept.geometry.coordinates;
    let deptCode = dept.properties.code;
    let rentalInfo = rentalData[deptCode];
    let medianPrice = rentalInfo ? rentalInfo.median : null;

    // 先判断是否鼠标在本部门内
    let inside = isPointInDept(mouseX, mouseY, dept.geometry);

    // 如果在本部门内，就记录一下
    if (inside) {
      hoveredDept = deptCode;
      hoveredDeptMedian = medianPrice;
    }

    // 决定颜色
    let fillCol;
    if (medianPrice !== null) {
      let t = map(medianPrice, MIN_PRICE, MAX_PRICE, 0, 1, true);
      fillCol = lerpColor(startColor, endColor, t);
    } else {
      fillCol = color('#ADD8E6');
    }

    // 如果 inside，就设置一个放大系数和高亮色
    let scaleFactor = inside ? 1.1 : 1.0;
    // 也可改成 fillCol 更亮一点，示例:
    // let highlightCol = inside ? color(red(fillCol)+50, green(fillCol)+50, blue(fillCol)+50) : fillCol;
    // 这里简单用原始 fillCol
    let highlightCol = fillCol;

    // 绘制该几何
    if (geometryType === "Polygon") {
      // 每个 ring 分开绘制（外环+内环们）
      for (let ring of coordinates) {
        drawSinglePolygon(ring, scaleFactor, highlightCol);
      }
    } else if (geometryType === "MultiPolygon") {
      // MultiPolygon：多个 polygon，每个有多个 ring
      for (let polygon of coordinates) {
        for (let ring of polygon) {
          drawSinglePolygon(ring, scaleFactor, highlightCol);
        }
      }
    } else {
      console.warn("未知的几何类型: ", geometryType);
    }

    // ============ 绘制部门文字(使用地理质心) ============
    // 这里为了简单，仍然用原先方法：取外环做质心
    let labelCentroid;
    if (geometryType === "Polygon") {
      labelCentroid = calculateCentroidGeo(coordinates[0]);
    } else if (geometryType === "MultiPolygon") {
      // 多多边形，简单做法：拼成一个大数组再求质心
      let allPoints = [];
      for (let polygon of coordinates) {
        let outerRing = polygon[0];
        allPoints = allPoints.concat(outerRing);
      }
      labelCentroid = calculateCentroidGeo(allPoints);
    }

    // 映射到屏幕并绘制文字
    if (labelCentroid) {
      let labelX = map(labelCentroid[0], -5, 10, 50, width - 50);
      let labelY = map(labelCentroid[1], 41, 51, height - 50, 50);
      fill(0);
      textSize(10);
      textAlign(CENTER);
      if (medianPrice !== null) {
        text(`${dept.properties.nom}\n${medianPrice.toFixed(1)} €/m²`, labelX, labelY);
      } else {
        text(`${dept.properties.nom}\n No Data`, labelX, labelY);
      }
    }
  }

  // 如果鼠标悬停在某个部门，就绘制箱线图
  if (hoveredDept) {
    drawBoxPlot(hoveredDept);
  }
}

// ✅ **确保数据加载完成后再 redraw()**
function checkDataLoaded() {
  if (
    departementsGeoJSON &&
    rentalDataArray.length > 0 &&
    etablissementsData.length > 0 &&
    cyclingStationsData.length > 0 &&
    etablissementStastic.length > 0 &&
    stationDeptData.length > 0 &&
    bikeIcon
  ) {
    dataLoaded = true;
    redraw(); // 数据准备就绪后，触发一次初始绘制
  }
}

// --------------- 绘制图例 (Legend) ---------------
function drawLegend() {
  let legendX = width - 60;
  let legendY = 50;
  let legendHeight = 200;
  let legendWidth = 20;

  // 做一个渐变条(从 MIN_PRICE -> MAX_PRICE)
  noStroke();
  for (let i = 0; i < legendHeight; i++) {
    let value = map(i, 0, legendHeight, MIN_PRICE, MAX_PRICE);
    let t = map(value, MIN_PRICE, MAX_PRICE, 0, 1, true);
    let c = lerpColor(color('#ADD8E6'), endColor, t);
    fill(c);
    rect(legendX - 20, legendY + i, legendWidth, 1);
  }

  // 边框
  stroke(0);
  noFill();
  rect(legendX - 20, legendY, legendWidth, legendHeight);

  // 文字说明
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${MIN_PRICE} €/m²`, legendX + legendWidth - 15, legendY);
  text(`${MAX_PRICE} €/m²`, legendX + legendWidth - 15, legendY + legendHeight);
  text("Rent average", legendX - 15, legendY - 15);
}

function drawSelectedDeptMap(deptCode) {
  // 找到对应 geometry
  let features = departementsGeoJSON.features;
  let targetFeature = null;
  for (let f of features) {
    if (f.properties.code === deptCode) {
      targetFeature = f;
      break;
    }
  }
  if (!targetFeature) {
    console.warn("Can not find: " + deptCode);
    return;
  }

  let geometryType = targetFeature.geometry.type;
  let coordinates = targetFeature.geometry.coordinates;

  // 只绘制选中部门的 polygon
  fill('#ADD8E6');
  stroke(50);

  if (geometryType === "Polygon") {
    for (let ring of coordinates) {
      drawSinglePolygonInBbox(ring, deptBbox);
    }
  } else if (geometryType === "MultiPolygon") {
    for (let polygon of coordinates) {
      for (let ring of polygon) {
        drawSinglePolygonInBbox(ring, deptBbox);
      }
    }
  }
}

function drawBackButton() {
  let btnX = 20, btnY = 20;
  let btnW = 80, btnH = 30;

  fill(200);
  stroke(0);
  rect(btnX, btnY, btnW, btnH, 5);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(14);
  text("Back", btnX + btnW / 2, btnY + btnH / 2);
}

function draw() {
  background(255);

  if (!dataLoaded) {
    textSize(20);
    textAlign(CENTER, CENTER);
    fill(100);
    text("Loading data...", width / 2, height / 2);
    return;
  }
  hoveredItem = null;

  if (selectedDept == null) {
    // —— 全国模式：绘制全国地图 + 租金颜色
    drawDepartments();    // 即你原先的整块逻辑
    drawLegend();         // 租金图例
  } else {
    // —— 部门模式：只绘制选中部门 + 该部门内的学校 + 自行车站点
    drawSelectedDeptMap(selectedDept);
    drawDeptCyclingStations(selectedDept);
    drawDeptEtablissements(selectedDept);
    drawBackButton();
    drawCapacityLegend();
    drawIconLegend();
  }
  if (hoveredItem) {
    drawTooltip(hoveredItem);
  }
}
