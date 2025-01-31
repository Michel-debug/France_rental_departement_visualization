var canvas_width = 1200;
var canvas_height = 4600;
var font_type = 'Arial';
var font_height = 14;
var font_color = 'white';

// rental data
var rentalData = {};
var regionGeoJson;

function preload() {
  rentalData = loadJSON('data/rental_data.json');
  regionGeoJson = loadJSON('data/region.geojson');
  
  rentalDataArray.forEach(item => {
    rentalData[item.region_code] = item;
  });
}
