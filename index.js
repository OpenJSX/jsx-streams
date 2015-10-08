var runtime = require('jsx-runtime');
var Stream = require('./stream');

runtime.Stream = Stream;

runtime.override({
  before: function(tree) {
    if (tree.__streams) {
      console.log('duplicate', tree);
    }

    tree.__streams = true;
    this.scope.streams = [];

    return tree;
  },

  /*renderTo: function(target, stream) {
    var renderer = this;

    stream.listen(function() {
      var a = stream.get();

      console.log(a);
      renderer.renderTo(target, a);
    });

    return stream.get();
  },*/
  tags: {
    '*': {
      enter: function(tag, props) {
        return tag;
      },
      child: function(child, parent, index, tag) {
        if (!(child instanceof Stream)) {
          return child;
        }

        var _this = this;
        var renderStream;
        var lastValue;
        var useDifference = this.updateType === 'difference';
        var handledStream = new Stream(getHandled());

        // debugger;

        child.listen(function() {
          notifyHandled(getHandled());
        });

        child.onClose(function() {
          handledStream.close();

          var oldStream = renderStream;

          if (oldStream) {
            renderStream = null;
            oldStream.close();
          }
        });

        if (this.scope.streams) {
          this.scope.streams.push(child);
        }

        function notifyHandled(val) {
          handledStream.put(val);
          handledStream.notify();
        }

        function getHandled() {
          var value = child.get();

          if (value instanceof Stream) {
            throw new Error('Stream should not return stream');
          }

          if (!Array.isArray(value)) {
            value = [value];
          }

          if (useDifference) {
            return handleDifference(value);
          }

          var oldRender = renderStream;
          var currentStream = _this.render(value);

          renderStream = currentStream;

          currentStream.onClose(function() {
            if (renderStream === currentStream) {
              // update to null
            }
          });

          currentStream.listen(function() {
            // debugger;
            notifyHandled(currentStream.get());
          });
          // doRenderStream();

          if (oldRender) {
            oldRender.close();
          }

          return currentStream.get();
        }

        function handleDifference(value) {
          var difference;
          var diffIndex;

          // debugger;

          if (lastValue) {
            for (var i = 0, len = value.length; i < len; i++) {
              if (i === lastValue.length || value[i] !== lastValue[i]) {
                // debugger;
                diffIndex = i;
                difference = value.slice(i);
                break;
              }
            }

            if (!difference) {
              difference = [];
              diffIndex = value.length;
            }
          } else {
            diffIndex = 0;
            difference = value;
          }

          var removeCount = lastValue ? lastValue.length - diffIndex : 0;

          console.log(diffIndex, removeCount, difference);

          difference = difference.map(function(item) {
            item = _this._render(item);

            // listen to streams here

            if (item instanceof Stream) {
              return item.get();
            }

            return item;
          });

          // close lastValue streams
          lastValue = value;

          return [index + diffIndex, removeCount, difference];
        }

        return handledStream;
      }
    }
  }
}, '*', -1);

runtime.override({
  tags: {
    '*': {
      enter: function(tag) {
        return tag;
      }
    }
  },

  render: function(result) {
    // console.log('render +1');
    var stream = new Stream.getter(function() {
      // debugger;
      return result();
    });

    // debugger;
    this.scope.streams.forEach(function(input) {
      input.listen(stream.notify);
    });

    return stream;
  }
}, '*', 1);