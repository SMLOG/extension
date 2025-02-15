
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
let wordCount = 0; // Initialize a counter for unique IDs
function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}
function wrapWordsInTextNodes() {
    function wrapTextNode(node) {
        const text = node.nodeValue;
        const words = breakIntoWordsIncludingPunctuationAndFloats(text); // Use the custom function
        const wrappedWords = words.map((word) => {
            return word.match(/[a-zA-Z0-9]/)&& `<span class="word" id="word-${wordCount++}">${word}</span>`|| `<span class="word2">${word}</span>`;
        }).join(''); // Join back into a single string
        const wrapper = document.createElement('span'); // Create a new wrapper element
        wrapper.innerHTML = wrappedWords; // Set the inner HTML to the wrapped words
        return wrapper;
    }

    function traverseNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentNode;
            if(isElementVisible(parent)){
                const wrappedNode = wrapTextNode(node);
                parent.replaceChild(wrappedNode, node); // Replace original text node with new wrapped node
            }

        } else {
            for (let child of node.childNodes) {
                if(!child.hasAttribute||!child.hasAttribute('data-no-word') && isElementVisible(child))
                traverseNodes(child); // Recursively traverse child nodes
            }
        }
    }

    traverseNodes(document.body); // Start traversal from the body
}

// Call the function to wrap words
let isRunning2 = false;
let currentPromise;
function scrollToElementInView(span) {
    const rect = span.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Check if the element is in the viewport
    if (rect.top < 0 || rect.bottom > windowHeight) {
        // Calculate the scroll position to center the element
        const scrollPosition = window.scrollY + rect.top - (windowHeight / 2) + (rect.height / 2);
        
        // Scroll to the calculated position
        window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth' // Smooth scroll
        });
    }
}
let lastword;

function active(word,yes){
	word.style.borderBottom=yes?'2px solid yellow':'';

}
function isWordActive(word){
	return word.style.borderBottom=='2px solid yellow';
}
async function printTime(startId) {
    while (isRunning2) {
        const now = new Date();
        console.log(startId,now.toLocaleTimeString());
        if(lastword)active(lastword,false);
        let word = document.querySelector('span#word-'+startId++);
        // Wait for 1 second
        if(startId>wordCount)break;
        if(!word)continue;
        scrollToElementInView(word)
	active(word,true);

        lastword = word;
        try{
              await playSound({ q: word.textContent }, true);

        }catch(error){
            console.error(error);
        }

       // await new Promise(resolve => setTimeout(resolve, 200));
	active(word,false);

    }
    isRunning2=false;
}
function startPrintingTime(startId) {
    // Stop the previous loop if it's running
    if (isRunning2) {
        isRunning2 = false;
        currentPromise.then(() => {
            // Wait for the loop to finish before starting a new one
            startNewLoop(startId);
        });
    } else {
        startNewLoop(startId);
    }
}

async function startNewLoop(startId) {
    isRunning2 = true;
    currentPromise = await printTime(startId);
}
let playSound;
export function audioRead(call){
    wrapWordsInTextNodes();
    if(playSound)return;
    playSound = call;
    document.body.addEventListener('click', function(event) {
        // Check if the clicked element is a span with the class 'word'
        if (event.target.tagName === 'SPAN' && event.target.classList.contains('word')) {
            // Unhighlight all spans with the class 'word'
            let status = isWordActive(event.target);
           
            let startId = parseInt(event.target.id.split('-')[1]);
            // Highlight the clicked span
            let direct=0;
            if(!status)direct=1; // Apply highlight
            if(direct){
                console.log('start it');
                startPrintingTime(startId);
            }else{
                isRunning2=false;
            }
        }
    });

}
