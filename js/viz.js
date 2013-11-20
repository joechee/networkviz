(function (window) {
    var r = 100;

    var width = 960,
        height = 500,
        linkDistance = 300,
        charge = -1000,
        radius = 30;

    var fill = d3.scale.category20();

    var force = d3.layout.force()
        .size([width, height])
        .nodes([]) // initialize with a single node
        .linkDistance(linkDistance)
        .charge(charge);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var nodes = force.nodes(),
        links = force.links(),
        node = svg.selectAll(".node"),
        link = svg.selectAll(".link"),
        nodeDisplay = svg.selectAll(".tag");

    restart();

    var nodeID = 0;
  
    setInterval(tick, 10);

    function addNode(point) {
      nodeID++;
      var node = {
            x: svg.attr('width') / 2 + Math.random(),
            y: svg.attr('height') / 2 + Math.random(),
            radius: radius,
            name: "node-" + nodeID,
            getConnectedNodes: function () {
              var connectedNodes = [];
              links.forEach(function (link) {
                if (link.source === node) {
                  connectedNodes.push(link.target);
                } else if (link.target === node) {
                  connectedNodes.push(link.source);
                }
              });
              return connectedNodes;
            },
            getConnectedLinks: function () {
              var connectedLinks = [];
              links.forEach(function (link) {
                if (link.source === node || link.target === node) {
                  connectedLinks.push(link);
                }
              });
              return connectedLinks;
            },
            hasLink: function (node2) {
              var node1 = this;
              var exists = links.filter(function (link) {
                if (link.source === node1 && link.target === node2) {
                  return true;
                } else if (link.source === node2 && link.target === node1) {
                  return true;
                } else {
                  return false;
                }
              });
              return exists.length !== 0;
            },
            removeLink: function (node2) {
              var node1 = this;
              links = links.filter(function (link) {
                if (link.source === node1 && link.target === node2) {
                  return false;
                } else if (link.source === node2 && link.target === node1) {
                  return false;
                } else {
                  return true;
                }
              });
              restart();
            },
            addLink: function (node2) {
              var node1 = this;
              var exists = this.hasLink(node2);
              if (exists) {
                return;
              } else {
                links.push({
                  source: node1,
                  target: node2,
                  passingMessage: 0,
                  remove: function () {
                    var index = links.indexOf(this);
                    if (index !== -1) {
                      links.splice(index, 1);
                      restart();
                    }
                  }
                });
                restart();
              }
            },
            message: function (node2, msg, delay, callback) {
              if (this.removed === true) {
                return;
              }
              var currentNode = this;
              if (!delay) {
                delay = 1;
              }
              timestep.delay(function () {

                currentNode.display('Sending "' + msg + '"');
                currentNode.alert = "messaging";
                links.forEach(function (link) {
                    if ((link.source === currentNode && link.target === node2)
                      || (link.source === node2 && link.target === currentNode)) {
                      
                      // Sending message
                      link.passingMessage++;
                      
                    }
                  });
                timestep.delay(function () {
                  links.forEach(function (link) {
                    if ((link.source === currentNode && link.target === node2)
                      || (link.source === node2 && link.target === currentNode)) { 
                        link.passingMessage--;
                        // Receive message
                        if (node2.removed !== true) {
                          node2.receive(currentNode, msg);
                        }
                        if (callback) {
                          callback(msg);
                        }
                    }
                  });
                }, delay);

              }, 0);

            },
            receive: function (fromNode, msg) {
              this.display("Received: " + msg);
              this.alert = "receiveMessage";
            },
            remove: function () {
              this.getConnectedLinks().forEach(function (link) {
                link.remove();
              });
              var index = nodes.indexOf(this);
              if (index !== -1) {
                nodes.splice(index, 1);
              }

              index = nodeDisplay.indexOf(this);
              if (index !== -1) {
                nodeDisplay.splice(index, 1);
              }
              this.removed = true;
              restart();
            },
            display: function (msg) {
              this.displayedMessage = msg;
            }
        },
        n = nodes.push(node);

      nodes.forEach(function(target) {
        if (target !== node) {
          links.push({
            source: node,
            target: target,
            passingMessage: 0,
            remove: function () {
              var index = links.indexOf(this);
              if (index !== -1) {
                links.splice(index, 1);
                restart();
              }
            }
          });
        } 

      });

      restart();

      return node;
    }

    function tick() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .attr("class", function (d) { if (d.passingMessage > 0) {
              return "link message";
            } else {
              return "link";
            }
          });
          
      nodeDisplay.text(function (d) {
            return d.displayedMessage || d.name;
          });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .attr("radius", function (d) { return d.radius})
          .attr("class", function (d) { 
            if (d.alert === "messaging") {
              return "node message";
            } else if (d.alert === "receiveMessage") {
              return "node received";
            } else {
              return "node";
            }
          });

      nodeDisplay
        .attr("x", function(d) { return d.x + d.radius; })
        .attr("y", function(d) { return d.y + d.radius; });
    }

    function restart() {
      link = link.data(links);

      link.enter().insert("line", ".node")
          .attr("class", "link")
          .on("mousedown", function (d) {
            d.remove();
          });
          
      link.exit().remove();

      node = node.data(nodes);

      node.enter()
          .insert("circle", ".cursor")
          .attr("class", "node")
          .attr("r", radius)
          .on("mousedown", function (d) {
            d.remove();
            // TODO: add d.disable?
          });
      node.exit().remove();


      nodeDisplay = nodeDisplay.data(nodes);

      nodeDisplay.enter()
                .insert("text", ".tag")
                .text(function (d) {
                  return d.displayedMessage || "hello";
                });

      nodeDisplay
        .exit()
        .remove();
      force.start();
    }


    function clearDisplays() {
      nodes.forEach(function (node) {
        node.alert = undefined;
        node.displayedMessage = "";
      });
    }

    function resetNodes() {
      nodes.length = 0;
      links.length = 0;
      nodeID = 0;
      restart();
    }

    function clearLinks() {
      links.forEach(function (link) {
        link.passingMessage = 0;
      });
    }

    function restartNodes() {
      clearDisplays();
      clearLinks();
      restart();
    }
    
    window.addNode = addNode;
    window.clearDisplays = clearDisplays;
    window.resetNodes = resetNodes;
    window.restartNodes = restartNodes;


    window.nodes = nodes;
    window.links = links;
    window.force = force;

})(window);





