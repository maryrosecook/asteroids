;(function() {
  var Game = function(canvasId) {
    var canvas = document.getElementById(canvasId);
    var screen = canvas.getContext('2d');
    this.size = { x: canvas.width, y: canvas.height };

    this.entities = [createAsteroid(this.size), createAsteroid(this.size), createAsteroid(this.size),
                     createPlayer(this, this.size)];

    var self = this;
    loadSound("/shoot.wav", function(shootSound) {
      self.shootSound = shootSound;
      var tick = function() {
        var now = new Date().getTime();
        self.update();
        self.draw(screen);
        requestAnimationFrame(tick);
        lastTick = now;
      };

      tick();
    });
  };

  Game.prototype = {
    update: function() {
      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].update();
      }

      var dead = [];
      for (var i = 0; i < this.entities.length; i++) {
        for (var j = i + 1; j < this.entities.length; j++) {
          var p = pairs(pointsToLines(this.entities[i].points),
                        pointsToLines(this.entities[j].points));
          if (p.filter(function(x) { return trig.linesIntersecting(x[0], x[1]); }).length > 0) {
            dead.push(this.entities[i], this.entities[j]);
          }
        }
      }

      this.entities = this.entities.filter(function(x) { return dead.indexOf(x) === -1; });
    },

    draw: function(screen) {
      screen.clearRect(0, 0, this.size.x, this.size.y);
      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(screen);
      }
    },

    shoot: function(center, angle) {
      this.shootSound.load();
      this.shootSound.play();
      this.entities.push(createBullet(this, center, angle));
    }
  };

  var createAsteroid = function(size) {
    var center = { x: size.x * Math.random(), y: size.y * Math.random() };
    return {
      angle: 0,
      center: center,
      points: asteroidPoints(center, 30, 10),
      velocity: { x: Math.random() - 0.5, y: Math.random() - 0.5 },
      update: move,
      draw: draw
    };
  };

  var draw = function(screen) {
    pointsToLines(this.points).forEach(function(x) { drawLine(screen, x); });
  };

  var move = function() {
    var self = this;
    this.center = trig.translate(this.center, this.velocity);
    this.points = this.points.map(function(x) { return trig.translate(x, self.velocity); });
  };

  var createPlayer = function(game, size) {
    var center = { x: size.x / 2, y: size.y / 2 };
    return {
      angle: 0,
      center: center,
      points: [{ x: center.x - 8, y: center.y + 9 },
               { x: center.x,     y: center.y - 10 },
               { x: center.x + 8, y: center.y + 9 }],
      velocity: { x: 0, y: 0 },
      keyboarder: new Keyboarder(),
      lastShotTime: 0,

      update: function() {
        // turning
        if (this.keyboarder.isDown(this.keyboarder.LEFT)) {
          this.turn(-0.1);
        } else if (this.keyboarder.isDown(this.keyboarder.RIGHT)) {
          this.turn(0.1);
        }

        // jetting
        if (this.keyboarder.isDown(this.keyboarder.UP)) {
          this.velocity = trig.translate(this.velocity,
                                    trig.rotate({ x: 0, y: -0.05 }, { x: 0, y: 0 }, this.angle));
        }

        // shooting
        var now = new Date().getTime();
        if (this.keyboarder.isDown(this.keyboarder.SPACE) &&
            now - this.lastShotTime > 500) {
          this.lastShotTime = now;
          game.shoot({ x: this.points[1].x, y: this.points[1].y }, this.angle);
        }

        this.move();
      },

      turn: function(angleDelta) {
        var center = this.center;
        this.points = this.points.map(function(x) { return trig.rotate(x, center, angleDelta); })
        this.angle += angleDelta;
      },

      move: move,
      draw: draw
    };
  };

  var createBullet = function(game, start, angle) {
    var velocity = trig.rotate({ x: 0, y: -5 }, { x: 0, y: 0 }, angle);
    return {
      angle: 0,
      center: start,
      points: [start, trig.translate(start, { x: velocity.x, y: velocity.y })],
      velocity: velocity,
      update: move,
      draw: draw
    };
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

  var asteroidPoints = function(center, radius, pointCount) {
    var points = [];
    for (var a = 0; a < 2 * Math.PI; a += 2 * Math.PI / pointCount) {
      var random = Math.random();
      points.push(trig.rotate({
        x: center.x + radius * (0.1 + random),
        y: center.y - radius * (0.1 + random)
      }, center, a));
    }

    return points;
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

  var loadSound = function(url, callback) {
    var sound = new Audio(url);
    var loaded = function() {
      callback(sound);
      sound.removeEventListener('canplaythrough', loaded);
    };

    sound.addEventListener('canplaythrough', loaded);
    sound.load();
  };

  window.onload = function() {
    new Game("screen");
  };

  var trig = {
    translate: function(point, translation) {
      return { x: point.x + translation.x, y: point.y + translation.y };
    },

    rotate: function(point, pivot, angle) {
      return {
        x: (point.x - pivot.x) * Math.cos(angle) -
          (point.y - pivot.y) * Math.sin(angle) +
          pivot.x,
        y: (point.x - pivot.x) * Math.sin(angle) +
          (point.y - pivot.y) * Math.cos(angle) +
          pivot.y
      };
    },

    linesIntersecting: function(a, b) {
      var d = (b[1].y - b[0].y) * (a[1].x - a[0].x) -
          (b[1].x - b[0].x) * (a[1].y - a[0].y);
      var n1 = (b[1].x - b[0].x) * (a[0].y - b[0].y) -
          (b[1].y - b[0].y) * (a[0].x - b[0].x);
      var n2 = (a[1].x - a[0].x) * (a[0].y - b[0].y) -
          (a[1].y - a[0].y) * (a[0].x - b[0].x);

      if (d === 0.0) return false;
      return n1 / d >= 0 && n1 / d <= 1 && n2 / d >= 0 && n2 / d <= 1;
    }
  };
})(this);
