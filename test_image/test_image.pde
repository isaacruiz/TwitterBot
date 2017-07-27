void setup(){
  size(360, 360);
  background(0, 0, 0);
  for(int i = 0; i < 50; i++)
  {
     float x = random(width);
     float y = random(height);
     float r = random (0, 255);
     float b = random (0, 255);
     float g = random (0, 255);
     noStroke();
     fill (r, g, b);
     ellipse (x, y, 16, 16);
  }
  save("output.png");
  exit();
}