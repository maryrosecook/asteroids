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
      new Asteroid(this, 30, 10),
      new Asteroid(this, 30, 10),
      new Player(this)
    ];

    var self = this;
    var lastTick = new Date().getTime();
    var tick = function() {
      var now = new Date().getTime();
      self.update(now - lastTick);
      self.draw(screen);
      requestAnimationFrame(tick);
      lastTick = now;
    };

    tick();
  };

  Game.prototype = {
    update: function(timeDelta) {
      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].update(timeDelta);
      }

      for (var i = 0; i < this.entities.length; i++) {
        if (this.entities[i] instanceof Bullet) {
          var bulletLine = pointsToLines(this.entities[i].points)[0];
          for (var j = 0; j < this.entities.length; j++) {
            if (this.entities[j] instanceof Asteroid) {
              var asteroidLines = pointsToLines(this.entities[j].points);
              for (var k = 0; k < asteroidLines.length; k++) {
                if (linesIntersecting(asteroidLines[k], bulletLine)) {
                  this.destroy(this.entities[i]);
                  this.destroy(this.entities[j]);
                }
              }
            }
          }
        }
      }
    },

    draw: function(screen) {
      screen.fillStyle = "black";
      screen.fillRect(0, 0, this.size.x, this.size.y);

      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(screen);
      }
    },

    shoot: function(center, angle) {
      this.entities.push(new Bullet(this, center, angle));
    },

    destroy: function(entity) {
      this.entities.splice(this.entities.indexOf(entity), 1);
    }
  };

  var Asteroid = function(game, radius, pointCount) {
    this.center = {
      x: game.size.x * Math.random(),
      y: game.size.y * Math.random()
    };
    this.velocity = { x: 0.05, y: 0.05 };

    this.points = [];
    for (var a = 0; a < 2 * Math.PI; a += 2 * Math.PI / pointCount) {
      this.points.push(randomPointInCircle(this.center, a, radius));
    }
  };

  Asteroid.prototype = {
    update: function(timeDelta) {
      var self = this;
      var deltaVelocity = { x: this.velocity.x * timeDelta, y: this.velocity.y * timeDelta };
      this.center = translate(this.center, deltaVelocity);
      this.points = this.points
        .map(function(p) { return rotate(p, self.center, 0.001 * timeDelta); })
        .map(function(p) { return translate(p, deltaVelocity); });
    },

    draw: function(screen) {
      pointsToLines(this.points).map(function(x) { drawLine(screen, x); });
    }
  };

  var Player = function(game) {
    this.game = game;
    this.velocity = { x: 0, y: 0 };
    this.center = { x: game.size.x / 2, y: game.size.y / 2 };
    this.angle = 0;
    this.points = [
      { x: this.center.x - 8, y: this.center.y + 9 },
      { x: this.center.x,      y: this.center.y - 10 },
      { x: this.center.x + 8, y: this.center.y + 9 }
    ];

    this.keyboarder = new Keyboarder();
    this.lastShotTime = 0;
  };

  Player.prototype = {
    update: function() {
      // turning
      if (this.keyboarder.isDown(this.keyboarder.LEFT)) {
        this.turn(-0.1);
      } else if (this.keyboarder.isDown(this.keyboarder.RIGHT)) {
        this.turn(0.1);
      }

      // moving
      this.jet();
      if (this.keyboarder.isDown(this.keyboarder.UP)) {
        this.velocity = translate(this.velocity,
                                  rotate({ x: 0, y: -0.1 }, { x: 0, y: 0 }, this.angle));
      }

      // shooting
      var now = new Date().getTime();
      if (this.keyboarder.isDown(this.keyboarder.SPACE) &&
          now - this.lastShotTime > 500) {
        this.lastShotTime = now;
        var point = rotate(translate(this.center, { x: 0, y: -9 }), this.center, this.angle);
        this.game.shoot(point, this.angle);
      }
    },

    jet: function() {
      var self = this;
      this.center = translate(this.center, this.velocity);
      this.points = this.points.map(function(x) { return translate(x, self.velocity); });
    },

    turn: function(angleDelta) {
      var self = this;
      this.angle += angleDelta;
      this.points = this.points.map(function(x) {
        return rotate(x, self.center, angleDelta);
      });
    },

    draw: function(screen) {
      pointsToLines(this.points).map(function(x) { drawLine(screen, x); });
    }
  };

  var Bullet = function(game, start, angle) {
    this.velocity = rotate({ x: 0, y: -0.2 }, { x: 0, y: 0 }, angle);
    this.points = [start, translate(start, { x: this.velocity.x * 50, y: this.velocity.y * 50 })];
  };

  Bullet.prototype = {
    update: function(timeDelta) {
      var deltaVelocity = { x: this.velocity.x * timeDelta, y: this.velocity.y * timeDelta };
      this.points = this.points.map(function (x) { return translate(x, deltaVelocity) });
    },

    draw: function(screen) {
      drawLine(screen, pointsToLines(this.points)[0]);
    }
  };

  var Keyboarder = function() {
    var keyState = {};

    window.onkeydown = function(e) {
      keyState[e.keyCode] = true;
    };

    window.onkeyup = function(e) {
      keyState[e.keyCode] = false;
    };

    this.isDown = function(keyCode) {
      return keyState[keyCode] === true;
    };

    this.LEFT = 37;
    this.RIGHT = 39;
    this.UP = 38;
    this.SPACE = 32;
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

  var drawLine = function(screen, line) {
    screen.beginPath();
    screen.moveTo(line[0].x, line[0].y);
    screen.lineTo(line[1].x, line[1].y);
    screen.stroke();
  };

  var translate = function(point, translation) {
    return { x: point.x + translation.x, y: point.y + translation.y };
  };

  var randomPointInCircle = function(center, angle, radius) {
    var random = Math.random();
    return rotate({
      x: center.x + radius * (0.1 + random),
      y: center.y - radius * (0.1 + random)
    }, center, angle);
  };

  var rotate = function(point, pivot, angle) {
    return {
      x: (point.x - pivot.x) * Math.cos(angle) -
         (point.y - pivot.y) * Math.sin(angle) +
         pivot.x,
      y: (point.x - pivot.x) * Math.sin(angle) +
         (point.y - pivot.y) * Math.cos(angle) +
         pivot.y
    };
  };

  var linesIntersecting = function(a, b) {
    var d = (b[1].y - b[0].y) * (a[1].x - a[0].x) -
            (b[1].x - b[0].x) * (a[1].y - a[0].y);
    var n1 = (b[1].x - b[0].x) * (a[0].y - b[0].y) -
             (b[1].y - b[0].y) * (a[0].x - b[0].x);
    var n2 = (a[1].x - a[0].x) * (a[0].y - b[0].y) -
             (a[1].y - a[0].y) * (a[0].x - b[0].x);

    if (d === 0.0) return false;
    return n1 / d >= 0 && n1 / d <= 1 && n2 / d >= 0 && n2 / d <= 1;
  };

  window.onload = function() {
    new Game("screen");
  };
})(this);
