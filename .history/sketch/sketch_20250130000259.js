// let rentalData = {}; // 存储租金数据（字典格式）
// let rentalDataArray = [];
// let departementsGeoJSON;
// let dataLoaded = false; // 数据加载标志

// function setup() {
//   createCanvas(1400, 1000);
//   noLoop(); // 先停止自动绘制，等数据加载完成后再 redraw()
  
//   // ✅ 加载租金 JSON 数据
//   loadJSON('data/departement_rental_data.json', function(data) {
//     if (Array.isArray(data)) {
//       rentalDataArray = data; // 赋值数组数据
//       data.forEach(item => {
//         rentalData[item.departement_code] = item; // 转换为字典格式
//       });
//       console.log("✅ 租金 JSON 数据加载成功:", rentalData);
//     } else {
//       console.error("❌ rentalDataArray 不是数组:", data);
//     }
//     checkDataLoaded();
//   });

//   // ✅ 加载 GeoJSON 数据
//   loadJSON('data/departements.geojson', function(data) {
//     departementsGeoJSON = data;
//     console.log("✅ GeoJSON 数据加载成功:", departementsGeoJSON);
//     checkDataLoaded();
//   });
// }
// function drawdepartement(coordinates) {
//   if (coordinates.length > 1) {
//     // 处理 MultiPolygon（多个多边形）
//     for (let polygon of coordinates) {
//       drawSinglePolygon(polygon);
//     }
//   } else {
//     // 处理单个 Polygon
//     drawSinglePolygon(coordinates[0]);
//   }
// }

// function drawSinglePolygon(polygon) {
//   beginShape();
//   for (let coord of polygon) {
//     let x = map(coord[0], -5, 10, 50, width - 50); // 经度映射到画布
//     let y = map(coord[1], 41, 51, height - 50, 50); // 纬度映射到画布
//     vertex(x, y);
//   }
//   endShape(CLOSE);
// }

// function drawDepartments() {
//   let features = departementsGeoJSON.features;
//   console.log("🚀 开始绘制区域:", features.length);

//   for (let i = 0; i < features.length; i++) {
//     let dept = features[i];
//     let geometryType = dept.geometry.type;     // 可能是 "Polygon" 或 "MultiPolygon"
//     let coordinates = dept.geometry.coordinates;
//     let deptCode = dept.properties.code;       // 区域代码

//     // 获取该区域对应的租金数据
//     let rentalInfo = rentalData[deptCode];
//     let medianPrice = rentalInfo ? rentalInfo.median : null;

//     // 根据 medianPrice 映射颜色
//     let colorValue;
//     if (medianPrice !== null) {
//       colorValue = map(medianPrice, 10, 35, 200, 30); // 可根据你的数据分布调整
//     } else {
//       colorValue = 220;  // 没有数据就用灰色
//     }
//     fill(colorValue);
//     stroke(100);

//     // ============= 关键区别：Polygon vs MultiPolygon ============
//     if (geometryType === "Polygon") {
//       // geometry.coordinates 是一个“二维数组” [ [ring1], [ring2], ... ]
//       // 每个 ring 都要绘制（第一个 ring 通常是外环，后续可能是内环/洞）
//       for (let ring of coordinates) {
//         drawSinglePolygon(ring);
//       }
//     } else if (geometryType === "MultiPolygon") {
//       // geometry.coordinates 是一个“三维数组” [ [ [ring1], [ring2] ], [ [ring1], ...] ... ]
//       // 先遍历子多边形 polygon，然后绘制各个 ring
//       for (let polygon of coordinates) {
//         for (let ring of polygon) {
//           drawSinglePolygon(ring);
//         }
//       }
//     } else {
//       // 如果有其他类型，先打印一下看是什么
//       console.warn("未知的几何类型: ", geometryType);
//     }

//     // ============ 计算质心并绘制文字 ============
//     // 对于多多边形，如何选取质心？这里简单示例：取第一个多边形的第一个 ring。
//     // 如果要更准确，需要计算所有多边形的合并中心或面积加权中心。
//     let labelCentroid;
//     if (geometryType === "Polygon") {
//       labelCentroid = calculateCentroid(coordinates[0]); // 取外环
//     } else if (geometryType === "MultiPolygon") {
//       labelCentroid = calculateCentroid(coordinates[0][0]); // 取第一个多边形的外环
//     }

