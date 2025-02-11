// (Other global variables remain unchanged)
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

let cnv;

// MODIFIED: Global variable to store the currently hovered department code.
let currentHoveredDept = null;

// MODIFIED: Global DOM elements for the distance input panel.
let distanceInput;
let distanceButton;
let tableDiv;

// MODIFIED: Global variable for precomputed distance data.
let etabCyclingDistances;

// NEW: Global variables for the new cycling station images.
let redImg, greenImg;

let extraMap; // p5.Graphics object for the extra (third) canvas in department mode
let highlightRows = [];       // GLOBAL: rows for highlighting cycling stations
let currentMaxDistance = 0;     // GLOBAL: holds the current maximum distance from the table
let distanceSubmitted = false;  // GLOBAL: flag set when the user submits a distance

let redStations = [];
let greenStations = [];

// MODIFIED: Global variable and functions for station highlighting.
let highlightStationCoord = null;
function highlightStation(x, y) {
  highlightStationCoord = createVector(x, y);
}
function clearHighlightStation() {
  highlightStationCoord = null;
}

let PIE_COLORS = [
  '#FFC0CB', '#FF69B4', '#FF1493', '#DB7093', '#C71585'
];

function setup() {
  // Attach canvas to "map-container"
  cnv = createCanvas(1400, 1200);
  cnv.parent("map-container");
  noLoop(); // Wait until data is loaded before redrawing

  startColor = color(135, 206, 250);
  endColor = color(0, 0, 139);

  // Load rental JSON
  loadJSON('data/departement_rental_data.json', function (data) {
    if (Array.isArray(data)) {
      rentalDataArray = data;
      data.forEach(item => {
        rentalData[item.departement_code] = item;
      });
      console.log("✅ Rental JSON loaded:", rentalData);
    } else {
      console.error("❌ rentalDataArray is not an array:", data);
    }
    checkDataLoaded();
  });

  // Load GeoJSON
  loadJSON('data/departements.geojson', function (data) {
    departementsGeoJSON = data;
    console.log("✅ GeoJSON loaded:", departementsGeoJSON);
    checkDataLoaded();
  });

  // Load cycling station data
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

  // Load etablissement data
  loadJSON('data/etablissement_departement.json', function (data) {
    etablissementsData = data;
    console.log("✅ Etablissement data loaded:", etablissementsData);
    checkDataLoaded();
  });

  loadJSON('data/etablissement_statistic.json', function (data) {
    etablissementStastic = data;
    console.log("✅ Etablissement statistic loaded:", etablissementStastic);
    checkDataLoaded();
  });

  loadJSON('data/cycling_stations_statistic.json', function (data) {
    stationDeptData = data;
    console.log("✅ Cycling station statistic loaded:", stationDeptData);
    checkDataLoaded();
  });
  
  // MODIFIED: Load the precomputed distances JSON
  loadJSON('data/etablissement_cycling_station_distance.json', function(data) {
    etabCyclingDistances = data;
    console.log("✅ Distance JSON loaded:", etabCyclingDistances);
    checkDataLoaded();
  });
  
  // Load icons
  bikeIcon = loadImage('data/bike_station.png');
  privateIcon = loadImage('data/private.png');
  publicIcon = loadImage('data/public.png');
  
  // NEW: Load new cycling station images (red and green)
  redImg = loadImage('data/marker_map_bike_red.png');
  greenImg = loadImage('data/marker_map_bike_green.png');
}

function aggregateEtablissementData() {
  for (let e of etablissementStastic) {
    let dept = e.departement_code;
    let c = e.count;
    if (etabDeptTotals[dept]) {
      etabDeptTotals[dept] += c;
    } else {
      etabDeptTotals[dept] = c;
    }
  }
}

function aggregateStations() {
  for (let s of stationDeptData) {
    let dept = s.departement_code;
    let c = s.count;
    if (stationDeptTotals[dept]) {
      stationDeptTotals[dept] += c;
    } else {
      stationDeptTotals[dept] = c;
    }
  }
}

/* MODIFIED: New function to count institutions by type for a given department */
function countInstitutionsByType(deptCode) {
  let counts = { "Université": 0, "École": 0, "Grand établissement": 0 };
  for (let e of etablissementsData) {
    if (e.departement_code === deptCode) {
      let type = e["type d'\u00e9tablissement"];
      if (type === "Universit\u00e9") {
        counts["Université"] += 1;
      } else if (type === "\u00c9cole") {
        counts["École"] += 1;
      } else {
        counts["Grand établissement"] += 1;
      }
    }
  }
  return counts;
}

