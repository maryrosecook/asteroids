;(function() {
  var Game = function(canvasId) {
    this.size = { x: 400, y: 400 };

    var canvas = document.getElementById(canvasId);
    var screen = canvas.getContext('2d');
    canvas.width = this.size.x;
    canvas.height = this.size.y;
    screen.strokeStyle = "white";

    this.entities = [
      createAsteroid(this),
      createPlayer(this)
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
        for (var j = i + 1; j < this.entities.length; j++) {
          var p = pairs(pointsToLines(this.entities[i].points),
                        pointsToLines(this.entities[j].points));
          if (p.filter(function(x) { return linesIntersecting(x[0], x[1]); }).length > 0) {
            this.destroy(this.entities[i]);
            this.destroy(this.entities[j]);
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
      this.entities.push(createBullet(this, center, angle));
    },

    destroy: function(entity) {
      var self = this;
      setTimeout(function() {
        self.entities.splice(self.entities.indexOf(entity), 1);
      }, 0);
    }
  };

  var createAsteroid = function(game) {
    var center = { x: game.size.x * Math.random(), y: game.size.y  * Math.random() };
    var asteroid = new Body(game,
                            center,
                            asteroidPoints(center, 30, 10),
                            { x: (Math.random() - 0.5) / 10, y: (Math.random() - 0.5) / 10 });
    asteroid.update = function(timeDelta) {
      this.move(timeDelta);
      this.turn(0.01);
    };

    return asteroid;
  };

  var createPlayer = function(game) {
    var center = { x: game.size.x / 2, y: game.size.y / 2 };
    var player = new Body(game,
                          center,
                          [{ x: center.x - 8, y: center.y + 9 },
                           { x: center.x,     y: center.y - 10 },
                           { x: center.x + 8, y: center.y + 9 }],
                          { x: 0, y: 0 });

    player.keyboarder = new Keyboarder();
    player.lastShotTime = 0;

    player.update = function(timeDelta) {
      // turning
      if (this.keyboarder.isDown(this.keyboarder.LEFT)) {
        this.turn(-0.1);
      } else if (this.keyboarder.isDown(this.keyboarder.RIGHT)) {
        this.turn(0.1);
      }

      // jetting
      if (this.keyboarder.isDown(this.keyboarder.UP)) {
        this.velocity = translate(this.velocity,
                                  rotate({ x: 0, y: -0.005 }, { x: 0, y: 0 }, this.angle));
      }

      // shooting
      var now = new Date().getTime();
      if (this.keyboarder.isDown(this.keyboarder.SPACE) &&
          now - this.lastShotTime > 500) {
        this.lastShotTime = now;
        var point = rotate(translate(this.center, { x: 0, y: -9 }), this.center, this.angle);
        this.game.shoot(point, this.angle);
      }

      this.move(timeDelta);
    };

    return player;
  };

  var createBullet = function(game, start, angle) {
    var velocity = rotate({ x: 0, y: -0.2 }, { x: 0, y: 0 }, angle);
    var points = [start, translate(start, { x: velocity.x * 50, y: velocity.y * 50 })];
    var bullet = new Body(game, start, points, velocity);
    bullet.update = bullet.move;
    return bullet;
  };

  var Body = function(game, center, points, velocity) {
    this.game = game;
    this.center = center;
    this.points = points;
    this.velocity = velocity;
    this.angle = 0;
  };

  Body.prototype = {
    move: function(timeDelta) {
      var deltaVelocity = { x: this.velocity.x * timeDelta, y: this.velocity.y * timeDelta };
      this.center = translate(this.center, deltaVelocity);
      this.points = this.points.map(function(x) { return translate(x, deltaVelocity); });
    },

    turn: function(angleDelta) {
      var center = this.center;
      this.points = this.points.map(function(x) { return rotate(x, center, angleDelta); })
      this.angle += angleDelta;
    },

    update: function() {},
    draw: function(screen) {
      pointsToLines(this.points).forEach(function(x) { drawLine(screen, x); });
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

  var asteroidPoints = function(center, radius, pointCount) {
    var points = [];
    for (var a = 0; a < 2 * Math.PI; a += 2 * Math.PI / pointCount) {
      var random = Math.random();
      points.push(rotate({
        x: center.x + radius * (0.1 + random),
        y: center.y - radius * (0.1 + random)
      }, center, a));
    }

    return points;
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

  var pairs = function(a, b) {
    var pairs = [];
    for (var i = 0; i < a.length; i++) {
      for (var j = 0; j < b.length; j++) {
        pairs.push([a[i], b[j]]);
      }
    }
    return pairs;
  };

  // a = [{x: 4, y: 6}, {x: 4, y: 6}]
  // b = [{x: 4, y: 6}, {x: 4, y: 6}]
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