(function (window) {
  var Time = function () {
    var currentObject = this;
    var timeQueue = [];
    var time = 0;
    var initial = function () {};

    this.advance = function () {
      time++;
      clearDisplays();
      if (timeQueue[time]) {
        timeQueue[time].forEach(function (f) {
          run(f);
        });  
      }

      if (timeQueue.length < time) {
        return "No more events";
      }
      return time;
    };

    this.back = function () {
      this.setTime(time - 1);
    };

    this.delay = function (f, delayTime) {
      
      if (!timeQueue[time + delayTime]) {
        timeQueue[time + delayTime] = [];
      }
      var delayedTime = timeQueue[time + delayTime];
      delayedTime.push(f);

      if (delayTime === 0) {
        return run(f);
      }
    };

    function run(f) {
      return f(time);
    };

    this.viewQueue = function () {
      return timeQueue;
    };

    this.reset = function () {
      timeQueue = [];
      time = 0;
      restartNodes();
    };

    this.setTime = function (setTime) {
      this.reset();
      run(initial);
      
      for (time = 0; time < setTime;) {
        this.advance();
      }
      for (var i = 0; i < 1000; i++) {
        force.tick();
      }
    };

    this.initial = function (f) {
      if (time !== 0) {
        throw new Error("Time is not initial!");
      } else {
        initial = f;
        run(f);
        for (var i = 0; i < 1000; i++) {
          force.tick();
        }
      }
    };


  };


  var timestep = new Time();

  window.timestep = timestep;

})(window);