function mergeSmallSlices(entries, threshold = 0.02) {
  let totalValue = entries.reduce((acc, e) => acc + e[1], 0);
  let merged = [];
  let othersCount = 0;
  for (let [dept, val] of entries) {
    let ratio = val / totalValue;
    if (ratio < threshold) {
      othersCount += val;
    } else {
      merged.push([dept, val]);
    }
  }
  if (othersCount > 0) {
    merged.push(["Others", othersCount]);
  }
  return merged;
}

function drawPieChartEtablissements(pieData, cx, cy, radius) {
  let totalValue = 0;
  for (let d in pieData) {
    totalValue += pieData[d][1];
  }
  if (totalValue === 0) return;
  let entries = Object.entries(pieData);
  entries.sort((a, b) => b[1] - a[1]);
  let lastAngle = 0;
  let colorIndex = 0;
  for (let e in entries) {
    let dept = entries[e][1][0];
    let val = entries[e][1][1];
    let angle = (val / totalValue) * TWO_PI;
    fill(PIE_COLORS[colorIndex % PIE_COLORS.length]);
    colorIndex++;
    stroke(0);
    arc(cx, cy, radius * 2, radius * 2, lastAngle, lastAngle + angle, PIE);
    let midAngle = lastAngle + angle / 2;
    let labelX = cx + (radius * 0.6) * cos(midAngle);
    let labelY = cy + (radius * 0.6) * sin(midAngle);
    fill(0);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    text(`${dept}\n(${val})`, labelX, labelY);
    lastAngle += angle;
  }
  fill(0);
  textSize(14);
  textAlign(CENTER);
  text("Etablissements by Dept (Pie)", cx, cy - radius - 20);
}

