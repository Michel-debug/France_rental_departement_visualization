var canvas_width = 1200;
var canvas_height = 4600;
var font_type = 'Arial';
var font_height = 14;
var font_color = 'white';
// set line spacing


function preload() {
  table = loadTable("data/Countries-BMI-Data.csv",
    "csv", "header");
}
// set the gradient color between two colors
function setGradient(x1, x2, y, c1, c2, weight){
  var min_x = min(x1, x2), max_x = max(x1, x2);
  for(let i = min_x; i <= max_x; i++){
  let inter = map(i, x1, x2, 0, 1);
  let c = lerpColor(c1, c2, inter);
  stroke(c);
  strokeWeight(weight);
  point(i, y);
  }
 }
//3. traverse all names to find out the longest one
function getLongestNameLength(names) {
  for (var i = 0; i < names.length; i++) {
    // get current name's length
    current_name_length = textWidth(names[i]);
    // if the current name's length is longer than the current longest length,
    // then update the value of the current longest one
    if (current_name_length > longest_name_length)
      longest_name_length = current_name_length;
  }
  return longest_name_length;
}
function setup() {
  // put setup code here
  createCanvas(canvas_width, canvas_height);

  countries = table.getColumn("Country");
  // set the text type and size

  // get BMI values from data
  female_bmi = table.getColumn("Female mean BMI (kg/m2)").map(Number);
  male_bmi = table.getColumn("Male mean BMI (kg/m2)").map(Number);
  // get minimum and maximum value of BMI
  min_bmi = min(min(female_bmi), min(male_bmi));
  max_bmi = max(max(female_bmi), max(male_bmi));
  longest_name_length = getLongestNameLength(countries);
  textFont(font_type);
  textSize(font_height);
  console.log(table.getRowCount() + " total rows in table");
  console.log(table.getColumnCount() + " total columns in table");
}

function draw() {
  background(0, 0, 0);
  bmi_color_female = color(255, 0, 232); // pink
  bmi_color_male = color(0, 185, 255); // blue

  vertical_line_y1 = top_margin;
  vertical_line_y2 = (font_height + line_spacing) * countries.length + font_height;

  // 计算水平线的 x 坐标
  line_x1 = longest_name_length + space_name_line + left_margin;
  line_x2 = canvas_width - right_margin;

  text_y = top_margin + font_height
  line_y = top_margin + font_height / 2;
  for (var i = countries.length - 1; i >= 0; i--) {
    fill(font_color);
    noStroke();
    textAlign(LEFT);
    text_x = left_margin + longest_name_length - textWidth(countries[i]);
    text(countries[i], text_x, text_y);


    stroke(font_color);
    strokeWeight(grid_weight);
    line(line_x1, line_y, line_x2, line_y);
 

    current_female_bmi = female_bmi[i];
    current_male_bmi = male_bmi[i];
    bmi_x1 = map(current_female_bmi, floor(min_bmi), ceil(max_bmi), line_x1, line_x2);
    bmi_x2 = map(current_male_bmi, floor(min_bmi), ceil(max_bmi), line_x1, line_x2);
    // draw two points: pink for female and blue formale
    strokeWeight(bmi_point_weight);
    // female
    stroke(bmi_color_female);
    point(bmi_x1, line_y);
    // male
    stroke(bmi_color_male);
    point(bmi_x2, line_y);
    setGradient(bmi_x1, bmi_x2, line_y,bmi_color_female, bmi_color_male, bmi_line_weight);
    text_y = text_y + font_height + line_spacing;
    line_y = text_y - font_height / 2;
      // draw the BMI lines
    
  }

  // 绘制垂直线和刻度标签
  for (var i = floor(min_bmi); i <= ceil(max_bmi); i++) {
    vertical_line_x = map(i, floor(min_bmi), ceil(max_bmi), line_x1, line_x2);


    stroke(font_color);
    strokeWeight(grid_weight);
    line(vertical_line_x, vertical_line_y1, vertical_line_x, vertical_line_y2);

    fill(font_color);
    noStroke();
    textAlign(CENTER);
    text(i, vertical_line_x, vertical_line_y1 - font_height * 0.3);
  }

}