//     // 将质心的经纬度映射到画布坐标
//     if (labelCentroid) {
//       let labelX = map(labelCentroid[0], -5, 10, 50, width - 50);
//       let labelY = map(labelCentroid[1], 41, 51, height - 50, 50);
//       fill(0);
//       textSize(10);
//       textAlign(CENTER);

//       if (medianPrice !== null) {
//         text(`${dept.properties.nom}\n${medianPrice.toFixed(1)} €/m²`, labelX, labelY);
//       } else {
//         text(`${dept.properties.nom}\n no datasets`, labelX, labelY);
//       }
//     }
//   }
// }


// // 计算多边形的质心，用于显示标签
// function calculateCentroid(ring) {
//   if (!ring || ring.length === 0) return null;
//   let xSum = 0, ySum = 0;
//   for (let coord of ring) {
//     xSum += coord[0];
//     ySum += coord[1];
//   }
//   let len = ring.length;
//   return [xSum / len, ySum / len];
// }

// function draw() {
//   background(240);
//   if (dataLoaded) {
//     console.log("🎯 数据加载完毕，开始绘制...");
//     drawDepartments(); // **只有数据加载完成后才执行绘制**
//   } else {
//     console.log("⌛ 数据加载中...");
//     textSize(20);
//     textAlign(CENTER, CENTER);
//     fill(100);
//     text("Loading data...", width / 2, height / 2);
//   }
// }

// // ✅ **确保数据加载完成后再 redraw()**
// function checkDataLoaded() {
//   if (departementsGeoJSON && rentalDataArray.length > 0) {
//     console.log("✅ 所有数据加载完成，开始绘制！");
//     dataLoaded = true;
//     redraw(); // 重新触发 draw()
//   }
// }

let departmentsData = [];   // 用来保存每个 department 的多边形、颜色等信息
let selectedDept = null;    // 当前被选中的区域（点击后才显示详细信息）

// 最低和最高的价格，用于 map() 映射颜色（你可根据实际数据情况修改）
const MIN_PRICE = 5;  
const MAX_PRICE = 50;

// --------------- p5.js 入口 ---------------
function setup() {
  createCanvas(1000, 800);
  noLoop(); // 等数据都处理完再一次性绘制

  // 加载 JSON (异步)
  loadJSON("data/departements.geojson", function(geoData) {
    loadJSON("data/departement_rental_data.json", function(rentalArray) {
      // 将 rentalArray 转换成字典或类似结构
      let rentalDict = {};
      rentalArray.forEach(d => {
        rentalDict[d.region_code] = d; 
      });
      // 初始化 departmentsData
      initDepartmentsData(geoData, rentalDict);
      // 数据准备完毕后，重绘一次
      redraw();
    });
  });
}

function draw() {
  background(240);

  // 绘制所有 Department
  drawDepartments();

  // 如果有被选中的 Dept，显示详细信息
  if (selectedDept) {
    drawInfoBox(selectedDept);
  }

  // 绘制图例（legend）
  drawLegend();
}

// --------------- 初始化部门数据 ---------------
function initDepartmentsData(geoData, rentalDict) {
  let features = geoData.features;
  for (let f of features) {
    let geometryType = f.geometry.type;
    let coordinates = f.geometry.coordinates;
    let deptCode = f.properties.code;
    let deptName = f.properties.nom;

    // 获取租金信息
    let rentalInfo = rentalDict[deptCode];
    let medianPrice = rentalInfo ? rentalInfo.median : 0;  // 若无数据，默认0

    // 计算对应的颜色
    // 如果你不想让0都挤在 map(0->...)，可先限制最小值
    let usePrice = medianPrice > 0 ? medianPrice : MIN_PRICE - 1; 
    let colorValue = map(usePrice, MIN_PRICE, MAX_PRICE, 200, 30, true);

    // 将各项信息存入 departmentsData
    departmentsData.push({
      code: deptCode,
      name: deptName,
      median: rentalInfo ? rentalInfo.median : null,
      geometryType,
      coordinates,
      colorValue
    });
  }
}