/* MODIFIED: New function to draw a pie chart for institutions breakdown */
function drawPieChartInstitutions(pieData, cx, cy, radius) {
  let totalValue = 0;
  for (let key in pieData) {
    totalValue += pieData[key];
  }
  if (totalValue === 0) return;
  let lastAngle = 0;
  let categoryColors = {
    "Université": color('#FFC0CB'),
    "\u00c9cole": color('#FF69B4'),
    "Grand établissement": color('#FF1493')
  };
  let categories = Object.keys(pieData);
  for (let i = 0; i < categories.length; i++) {
    let category = categories[i];
    let count = pieData[category];
    let angle = (count / totalValue) * TWO_PI;
    fill(categoryColors[category] || color(200));
    stroke(0);
    arc(cx, cy, radius * 2, radius * 2, lastAngle, lastAngle + angle, PIE);
    let midAngle = lastAngle + angle / 2;
    let labelX = cx + (radius * 0.6) * cos(midAngle);
    let labelY = cy + (radius * 0.6) * sin(midAngle);
    fill(0);
    noStroke();
    textSize(10);
    textAlign(CENTER, CENTER);
    text(`${category}\n(${count})`, labelX, labelY);
    lastAngle += angle;
  }
  fill(0);
  textSize(14);
  textAlign(CENTER);
  text("Institutions", cx, cy - radius - 20);
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
    let sy = map(lat, bbox.minLat, bbox.maxLat, height - 50, 50);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawIconLegend() {
  let legendX = width - 600;
  let legendY = 100;
  let iconSize = 24;
  let lineSpacing = 35;
  let textOffsetX = 30;
  let boxWidth = 200;
  let boxHeight = 120;
  fill(255, 230);
  stroke(0);
  rect(legendX, legendY, boxWidth, boxHeight, 8);
  imageMode(CORNER);
  textAlign(LEFT, CENTER);
  textSize(14);
  fill(0);
  noStroke();
  image(publicIcon, legendX + 5, legendY + 5, iconSize, iconSize);
  text("Public School", legendX + 5 + iconSize + textOffsetX, legendY + 5 + iconSize / 2);
  let secondLineY = legendY + 5 + lineSpacing;
  image(privateIcon, legendX + 5, secondLineY, iconSize, iconSize);
  text("Private School", legendX + 5 + iconSize + textOffsetX, secondLineY + iconSize / 2);
  let thirdLineY = legendY + 5 + 2 * lineSpacing;
  image(bikeIcon, legendX + 5, thirdLineY, iconSize, iconSize);
  text("Cycling Station", legendX + 5 + iconSize + textOffsetX, thirdLineY + iconSize / 2);
}

function drawCapacityLegend() {
  let legendX = width - 200;
  let legendY = 50;
  let legendW = 20;
  let legendH = 200;
  noStroke();
  for (let i = 0; i < legendH; i++) {
    let t = i / (legendH - 1);
    let grayVal = Math.round(lerp(128, 0, t));
    fill(grayVal, grayVal, grayVal);
    rect(legendX, legendY + (legendH - i), legendW, 1);
  }
  stroke(0);
  noFill();
  rect(legendX, legendY, legendW, legendH);
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${MIN_PRICE} €/m²`, legendX + legendW + 10, legendY);
  text(`${MAX_PRICE} €/m²`, legendX + legendW + 10, legendY + legendH);
  let iconSize = 20;
  let iconX = legendX - 15 - iconSize;
  let iconY = legendY - 15;
  imageMode(CENTER);
  image(bikeIcon, iconX, iconY, iconSize, iconSize);
  text("Bike Capacity", legendX - 15, legendY - 15);
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
      // console.log("Selected dept: ", foundDept);
      selectedDept = foundDept;
      deptBbox = getDeptBoundingBox(selectedDept);
      
      // Look up the full department name from the GeoJSON.
      let deptFeature = departementsGeoJSON.features.find(f => f.properties.code === foundDept);
      let deptName = deptFeature && deptFeature.properties.nom ? deptFeature.properties.nom : foundDept;
      
      // Update the department info header.
      let deptInfo = document.getElementById("dept-info");
      if (deptInfo) {
        deptInfo.querySelector("h1").innerHTML = "Department Details: " + deptName;
      }
      
      // Hide the main info-panel and show the department info.
      let infoPanel = document.getElementById("info-panel");
      if (infoPanel) infoPanel.style.display = "none";
      if (deptInfo) deptInfo.style.display = "block";
      
      // Show the table container.
      let tableContainer = document.getElementById("table-container");
      if (tableContainer) tableContainer.style.display = "block";
      
      redraw();
    }
  } else {
    let btnX = 20, btnY = 20;
    let btnW = 80, btnH = 30;
    if (
      mouseX >= btnX && mouseX <= btnX + btnW &&
      mouseY >= btnY && mouseY <= btnY + btnH
    ) {
      // "Back" button pressed.
      selectedDept = null;
      deptBbox = null;
      if (distanceInput) {
        distanceInput.remove();
        distanceInput = null;
      }
      if (distanceButton) {
        distanceButton.remove();
        distanceButton = null;
      }
      if (tableDiv) {
        tableDiv.remove();
        tableDiv = null;
      }
      // Hide the table container.
      let tableContainer = document.getElementById("table-container");
      if (tableContainer) tableContainer.style.display = "none";
      // Hide the department info and show the main info-panel.
      let deptInfo = document.getElementById("dept-info");
      if (deptInfo) deptInfo.style.display = "none";
      let infoPanel = document.getElementById("info-panel");
      if (infoPanel) infoPanel.style.display = "block";
      
      // NEW: Remove the extra map canvas if it exists.
      if (extraMap) {
        extraMap.remove();
        extraMap = null;
        document.getElementById("extra-map-container").style.display = "none";
      }
      
      redraw();
    }
  }
}

function drawDeptEtablissements(deptCode) {
  let bestDist = Infinity;
  for (let e of etablissementsData) {
    if (e.departement_code === deptCode) {
      let lon = e.X;
      let lat = e.Y;
      let sx = map(lon, deptBbox.minLon, deptBbox.maxLon, 50, width - 50);
      let sy = map(lat, deptBbox.minLat, deptBbox.maxLat, height - 50, 50);
      let secteur = e["secteur d'\u00e9tablissement"] || "public";
      let iconImg = (secteur === "public") ? publicIcon : privateIcon;
      tint(255, 255);
      imageMode(CENTER);
      image(iconImg, sx, sy, 28, 28);
      let d = dist(mouseX, mouseY, sx, sy);
      if (d < 14 && d < bestDist) {
        bestDist = d;
        hoveredItem = { type: "etablissement", x: sx, y: sy, data: e };
      }
    }
  }
}

function drawDeptCyclingStations(deptCode) {
  let bestDist = Infinity;
  let flickerAlpha = 200 + 55 * sin(frameCount * 0.2);

  // 如果你想对照 highlightRows 做一个 Map 方便查找，可以预先建一个
  // stationId => distance
  let highlightMap = {};
  if (highlightRows && highlightRows.length > 0) {
    highlightRows.forEach(row => {
      // 如果你的数据结构里有唯一ID，可以用 ID 做key。如果没有就需要用坐标等拼成key
      let key = `${row.X_station}-${row.Y_station}`;
      highlightMap[key] = row.distance;
    });
  }

  for (let station of cyclingStationsData) {
    if (station.departement_code !== deptCode) continue;
    
    let lon = station.X;
    let lat = station.Y;
    let sx = map(lon, deptBbox.minLon, deptBbox.maxLon, 50, width - 50);
    let sy = map(lat, deptBbox.minLat, deptBbox.maxLat, height - 50, 50);

    // 先看看此 station 是否在 highlightMap 里
    let key = `${station.X}-${station.Y}`;
      // 不在高亮列表中，就画默认或闪烁的图标
      let capacite = station.capacite;
      let baseAlpha = map(capacite, minCap, maxCap, 80, 255);
      let alphaVal = lerp(baseAlpha, flickerAlpha, 0.5);
      push();
      imageMode(CENTER);
      tint(255, alphaVal);
      image(bikeIcon, sx, sy, 20, 20);
      pop();
    

    // 下面是你原先做 hover 检测的逻辑
    let d = dist(mouseX, mouseY, sx, sy);
    if (d < 12 && d < bestDist) {
      bestDist = d;
      hoveredItem = { type: "station", x: sx, y: sy, data: station };
    }
  }
}


function drawTooltip(item) {
    let infoText = "";
    if (item.type === "station") {
      let st = item.data;
      infoText = `Cycling Station
        Capacity: ${st.capacite}
        Access: ${st.acces}
        Furniture: ${st.mobilier}
        Free: ${st.gratuit}`;
    } else if (item.type === "etablissement") {
      let e = item.data;
      infoText = `Institution Name: ${e["name"]}
      Type: ${e["type d'\u00e9tablissement"]}
      Sector: ${e["secteur d'\u00e9tablissement"]}`;
  }
  textSize(12);
  textAlign(LEFT, TOP);
  let lines = infoText.split('\n');
  let maxW = 0;
  for (let line of lines) {
    let w = textWidth(line);
    if (w > maxW) maxW = w;
  }
  let lineH = 16;
  let padding = 6;
  let boxW = maxW + padding * 2;
  let boxH = lineH * lines.length + padding * 2;
  let tooltipX = item.x + 10;
  let tooltipY = item.y + 10;
  if (tooltipX + boxW > width) {
    tooltipX = width - boxW - 10;
  }
  if (tooltipY + boxH > height) {
    tooltipY = height - boxH - 10;
  }
  fill(255, 230);
  stroke(0);
  rect(tooltipX, tooltipY, boxW, boxH, 5);
  fill(0);
  noStroke();
  let ty = tooltipY + padding;
  for (let line of lines) {
    text(line, tooltipX + padding, ty);
    ty += lineH;
  }
}

function mouseMoved() {
  if (dataLoaded) {
    redraw();
  }
}

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

function checkPolygon(x, y, coordinates) {
  const screenPoly = coordinates[0].map(coord => {
    const px = map(coord[0], -5, 10, 50, width - 50);
    const py = map(coord[1], 41, 51, height - 50, 50);
    return { x: px, y: py };
  });
  return isPointInPolygon(x, y, screenPoly);
}

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

function drawBoxPlot(deptCode) {
  const data = rentalData[deptCode];
  if (!data || !data.min || !data.q1 || !data.median || !data.q3 || !data.max) return;
  const plotX = 50;
  const plotY = 50;
  const plotWidth = 320;
  const plotHeight = 150;
  fill(255, 120);
  stroke(0);
  rect(plotX, plotY, plotWidth, plotHeight, 5);
  const expansionFactor = 0.2;
  const expandedMin = data.min - (data.max - data.min) * expansionFactor;
  const expandedMax = data.max + (data.max - data.min) * expansionFactor;
  const priceToY = price => {
    return map(
      price,
      expandedMin,
      expandedMax,
      plotY + plotHeight - 30,
      plotY + 30
    );
  };
  const minY = priceToY(data.min);
  const q1Y = priceToY(data.q1);
  const medianY = priceToY(data.median);
  const q3Y = priceToY(data.q3);
  const maxY = priceToY(data.max);
  const boxX = plotX + 180;
  const boxWidth = 80;
  stroke(0);
  line(boxX + boxWidth / 2, minY, boxX + boxWidth / 2, maxY);
  line(boxX, minY, boxX + boxWidth, minY);
  line(boxX, maxY, boxX + boxWidth, maxY);
  fill('#ADD8E6');
  rect(boxX, q3Y, boxWidth, q1Y - q3Y);
  stroke(255, 0, 0);
  line(boxX, medianY, boxX + boxWidth, medianY);
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

function drawSinglePolygon(ring, scaleFactor = 1, fillCol = '#ADD8E6') {
  let screenCoords = ring.map(coord => {
    let x = map(coord[0], -5, 10, 50, width - 50);
    let y = map(coord[1], 41, 51, height - 50, 50);
    return createVector(x, y);
  });
  let centroid = calculateCentroidScreen(screenCoords);
  fill(fillCol);
  stroke(100);
  beginShape();
  for (let v of screenCoords) {
    let sx = centroid.x + scaleFactor * (v.x - centroid.x);
    let sy = centroid.y + scaleFactor * (v.y - centroid.y);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

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

function calculateCentroidGeo(ring) {
  let xSum = 0, ySum = 0;
  for (let coord of ring) {
    xSum += coord[0];
    ySum += coord[1];
  }
  let len = ring.length;
  return [xSum / len, ySum / len];
}

function drawDepartments() {
  let features = departementsGeoJSON.features;
  let hoveredDept = null;
  let hoveredDeptMedian = null;
  for (let i = 0; i < features.length; i++) {
    let dept = features[i];
    let geometryType = dept.geometry.type;
    let coordinates = dept.geometry.coordinates;
    let deptCode = dept.properties.code;
    let rentalInfo = rentalData[deptCode];
    let medianPrice = rentalInfo ? rentalInfo.median : null;
    let inside = isPointInDept(mouseX, mouseY, dept.geometry);
    if (inside) {
      hoveredDept = deptCode;
      hoveredDeptMedian = medianPrice;
    }
    let fillCol;
    if (medianPrice !== null) {
      let t = map(medianPrice, MIN_PRICE, MAX_PRICE, 0, 1, true);
      fillCol = lerpColor(startColor, endColor, t);
    } else {
      fillCol = color('#ADD8E6');
    }
    let scaleFactor = inside ? 1.1 : 1.0;
    let highlightCol = fillCol;
    if (geometryType === "Polygon") {
      for (let ring of coordinates) {
        drawSinglePolygon(ring, scaleFactor, highlightCol);
      }
    } else if (geometryType === "MultiPolygon") {
      for (let polygon of coordinates) {
        for (let ring of polygon) {
          drawSinglePolygon(ring, scaleFactor, highlightCol);
        }
      }
    } else {
      // console.warn("未知的几何类型: ", geometryType);
    }
    let labelCentroid;
    if (geometryType === "Polygon") {
      labelCentroid = calculateCentroidGeo(coordinates[0]);
    } else if (geometryType === "MultiPolygon") {
      let allPoints = [];
      for (let polygon of coordinates) {
        let outerRing = polygon[0];
        allPoints = allPoints.concat(outerRing);
      }
      labelCentroid = calculateCentroidGeo(allPoints);
    }
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
  if (hoveredDept) {
    drawBoxPlot(hoveredDept);
    currentHoveredDept = hoveredDept;
  } else {
    currentHoveredDept = null;
  }
}

// Helper function to map geographic coordinates to screen coordinates.
function getScreenCoord(lon, lat, bbox) {
  let sx = map(lon, bbox.minLon, bbox.maxLon, 50, width - 50);
  let sy = map(lat, bbox.minLat, bbox.maxLat, height - 50, 50);
  return createVector(sx, sy);
}

/* MODIFIED: Generates an HTML table using the precomputed distances JSON.
   It filters records for the given department, sorts them in ascending order
   by the "distance" field, limits the table to the first 30 records, and then creates rows.
   It also saves these rows globally for highlighting.
*/
function generateDistanceTable(deptCode, maxDistance) {
  // Filter records by department.
  let rows = etabCyclingDistances.filter(rec => rec.departement_code === deptCode);
  
  // Sort rows in ascending order by the "distance" property.
  rows.sort((a, b) => a.distance - b.distance);
  
  // Limit the table to the first 30 cycling stations.
  rows = rows.slice(0, 500);
  
  // Save these rows globally for use in highlighting on the map.
  highlightRows = rows;
  currentMaxDistance = maxDistance;
  
  let tableHTML = "<table border='1' cellpadding='4' cellspacing='0'>";
  tableHTML += "<tr><th>Institution</th><th>  Cycling Station</th><th>Distance</th><th>Within " + maxDistance + "?</th></tr>";
  
  for (let rec of rows) {
    let mark = (rec.distance <= maxDistance) ? "✔" : "✖";
    // Compute screen coordinate for the cycling station for highlighting.
    let stCoord = getScreenCoord(rec.X_cycling_station, rec.Y_cycling_station, deptBbox);
    tableHTML += `<tr>
         <td>${rec.libellé}</td>
         <td onmouseover="highlightStation(${stCoord.x}, ${stCoord.y})" onmouseout="clearHighlightStation()">${rec.station_name || "Station"}</td>
         <td>${Math.round(rec.distance * 10) / 10}</td>
         <td style="text-align:center">${mark}</td>
         </tr>`;
  }
  
  tableHTML += "</table>";
  return tableHTML;
}

function checkDataLoaded() {
  if (
    departementsGeoJSON &&
    rentalDataArray.length > 0 &&
    etablissementsData.length > 0 &&
    cyclingStationsData.length > 0 &&
    etablissementStastic.length > 0 &&
    stationDeptData.length > 0 &&
    etabCyclingDistances &&  // Check that the distance JSON is loaded
    bikeIcon
  ) {
    dataLoaded = true;
    aggregateEtablissementData();
    aggregateStations();
    redraw();
  }
}

function drawLegend() {
  let legendX = width - 60;
  let legendY = 50;
  let legendHeight = 200;
  let legendWidth = 20;
  noStroke();
  for (let i = 0; i < legendHeight; i++) {
    let value = map(i, 0, legendHeight, MIN_PRICE, MAX_PRICE);
    let t = map(value, MIN_PRICE, MAX_PRICE, 0, 1, true);
    let c = lerpColor(color('#ADD8E6'), endColor, t);
    fill(c);
    rect(legendX - 20, legendY + i, legendWidth, 1);
  }
  stroke(0);
  noFill();
  rect(legendX - 20, legendY, legendWidth, legendHeight);
  fill(0);
  noStroke();
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${MIN_PRICE} €/m²`, legendX + legendWidth - 15, legendY);
  text(`${MAX_PRICE} €/m²`, legendX + legendWidth - 15, legendY + legendHeight);
  text("Rent average", legendX - 15, legendY - 15);
}