$(function () {
  $('.add-node').click(window.addNode);
  $('.set-time').click(function () {
    var val = parseInt($('.js-current-time').val());
    window.timestep.setTime(val);
  });
  $('.advance').click(function () {
    window.timestep.advance();
    $('.js-current-time').val(parseInt($('.js-current-time').val()) + 1);
  });

  $('.back').click(function () {
    var timeValue = parseInt($('.js-current-time').val(), 10);
    if (timeValue > 0) {
      window.timestep.back();
      $('.js-current-time').val(timeValue - 1);
    }
  });

  $('.start-chat').click(function () {
    $('.js-current-time').val(0);
    window.startChatProblem();
  });

  $('.start-ring-topology').click(function () {
    $('.js-current-time').val(0);
    window.startRingTopology();
  });

  $('.start-pipelined-ring-topology').click(function () {
    $('.js-current-time').val(0);
    window.startRingTopologyPipeline();
  });

  $('.start-mesh-topology').click(function () {
    $('.js-current-time').val(0);
    window.startMeshTopology();
  });

  $('.start-star-topology').click(function () {
    $('.js-current-time').val(0);
    window.startStarTopology();
  });

  $('.start-packet-switching').click(function () {
    $('.js-current-time').val(0);
    window.startPacketSwitching();
  });
});