// --------------- 绘制所有部门 ---------------
function drawDepartments() {
  for (let dept of departmentsData) {
    fill(dept.colorValue);
    stroke(100);

    if (dept.geometryType === "Polygon") {
      // Polygon => coordinates 是二维数组
      for (let ring of dept.coordinates) {
        drawSingleRing(ring);
      }
    } else if (dept.geometryType === "MultiPolygon") {
      // MultiPolygon => coordinates 是三维数组
      for (let polygon of dept.coordinates) {
        for (let ring of polygon) {
          drawSingleRing(ring);
        }
      }
    }
  }
}

// --------------- 绘制单个 ring ---------------
function drawSingleRing(ring) {
  beginShape();
  for (let coord of ring) {
    let x = map(coord[0], -5, 10, 50, width - 50);
    let y = map(coord[1], 41, 51, height - 50, 50);
    vertex(x, y);
  }
  endShape(CLOSE);
}

// --------------- 点击事件 ---------------
function mouseClicked() {
  // 从上往下或从下往上遍历都行，这里示例从头到尾
  for (let dept of departmentsData) {
    // 先判断 geometryType
    // 如果鼠标在这个 dept 的多边形里，就将其设置为 selectedDept
    if (dept.geometryType === "Polygon") {
      // 遍历每个 ring
      for (let ring of dept.coordinates) {
        if (pointInPolygon(mouseX, mouseY, ring)) {
          // 点击到了这个部门
          selectedDept = dept;
          // 重新绘制
          redraw();
          return;
        }
      }
    } else if (dept.geometryType === "MultiPolygon") {
      // 遍历每个 polygon，每个 polygon 再遍历 ring
      for (let polygon of dept.coordinates) {
        for (let ring of polygon) {
          if (pointInPolygon(mouseX, mouseY, ring)) {
            selectedDept = dept;
            redraw();
            return;
          }
        }
      }
    }
  }

  // 如果点了地图的空白处，没有命中任何部门
  selectedDept = null;
  redraw();
}

// --------------- 判断一个点是否在 polygon 中 ---------------
function pointInPolygon(px, py, ring) {
  // 1) 先把 ring 的经纬度映射到屏幕坐标
  let screenCoords = ring.map(coord => {
    let sx = map(coord[0], -5, 10, 50, width - 50);
    let sy = map(coord[1], 41, 51, height - 50, 50);
    return [sx, sy];
  });

  // 2) 使用 Ray-Casting 算法或 winding number 算法做点在多边形判断
  // 下面是一个简易 Ray-Casting 实现
  let inside = false;
  for (let i = 0, j = screenCoords.length - 1; i < screenCoords.length; j = i++) {
    let xi = screenCoords[i][0], yi = screenCoords[i][1];
    let xj = screenCoords[j][0], yj = screenCoords[j][1];
    
    let intersect = ((yi > py) !== (yj > py)) &&
                    (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// --------------- 绘制选中信息 ---------------
function drawInfoBox(dept) {
  // 在鼠标位置右上角显示一个简易框
  let boxX = mouseX + 10;
  let boxY = mouseY + 10;
  let w = 120;
  let h = 50;

  push();
  stroke(0);
  fill(255, 240);
  rect(boxX, boxY, w, h, 5);

  fill(0);
  textSize(12);
  textAlign(LEFT, TOP);
  let txtName = `${dept.name}`;
  let txtMedian = dept.median ? `${dept.median.toFixed(1)} €/m²` : "无数据";
  text(txtName, boxX + 5, boxY + 5);
  text(txtMedian, boxX + 5, boxY + 25);
  pop();
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
    let inter = map(i, 0, legendHeight, MIN_PRICE, MAX_PRICE);
    let c = map(inter, MIN_PRICE, MAX_PRICE, 200, 30);  // 与上面的颜色映射一致
    fill(c);
    rect(legendX, legendY + i, legendWidth, 1);
  }

  // 边框
  stroke(0);
  noFill();
  rect(legendX, legendY, legendWidth, legendHeight);

  // 文字说明
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${MIN_PRICE} €/m²`, legendX + legendWidth + 5, legendY);
  text(`${M_PRICE} €/m²`, legendX + legendWidth + 5, legendY + legendHeight);

  // 你也可以在中间加些刻度，或者额外写个标题
  text("Rent legend", legendX-15, legendY-15);
}