function setupExtraMap() {
  // Create the extra map graphics only once and attach its canvas to the extra container.
  if (!extraMap) {
    extraMap = createGraphics(800, 600);
    // <-- Change here: use extraMap.parent(), not extraMap.canvas.parent()
    extraMap.parent("extra-map-container");
    // Make sure the extra container is visible in department mode.
    document.getElementById("extra-map-container").style.display = "block";
  }
}

function drawExtraMap() {
  if (!extraMap || !selectedDept || !deptBbox) return;
  
  // Clear and set background on the extra map canvas.
  extraMap.clear();
  extraMap.background(255);
  
  // Set margins and get extra canvas dimensions.
  let margin = 50;
  let extraW = extraMap.width;
  let extraH = extraMap.height;

  // Optionally, draw the department boundary as a light background.
  let deptFeature = departementsGeoJSON.features.find(f => f.properties.code === selectedDept);
  if (deptFeature) {
    extraMap.stroke(200);
    extraMap.fill(240);
    let geom = deptFeature.geometry;
    if (geom.type === "Polygon") {
      for (let ring of geom.coordinates) {
        extraMap.beginShape();
        for (let coord of ring) {
          let sx = map(coord[0], deptBbox.minLon, deptBbox.maxLon, margin, extraW - margin);
          let sy = map(coord[1], deptBbox.minLat, deptBbox.maxLat, extraH - margin, margin);
          extraMap.vertex(sx, sy);
        }
        extraMap.endShape(CLOSE);
      }
    } else if (geom.type === "MultiPolygon") {
      for (let polygon of geom.coordinates) {
        for (let ring of polygon) {
          extraMap.beginShape();
          for (let coord of ring) {
            let sx = map(coord[0], deptBbox.minLon, deptBbox.maxLon, margin, extraW - margin);
            let sy = map(coord[1], deptBbox.minLat, deptBbox.maxLat, extraH - margin, margin);
            extraMap.vertex(sx, sy);
          }
          extraMap.endShape(CLOSE);
        }
      }
    }
  }
  
}

