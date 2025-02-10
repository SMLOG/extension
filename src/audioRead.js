function breakIntoWordsIncludingPunctuationAndFloats(sentence) {
    const result = [];
    let currentWord = '';

    for (let char of sentence) {
        if (char.trim() === '') {
            // If currentWord is not empty, push it to result first
            if (currentWord) {
                result.push(currentWord);
                currentWord = '';
            }
            // Push the space as a separate element
            result.push(char);
        } else if (/[.,！?;:"]/.test(char)) {
            // If the char is punctuation, push the current word (if any), then the punctuation
            if (currentWord) {
                result.push(currentWord);
                currentWord = '';
            }
            result.push(char);
        } else if (/\d/.test(char) || char === '.') {
            // If the char is a digit or a decimal point, build the current number
            currentWord += char;
        } else {
            // If currentWord is a number, push it and start a new word
            if (currentWord && /\d/.test(currentWord)) {
                result.push(currentWord);
                currentWord = '';
            }
            // Build the current word
            currentWord += char;
        }
    }

    // If there's any remaining word or number, push it to result
    if (currentWord) {
        result.push(currentWord);
    }

    return result;
}

function wrapWordsInTextNodes() {
    let wordCount = 0; // Initialize a counter for unique IDs

    function wrapTextNode(node) {
        const text = node.nodeValue;
        const words = breakIntoWordsIncludingPunctuationAndFloats(text); // Use the custom function
        const wrappedWords = words.map((word) => {
            return word.match(/[a-zA-Z0-9]/) && `<span class="word" id="word-${wordCount++}">${word}</span>` || `<span class="word2">${word}</span>`;
        }).join(''); // Join back into a single string
        const wrapper = document.createElement('span'); // Create a new wrapper element
        wrapper.innerHTML = wrappedWords; // Set the inner HTML to the wrapped words
        return wrapper;
    }

    function traverseNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentNode;
            const wrappedNode = wrapTextNode(node);
            parent.replaceChild(wrappedNode, node); // Replace original text node with new wrapped node
        } else {
            for (let child of node.childNodes) {
                traverseNodes(child); // Recursively traverse child nodes
            }
        }
    }

    traverseNodes(document.body); // Start traversal from the body
}

let clickTime=0;
export function audioRead(playSound) {
    // Call the function to wrap words
    wrapWordsInTextNodes();
    document.body.addEventListener('click', function (event) {
        // Check if the clicked element is a span with the class 'word'
        if (event.target.tagName === 'SPAN' && event.target.classList.contains('word')) {
            // Unhighlight all spans with the class 'word'
            const spans = document.querySelectorAll('span.word'); let status = event.target.style.backgroundColor;
            spans.forEach(span => {
                span.style.backgroundColor = ''; // Remove highlight
            });

            if(new Date().getTime()-clickTime>500){
                 clickTime=+new Date();
            }
            // Highlight the clicked span
            if (status != 'yellow') event.target.style.backgroundColor = 'yellow'; // Apply highlight
            if (event.target.style.backgroundColor == 'yellow') {
                (async () => {
                    let start = parseInt(event.target.id.replace('word-', ''));
                    let time = clickTime;
                    for (; ;) {
                        if(time!=clickTime)break;
                        let word = document.querySelector('#word-' + start++);
                        if (!word) break;
                        console.log(word.textContent);
                        word.style.backgroundColor = 'yellow'
                        await playSound({ q: word.textContent }, true);
                        word.style.backgroundColor = '';
                    }
                })();

            }
        }
    });
}