// https://d3js.org/d3-force/ Version 1.0.0. Copyright 2016 Mike Bostock.
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-quadtree'), require('d3-collection'), require('d3-dispatch'), require('d3-timer')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3-quadtree', 'd3-collection', 'd3-dispatch', 'd3-timer'], factory) :
    (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3));
  }(this, function (exports,d3Quadtree,d3Collection,d3Dispatch,d3Timer) { 'use strict';
  
    function center(x, y) {
      var nodes;
  
      if (x == null) x = 0;
      if (y == null) y = 0;
  
      function force() {
        var i,
            n = nodes.length,
            node,
            sx = 0,
            sy = 0;
  
        for (i = 0; i < n; ++i) {
          node = nodes[i], sx += node.x, sy += node.y;
        }
  
        for (sx = sx / n - x, sy = sy / n - y, i = 0; i < n; ++i) {
          node = nodes[i], node.x -= sx, node.y -= sy;
        }
      }
  
      force.initialize = function(_) {
        nodes = _;
      };
  
      force.x = function(_) {
        return arguments.length ? (x = +_, force) : x;
      };
  
      force.y = function(_) {
        return arguments.length ? (y = +_, force) : y;
      };
  
      return force;
    }
  
    function constant(x) {
      return function() {
        return x;
      };
    }
  
    function jiggle() {
      return (Math.random() - 0.5) * 1e-6;
    }
  
    function x(d) {
      return d.x + d.vx;
    }
  
    function y(d) {
      return d.y + d.vy;
    }
  
    function collide(radius) {
      var nodes,
          radii,
          strength = 1,
          iterations = 1;
  
      if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);
  
      function force() {
        var i, n = nodes.length,
            tree,
            node,
            xi,
            yi,
            ri,
            ri2;
  
        for (var k = 0; k < iterations; ++k) {
          tree = d3Quadtree.quadtree(nodes, x, y).visitAfter(prepare);
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            ri = radii[i], ri2 = ri * ri;
            xi = node.x + node.vx;
            yi = node.y + node.vy;
            tree.visit(apply);
          }
        }
  
        function apply(quad, x0, y0, x1, y1) {
          var data = quad.data, rj = quad.r, r = ri + rj;
          if (data) {
            if (data.index > i) {
              var x = xi - data.x - data.vx,
                  y = yi - data.y - data.vy,
                  l = x * x + y * y;
              if (l < r * r) {
                if (x === 0) x = jiggle(), l += x * x;
                if (y === 0) y = jiggle(), l += y * y;
                l = (r - (l = Math.sqrt(l))) / l * strength;
                node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
                node.vy += (y *= l) * r;
                data.vx -= x * (r = 1 - r);
                data.vy -= y * r;
              }
            }
            return;
          }
          return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
        }
      }
  
      function prepare(quad) {
        if (quad.data) return quad.r = radii[quad.data.index];
        for (var i = quad.r = 0; i < 4; ++i) {
          if (quad[i] && quad[i].r > quad.r) {
            quad.r = quad[i].r;
          }
        }
      }
  
      force.initialize = function(_) {
        var i, n = (nodes = _).length; radii = new Array(n);
        for (i = 0; i < n; ++i) radii[i] = +radius(nodes[i], i, nodes);
      };
  
      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };
  
      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };
  
      force.radius = function(_) {
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), force) : radius;
      };
  
      return force;
    }
  
    function x$1(d) {
      return d.x + d.vx;
    }
  
    function y$1(d) {
      return d.y + d.vy;
    }
  
    function rectCollide(bbox) {
      var nodes,
          boundingBoxes,
          strength = 1,
          iterations = 1;
  
      if (typeof bbox !== "function") bbox = constant(bbox == null ? [[0,0][1,1]] : bbox);
  
      function force() {
        var i,
            n = nodes.length,
            tree,
            node,
            xi,
            yi,
            bbi,
            nx1,
            ny1,
            nx2,
            ny2
  
        for (var k = 0; k < iterations; ++k) {
          tree = d3Quadtree.quadtree(nodes, x$1, y$1).visitAfter(prepare);
  
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            bbi = boundingBoxes[i],
            xi = node.x + node.vx;
            yi = node.y + node.vy;
            nx1 = xi + bbi[0][0]
            ny1 = yi + bbi[0][1]
            nx2 = xi + bbi[1][0]
            ny2 = yi + bbi[1][1]
            tree.visit(apply);
          }
        }
  
        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data,
              bWidth = bbLength(bbi, 0),
              bHeight = bbLength(bbi, 1);
  
            if (data) {
              if (data.index > i) {
                var bbj = boundingBoxes[data.index],
                  dnx1 = data.x + data.vx + bbj[0][0],
                  dny1 = data.y + data.vy + bbj[0][1],
                  dnx2 = data.x + data.vx + bbj[1][0],
                  dny2 = data.y + data.vy + bbj[1][1],
                  dWidth = bbLength(bbj, 0),
                  dHeight = bbLength(bbj, 1),
                  x = node.x - data.x,
                  y = node.y - data.y,
                  lx = Math.abs(x),
                  ly = Math.abs(y);
  
                if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {
  
                  if (x === 0) x = jiggle(), lx += x * x;
                  if (y === 0) y = jiggle(), ly += y * y;
  
                    node.vx += lx * (1 / lx) * ((bWidth * bWidth) / (dWidth * dWidth + bWidth));
                    node.vy += ly * (1 / ly) * ((bHeight * bHeight) / (dHeight * dHeight + bHeight));
                    data.vx -= lx * (1 / lx) * (((bWidth * bWidth) / (dWidth * dWidth + bWidth)));
                    data.vy -= ly * (1 / ly) * (((bHeight * bHeight) / (dHeight * dHeight + bHeight)));
  
                }
  
              }
              return;
            }
  
            return x0 > nx2 || x1 < nx1 || y0 > ny2 || y1 < ny1;
        }
  
      }
  
      function prepare(quad) {
        if (quad.data) return quad.bb = boundingBoxes[quad.data.index];
          for (var i = quad.bb = [[0,0],[0,0]]; i < 4; ++i) {
            if (quad[i] && bbArea(quad[i].bb) > bbArea(quad.bb)) {
              quad.bb = quad[i].bb;
          }
        }
      }
  
  
      function bbArea(bbox) {
        return (bbox[1][0] - bbox[0][0]) * (bbox[1][1] - bbox[0][1])
      }
  
      function bbLength(bbox, heightWidth) {
        return (bbox[1][heightWidth] - bbox[0][heightWidth])
      }
  
      force.initialize = function(_) {
        var i, n = (nodes = _).length; boundingBoxes = new Array(n);
        for (i = 0; i < n; ++i) boundingBoxes[i] = bbox(nodes[i], i, nodes);
      };
  
      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };
  
      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };
  
      force.bbox = function(_) {
        return arguments.length ? (bbox = typeof _ === "function" ? _ : constant(+_), force) : bbox;
      };
  
      return force;
    }
  
    function index(d, i) {
      return i;
    }
  
    function link(links) {
      var id = index,
          strength = defaultStrength,
          strengths,
          distance = constant(30),
          distances,
          nodes,
          count,
          bias,
          iterations = 1;
  
      if (links == null) links = [];
  
      function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
      }
  
      function force(alpha) {
        for (var k = 0, n = links.length; k < iterations; ++k) {
          for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
            link = links[i], source = link.source, target = link.target;
            x = target.x + target.vx - source.x - source.vx || jiggle();
            y = target.y + target.vy - source.y - source.vy || jiggle();
            l = Math.sqrt(x * x + y * y);
            l = (l - distances[i]) / l * alpha * strengths[i];
            x *= l, y *= l;
            target.vx -= x * (b = bias[i]);
            target.vy -= y * b;
            source.vx += x * (b = 1 - b);
            source.vy += y * b;
          }
        }
      }
  
      function initialize() {
        if (!nodes) return;
  
        var i,
            n = nodes.length,
            m = links.length,
            nodeById = d3Collection.map(nodes, id),
            link;
  
        for (i = 0, count = new Array(n); i < n; ++i) {
          count[i] = 0;
        }
  
        for (i = 0; i < m; ++i) {
          link = links[i], link.index = i;
          if (typeof link.source !== "object") link.source = nodeById.get(link.source);
          if (typeof link.target !== "object") link.target = nodeById.get(link.target);
          ++count[link.source.index], ++count[link.target.index];
        }
  
        for (i = 0, bias = new Array(m); i < m; ++i) {
          link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
        }
  
        strengths = new Array(m), initializeStrength();
        distances = new Array(m), initializeDistance();
      }
  
      function initializeStrength() {
        if (!nodes) return;
  
        for (var i = 0, n = links.length; i < n; ++i) {
          strengths[i] = +strength(links[i], i, links);
        }
      }
  
      function initializeDistance() {
        if (!nodes) return;
  
        for (var i = 0, n = links.length; i < n; ++i) {
          distances[i] = +distance(links[i], i, links);
        }
      }
  
      force.initialize = function(_) {
        nodes = _;
        initialize();
      };
  
      force.links = function(_) {
        return arguments.length ? (links = _, initialize(), force) : links;
      };
  
      force.id = function(_) {
        return arguments.length ? (id = _, force) : id;
      };
  
      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };
  
      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
      };
  
      force.distance = function(_) {
        return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
      };
  
      return force;
    }
  
    function x$2(d) {
      return d.x;
    }
  
    function y$2(d) {
      return d.y;
    }
  
    var initialRadius = 10;
    var initialAngle = Math.PI * (3 - Math.sqrt(5));
    function simulation(nodes) {
      var simulation,
          alpha = 1,
          alphaMin = 0.001,
          alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
          alphaTarget = 0,
          velocityDecay = 0.6,
          forces = d3Collection.map(),
          stepper = d3Timer.timer(step),
          event = d3Dispatch.dispatch("tick", "end");
  
      if (nodes == null) nodes = [];
  
      function step() {
        tick();
        event.call("tick", simulation);
        if (alpha < alphaMin) {
          stepper.stop();
          event.call("end", simulation);
        }
      }
  
      function tick() {
        var i, n = nodes.length, node;
  
        alpha += (alphaTarget - alpha) * alphaDecay;
  
        forces.each(function(force) {
          force(alpha);
        });
  
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          if (node.fx == null) node.x += node.vx *= velocityDecay;
          else node.x = node.fx, node.vx = 0;
          if (node.fy == null) node.y += node.vy *= velocityDecay;
          else node.y = node.fy, node.vy = 0;
        }
      }
  
      function initializeNodes() {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.index = i;
          if (isNaN(node.x) || isNaN(node.y)) {
            var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
          }
          if (isNaN(node.vx) || isNaN(node.vy)) {
            node.vx = node.vy = 0;
          }
        }
      }
  
      function initializeForce(force) {
        if (force.initialize) force.initialize(nodes);
        return force;
      }
  
      initializeNodes();
  
      return simulation = {
        tick: tick,
  
        restart: function() {
          return stepper.restart(step), simulation;
        },
  
        stop: function() {
          return stepper.stop(), simulation;
        },
  
        nodes: function(_) {
          return arguments.length ? (nodes = _, initializeNodes(), forces.each(initializeForce), simulation) : nodes;
        },
  
        alpha: function(_) {
          return arguments.length ? (alpha = +_, simulation) : alpha;
        },
  
        alphaMin: function(_) {
          return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
        },
  
        alphaDecay: function(_) {
          return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
        },
  
        alphaTarget: function(_) {
          return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
        },
  
        velocityDecay: function(_) {
          return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
        },
  
        force: function(name, _) {
          return arguments.length > 1 ? ((_ == null ? forces.remove(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
        },
  
        find: function(x, y, radius) {
          var i = 0,
              n = nodes.length,
              dx,
              dy,
              d2,
              node,
              closest;
  
          if (radius == null) radius = Infinity;
          else radius *= radius;
  
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            dx = x - node.x;
            dy = y - node.y;
            d2 = dx * dx + dy * dy;
            if (d2 < radius) closest = node, radius = d2;
          }
  
          return closest;
        },
  
        on: function(name, _) {
          return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
        }
      };
    }
  
    function manyBody() {
      var nodes,
          node,
          alpha,
          strength = constant(-30),
          strengths,
          distanceMin2 = 1,
          distanceMax2 = Infinity,
          theta2 = 0.81;
  
      function force(_) {
        var i, n = nodes.length, tree = d3Quadtree.quadtree(nodes, x$2, y$2).visitAfter(accumulate);
        for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
      }
  
      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length;
        strengths = new Array(n);
        for (i = 0; i < n; ++i) strengths[i] = +strength(nodes[i], i, nodes);
      }
  
      function accumulate(quad) {
        var strength = 0, q, c, x, y, i;
  
        // For internal nodes, accumulate forces from child quadrants.
        if (quad.length) {
          for (x = y = i = 0; i < 4; ++i) {
            if ((q = quad[i]) && (c = q.value)) {
              strength += c, x += c * q.x, y += c * q.y;
            }
          }
          quad.x = x / strength;
          quad.y = y / strength;
        }
  
        // For leaf nodes, accumulate forces from coincident quadrants.
        else {
          q = quad;
          q.x = q.data.x;
          q.y = q.data.y;
          do strength += strengths[q.data.index];
          while (q = q.next);
        }
  
        quad.value = strength;
      }
  
      function apply(quad, x1, _, x2) {
        if (!quad.value) return true;
  
        var x = quad.x - node.x,
            y = quad.y - node.y,
            w = x2 - x1,
            l = x * x + y * y;
  
        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        if (w * w / theta2 < l) {
          if (l < distanceMax2) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
            node.vx += x * quad.value * alpha / l;
            node.vy += y * quad.value * alpha / l;
          }
          return true;
        }
  
        // Otherwise, process points directly.
        else if (quad.length || l >= distanceMax2) return;
  
        // Limit forces for very close nodes; randomize direction if coincident.
        if (quad.data !== node || quad.next) {
          if (x === 0) x = jiggle(), l += x * x;
          if (y === 0) y = jiggle(), l += y * y;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        }
  
        do if (quad.data !== node) {
          w = strengths[quad.data.index] * alpha / l;
          node.vx += x * w;
          node.vy += y * w;
        } while (quad = quad.next);
      }
  
      force.initialize = function(_) {
        nodes = _;
        initialize();
      };
  
      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };
  
      force.distanceMin = function(_) {
        return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
      };
  
      force.distanceMax = function(_) {
        return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
      };
  
      force.theta = function(_) {
        return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
      };
  
      return force;
    }
  
    function x$3(x) {
      var strength = constant(0.1),
          nodes,
          strengths,
          xz;
  
      if (typeof x !== "function") x = constant(x == null ? 0 : +x);
  
      function force(alpha) {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
        }
      }
  
      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length;
        strengths = new Array(n);
        xz = new Array(n);
        for (i = 0; i < n; ++i) {
          strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
        }
      }
  
      force.initialize = function(_) {
        nodes = _;
        initialize();
      };
  
      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };
  
      force.x = function(_) {
        return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), initialize(), force) : x;
      };
  
      return force;
    }
  
    function y$3(y) {
      var strength = constant(0.1),
          nodes,
          strengths,
          yz;
  
      if (typeof y !== "function") y = constant(y == null ? 0 : +y);
  
      function force(alpha) {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
        }
      }
  
      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length;
        strengths = new Array(n);
        yz = new Array(n);
        for (i = 0; i < n; ++i) {
          strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
        }
      }
  
      force.initialize = function(_) {
        nodes = _;
        initialize();
      };
  
      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };
  
      force.y = function(_) {
        return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), initialize(), force) : y;
      };
  
      return force;
    }
  
    exports.forceCenter = center;
    exports.forceCollide = collide;
    exports.forceRectCollide = rectCollide;
    exports.forceLink = link;
    exports.forceManyBody = manyBody;
    exports.forceSimulation = simulation;
    exports.forceX = x$3;
    exports.forceY = y$3;
  
    Object.defineProperty(exports, '__esModule', { value: true });
  
  }));