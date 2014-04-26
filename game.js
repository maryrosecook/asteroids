;(function() {
  var Game = function(canvasId) {
    this.size = { x: 400, y: 400 };

    var canvas = document.getElementById(canvasId);
    var screen = canvas.getContext('2d');
    canvas.width = this.size.x;
    canvas.height = this.size.y;
    screen.strokeStyle = "white";

    this.entities = [
      new Asteroid(this, 30, 10),
      new Player(this)
    ];

    var self = this;
    var tick = function() {
      self.update();
      self.draw(screen);
      requestAnimationFrame(tick);
    };

    tick();
  };

  Game.prototype = {
    update: function() {
      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].update();
      }
    },

    draw: function(screen) {
      screen.fillStyle = "black";
      screen.fillRect(0, 0, this.size.x, this.size.y);

      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(screen);
      }
    }
  };

  var Asteroid = function(game, radius, pointCount) {
    this.center = {
      x: game.size.x * Math.random(),
      y: game.size.y * Math.random()
    };

    this.points = [];
    for (var a = 0; a < 2 * Math.PI; a += 2 * Math.PI / pointCount) {
      this.points.push(randomPointInCircle(this.center, a, radius));
    }
  };

  Asteroid.prototype = {
    update: function() {
      this.points = rotateShape(this.center, this.points, 0.1);
    },

    draw: function(screen) {
      drawShape(screen, this.points);
    }
  };

  var Player = function(game) {
    this.center = { x: game.size.x / 2, y: game.size.y / 2 };
    this.points = [
      { x: this.center.x - 10, y: this.center.y + 10 },
      { x: this.center.x,      y: this.center.y - 10 },
      { x: this.center.x + 10, y: this.center.y + 10 }
    ];
  };

  Player.prototype = {
    update: function() {

    },

    draw: function(screen) {
      drawShape(screen, this.points);
    }
  };

  var pointsToLines = function(points) {
    var lines = [];
    var previous = points[0];
    for (var i = 1; i < points.length; i++) {
      lines.push([previous, points[i]]);
      previous = points[i];
    }

    lines.push([previous, lines[0][0]]); // end to beginning
    return lines;
  };

  var drawShape = function(screen, points) {
    screen.beginPath();
    var lines = pointsToLines(points);
    for (var i = 0; i < lines.length; i++) {
      screen.moveTo(lines[i][0].x, lines[i][0].y);
      screen.lineTo(lines[i][1].x, lines[i][1].y);
    }

    screen.stroke();
  };

  var randomPointInCircle = function(center, angle, radius) {
    return {
      x: center.x + angleToVector(angle).x * radius * (0.2 + Math.random()),
      y: center.y + angleToVector(angle).y * radius * (0.2 + Math.random())
    };
  };

  var magnitude = function(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  };

  var normalise = function(vector) {
    return {
      x: vector.x / magnitude(vector),
      y: vector.y / magnitude(vector)
    };
  };

  var angleToVector = function(angle) {
    var x = Math.cos(angle) * 0 - Math.sin(angle) * -1;
    var y = Math.sin(angle) * 0 + Math.cos(angle) * -1;
    return normalise({ x: x, y: y });
  };

  var rotateShape = function(center, points, angle) {
    return points.map(function(x) { return rotatePoint(center, x, angle); });
  };

  var rotatePoint = function(pivot, point, angle) {
    var newPoint = { x: point.x, y: point.y };
    newPoint.x -= pivot.x;
    newPoint.y -= pivot.y;
    newPoint.x = newPoint.x * Math.cos(angle) - newPoint.y * Math.sin(angle);
    newPoint.y = newPoint.x * Math.sin(angle) + newPoint.y * Math.cos(angle);
    newPoint.x += pivot.x;
    newPoint.y += pivot.y;
    return newPoint;
  };

  window.onload = function() {
    new Game("screen");
  };
})(this);