(function (window) {
  function startChatProblem() {
    timestep.reset();
    resetNodes();

    var nodeA = addNode();
    var nodeB = addNode();
    var nodeC = addNode();

    timestep.initial(function () {
      nodeA.message(nodeB, "Hi this is a joke", 1, function () {
        nodeB.message(nodeA, "Haha", 1);
        nodeB.message(nodeC, "Haha", 1);
      });
      nodeA.message(nodeC, "Hi this is a joke", 3);

    });


  }

  function distance(node1, node2) {
    function square (x) {
      return x * x;
    }
    return Math.sqrt(square(node1.x - node2.x) + square(node1.y - node2.y));
  }

  function startRingTopology(numNodes) {
    numNodes = numNodes || 6;
    // Create the ring first
    timestep.reset();
    timestep.initial(function () {
      resetNodes();
      var nodes = [];
      for (var i = 0; i < numNodes; i++) {
        nodes.push(addNode());
      }

      for (var i = 0; i < numNodes; i++) {
        for (var j = 0; j < numNodes; j++) {
          nodes[i].removeLink(nodes[j]);
        }
      }
      var centerX = 425;
      var centerY = 240;
      for (var i = 0; i < numNodes; i++) {
        nodes[i].x = 425 + 300 * Math.sin(2 * Math.PI * i/numNodes);
        nodes[i].y = 240 + 300 * Math.cos(2 * Math.PI * i/numNodes);
      }
      for (var i = 0; i < numNodes; i++) {
        nodes[i].addLink(nodes[(i + 1) % numNodes]);
      }

      // Horner's method


      var computation = [];
      for (var i = numNodes; i > 0; i--) {
        computation.push(i);
      }
      var x = 4;
      var accumulator = 0;
      var i = 0;

      function horner(msg) {
        if (i === 0 && accumulator !== 0) {
          nodes[i].display("Answer: " + accumulator);
        } else {
          accumulator = msg.match(/Accumulator: (\d+)/)[1];
          accumulator = accumulator * x + computation[i];
          nodes[i].message(nodes[(i + 1) % numNodes], "Accumulator: " + accumulator, 1, function (msg) {
            i = (i + 1) % numNodes;
            horner(msg);
          });
        }
      }

      horner("Accumulator: " + accumulator);

    });
  }

  function startRingTopologyPipeline(numNodes) {
    numNodes = numNodes || 6;
    // Create the ring first
    timestep.reset();
    timestep.initial(function () {
      resetNodes();
      var nodes = [];
      for (var i = 0; i < numNodes; i++) {
        nodes.push(addNode());
      }

      for (var i = 0; i < numNodes; i++) {
        for (var j = 0; j < numNodes; j++) {
          nodes[i].removeLink(nodes[j]);
        }
      }
      var centerX = 425;
      var centerY = 240;
      for (var i = 0; i < numNodes; i++) {
        nodes[i].x = 425 + 300 * Math.sin(2 * Math.PI * i/numNodes);
        nodes[i].y = 240 + 300 * Math.cos(2 * Math.PI * i/numNodes);
      }
      for (var i = 0; i < numNodes; i++) {
        nodes[i].addLink(nodes[(i + 1) % numNodes]);
      }

      // Horner's method


      var computation = [];
      for (var i = numNodes; i > 0; i--) {
        computation.push(i);
      }

      function pipeline(start) {
        var x = 4;
        var accumulator = 0;
        var i = start;

        function horner(msg) {
          if (i === start && accumulator !== 0) {
            nodes[i].display("Answer: " + accumulator);
          } else {
            accumulator = msg.match(/Accumulator: (\d+)/)[1];
            accumulator = accumulator * x + computation[((i - start) + numNodes) % numNodes];
            nodes[i].message(nodes[(i + 1) % numNodes], "Accumulator: " + accumulator, 1, function (msg) {
              i = (i + 1) % numNodes;
              horner(msg);
            });
          }
        }
        horner("Accumulator: " + accumulator);

      }


      for (var i = 0; i < numNodes; i++) {
        pipeline(i);
      }

    });

  }

  function startMeshTopology(numNodes) {
    numNodes = numNodes || 7;
    timestep.reset();
    resetNodes();
    var nodes = [];
    for (var i = 0; i < numNodes; i++) {
      nodes.push(addNode());
    }
  }

  function startStarTopology(numNodes) {
    numNodes = numNodes || 8;
    // Create the ring first
    timestep.reset();
    resetNodes();
    timestep.initial(function () {
      resetNodes();
      var nodes = [];
      for (var i = 0; i < numNodes; i++) {
        nodes.push(addNode());
      }

      for (var i = 0; i < numNodes; i++) {
        for (var j = 0; j < numNodes; j++) {
          nodes[i].removeLink(nodes[j]);
        }
      }


      var centerX = 483;
      var centerY = 256;
      nodes[0].x = centerX;
      nodes[1].y = centerY;
      for (var i = 1; i < numNodes; i++) {
        nodes[i].x = 425 + 100 * Math.sin(2 * Math.PI * i/numNodes);
        nodes[i].y = 240 + 100 * Math.cos(2 * Math.PI * i/numNodes);
      }

      for (var i = 1; i < numNodes; i++) {
        nodes[0].addLink(nodes[i]);
      }

      var center = nodes[0];
      var recipient = nodes[Math.floor(numNodes / 2)];

      nodes[1].message(nodes[0], "message to " + recipient.name, 1, function () {
        nodes[0].message(recipient, "message to " + recipient.name, 1, function () {
          recipient.display("Message received!");
        });
      });
    });
  }


  function startPacketSwitching() {
    var numNodes = 5;
    // Create the ring first
    timestep.reset();
    resetNodes();
    timestep.initial(function () {
      resetNodes();
      var nodes = [];
      for (var i = 0; i < numNodes; i++) {
        nodes.push(addNode());
      }

      for (var i = 0; i < numNodes; i++) {
        for (var j = 0; j < numNodes; j++) {
          nodes[i].removeLink(nodes[j]);
        }
      }

      nodes[0].x = 100;
      nodes[0].y = 100;
      nodes[1].x = 150;
      nodes[1].y = 100;     
      nodes[2].x = 200;
      nodes[2].y = 100;
      nodes[3].x = 200;
      nodes[3].y = 150;     
      nodes[4].x = 300;
      nodes[4].y = 100;     
      
      nodes[0].addLink(nodes[1]);
      nodes[1].addLink(nodes[2]);
      nodes[1].addLink(nodes[3]);
      nodes[2].addLink(nodes[4]);
      nodes[3].addLink(nodes[4]);

      nodes[0].message(nodes[1], "Hello", 1, function () {
        if (Math.random() > 0.5) {
          nodes[1].message(nodes[2], "Hello", 1, function () {
            nodes[2].message(nodes[4], "Hello", 1, function () {

            });
          });
        } else {
          nodes[1].message(nodes[3], "Hello", 1, function () {
            nodes[3].message(nodes[4], "Hello", 1, function () {

            });
          });
        }
      });
    });
 
  }

  window.startChatProblem = startChatProblem;
  window.startRingTopology = startRingTopology;
  window.startRingTopologyPipeline = startRingTopologyPipeline;
  window.startMeshTopology = startMeshTopology;
  window.startStarTopology = startStarTopology;
  window.startPacketSwitching = startPacketSwitching;
})(window);