function drawSelectedDeptMap(deptCode) {
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
  if (selectedDept != null) {
    // Update department info header in each draw cycle.
    let deptFeature = departementsGeoJSON.features.find(f => f.properties.code === selectedDept);
    let deptName = deptFeature && deptFeature.properties.nom ? deptFeature.properties.nom : selectedDept;
    let deptInfo = document.getElementById("dept-info");
    if (deptInfo) {
      deptInfo.querySelector("h1").innerHTML = "Department Details: " + deptName;
    }
    if (distanceSubmitted) {
      setupExtraMap();
      drawExtraMap();
    }
  }
  
  if (selectedDept == null) {
    // Nationwide mode
    drawDepartments();
    drawLegend();
    if (currentHoveredDept) {
      let instCounts = countInstitutionsByType(currentHoveredDept);
      drawPieChartInstitutions(instCounts, width - 150, 550, 120);
    }
  } else {
    // Department mode
    drawSelectedDeptMap(selectedDept);
    drawDeptCyclingStations(selectedDept);
    drawDeptEtablissements(selectedDept);
    drawBackButton();
    drawCapacityLegend();
    drawIconLegend();
    
    // Create the distance input, button, and table in the "table-container" if not already created.
    if (!distanceInput) {
      distanceInput = createInput("");
      distanceInput.parent("table-container");
      distanceInput.style("width", "100px");
      
      distanceButton = createButton("Distance Calculator");
      distanceButton.parent("table-container");
      distanceButton.mousePressed(() => {
        let dVal = parseFloat(distanceInput.value());
        if (isNaN(dVal)) dVal = 0;
        let htmlTable = generateDistanceTable(selectedDept, dVal);
        tableDiv.html(htmlTable);
        distanceSubmitted = true;  // Set flag after distance is submitted
        redraw(); 
      });
      
      tableDiv = createDiv("");
      tableDiv.parent("table-container");
      tableDiv.style("max-height", "600px");
      tableDiv.style("overflow", "auto");
      tableDiv.style("background-color", "#f0f0f0");
      tableDiv.style("padding", "10px");
    }
    
    // Draw cycling station markers with the new images (only for the stations in the table)
    if (highlightRows && highlightRows.length > 0) {
      for (let rec of highlightRows) {
        let stCoord = getScreenCoord(rec.X_cycling_station, rec.Y_cycling_station, deptBbox);
        // console.log("rec",rec);
        if (rec.distance <= currentMaxDistance) {
          // Use green image if condition is satisfied.
          // image(greenImg, stCoord.x - 10, stCoord.y - 10, 20, 20);
          greenStations.push(rec);
        } else {
          // Use red image otherwise.
          // image(redImg, stCoord.x - 10, stCoord.y - 10, 20, 20);
          redStations.push(rec);
        }
      }
    }

    for (let rec of redStations) {
      let stCoord = getScreenCoord(rec.X_cycling_station, rec.Y_cycling_station, deptBbox);
      image(redImg, stCoord.x - 10, stCoord.y - 10, 20, 20);
    }
    

    for (let rec of greenStations) {
      let stCoord = getScreenCoord(rec.X_cycling_station, rec.Y_cycling_station, deptBbox);
      image(greenImg, stCoord.x - 10, stCoord.y - 10, 20, 20);
    }

    if (highlightStationCoord) {
      push();
      fill(255, 0, 0);
      noStroke();
      ellipse(highlightStationCoord.x, highlightStationCoord.y, 10, 10);
      pop();
    }
    
    // NEW: Only create and draw the extra map after the user has submitted a distance.
    if (distanceSubmitted) {
      setupExtraMap();
      drawExtraMap();
    }
    
    if (hoveredItem) {
      drawTooltip(hoveredItem);
    }
    redStations = [];
    greenStations = [];
  }
}
