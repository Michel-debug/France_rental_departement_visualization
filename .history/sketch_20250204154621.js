let rentalData = {}; // 存储租金数据（字典格式）
let rentalDataArray = [];
let departementsGeoJSON;
let dataLoaded = false; // 数据加载标志
const MIN_PRICE = 5;  
const MAX_PRICE = 30;

let etablissementsData = [];
let cyclingStationData = [];
let bikeIcon;


selectedDept = null;
deptBox = null;
// 取消单击选中，改为悬停
// let selectedDept = null;

function setup() {
  createCanvas(1400, 1200);
  noLoop(); // 等数据加载完成后再 redraw()
  
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

  // load cycling station data
  loadJSON('data/cycling_stations_departement.json', function(data) {
    cyclingStationData = data;
    console.log("✅ Cycling station data loaded:", cyclingStationData);
    checkDataLoaded();
  });

  // load etablissement data 
  loadJSON('data/etablissement_departement.json', function(data) {
    etablissementsData = data;
    console.log("✅ Etablissement data loaded:", etablissementsData);
    checkDataLoaded();
  });

  // load bike icon
  bikeIcon = loadImage('data/bike_station.png');
}

function getDeptBoudingBox

function mouseClicked(){
  if(!dataLoaded) return;
  if(selectedDept == null){
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
  if(foundDept){
    console.log("Selected dept: ", foundDept);
    selectedDept = foundDept;
    deptBox = getDeptBoudingBox(selectedDept);
    redraw();
  }
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
    return {x: px, y: py};
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

  fill(255,120);
  stroke(0);
  rect(plotX, plotY, plotWidth, plotHeight,5);

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
  const minY    = priceToY(data.min);
  const q1Y     = priceToY(data.q1);
  const medianY = priceToY(data.median);
  const q3Y     = priceToY(data.q3);
  const maxY    = priceToY(data.max);

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

function draw() {
  background(255);
  if (!dataLoaded) {
    console.log("⌛ 数据加载中...");
    textSize(20);
    textAlign(CENTER, CENTER);
    fill(100);
    text("Loading data...", width / 2, height / 2);
    return;
  }

  // 绘制所有区域 & 悬停检测
  drawDepartments();

  // 绘制图例
  drawLegend();

}
