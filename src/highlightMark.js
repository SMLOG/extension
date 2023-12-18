export function highlightSelectedText(color) {
  console.log("highlightSelectedText");
  var tagName = "span";
  var selection = window.getSelection();
  if (selection.rangeCount > 0) {
    var range = selection.getRangeAt(0);
    var commonAncestor = range.commonAncestorContainer;

    if (commonAncestor.nodeName == "#text") {
      var newNode = document.createElement(tagName);
      newNode.style.backgroundColor = color;
      if (selection.toString().trim().length == 0) return;
      range.surroundContents(newNode);

      // Remove any overlapping spans
      var parentElement = newNode.parentNode;
      var spans = parentElement.getElementsByTagName("span");
      for (var i = 0; i < spans.length; i++) {
        var span = spans[i];
        if (span !== newNode && range.intersectsNode(span)) {
          span.outerHTML = span.innerHTML;
        }
      }
    } else {
      var nodeList = [];

      var walker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_ALL
      );

      while (walker.nextNode()) {
        var currentNode = walker.currentNode;
        if (
          range.comparePoint(currentNode, 0) !== 1 &&
          range.comparePoint(currentNode, currentNode.length) !== -1 &&
          currentNode.nodeType === Node.TEXT_NODE
        ) {
          nodeList.push(currentNode);
        }
      }
      // Store the current selection range
      var startContainer = range.startContainer;
      var startOffset = range.startOffset;
      //var endContainer = range.endContainer;
      //var endOffset = range.endOffset;
      // Wrap text nodes with <span> and apply CSS styles
      i = 0;
      nodeList.forEach(function (textNode) {
        var span = document.createElement(tagName);
        span.style.backgroundColor = color;

        if (i == 0) {
          var textContent = textNode.nodeValue;
          var highlightedText = textContent.substring(range.startOffset);
          var nohighlightedText = textContent.substring(0, range.startOffset);
          textNode.nodeValue = nohighlightedText;

          span.textContent = highlightedText;

          var parent = textNode.parentNode;
          parent.insertBefore(span, textNode.nextSibling);
        } else if (i == nodeList.length - 1) {
          textContent = textNode.nodeValue;
          nohighlightedText = textContent.substring(range.endOffset);
          highlightedText = textContent.substring(0, range.endOffset);
          textNode.nodeValue = nohighlightedText;

          span.textContent = highlightedText;

          parent = textNode.parentNode;
          parent.insertBefore(span, textNode);
        } else {
          span.textContent = textNode.nodeValue;

          parent = textNode.parentNode;
          parent.replaceChild(span, textNode);
        }

        i++;
      });

      // Restore the selection range
      range.setStart(startContainer, startOffset);
      // range.setEnd(endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

// Usage example
//document.addEventListener("mouseup", highlightSelectedText);
