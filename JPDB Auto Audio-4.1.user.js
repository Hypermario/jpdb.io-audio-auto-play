// ==UserScript==
// @name         JPDB Auto Audio Play with Responsive Show Answer Button
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Adds styled audio and toggle buttons next to "Show Answer" on jpdb.io, with "Show Answer" expanding responsively. Prevents auto audio play if audio has already been played.
// @match        https://jpdb.io/review*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    // Function to be injected into the page
    function injectedCode() {
        var scriptEnabled;
        var audioPlayed = false; // Variable to track if audio has been played on this page

        function init() {
            // Initialize the scriptEnabled variable from localStorage
            scriptEnabled = localStorage.getItem('scriptEnabled');
            if (scriptEnabled === null) {
                // If not set in localStorage, default to true
                scriptEnabled = true;
            } else {
                // Convert the string back to boolean
                scriptEnabled = scriptEnabled === 'true';
            }

            // Add the audio play button and toggle button to the page
            addButtons();

            var showAnswerForm = document.querySelector('form[action="/review#a"]');
            if (showAnswerForm) {
                var showAnswerButton = showAnswerForm.querySelector('#show-answer');
                if (showAnswerButton) {
                    // Set flex properties to allow the button to expand
                    showAnswerForm.style.flexGrow = '1';
                    showAnswerForm.style.flexShrink = '1';
                    showAnswerForm.style.flexBasis = '0';

                    showAnswerButton.style.width = '100%'; // Make the button fill its container
                    showAnswerButton.style.height = '2.8rem'; // Match the height of the button

                    showAnswerButton.addEventListener(
                        'click',
                        function (event) {
                            if (scriptEnabled && !audioPlayed) {
                                event.preventDefault();
                                event.stopImmediatePropagation();

                                // Play the audio and wait for it to finish
                                playAudio().then(function () {
                                    // After audio finishes playing, submit the form
                                    showAnswerForm.submit();
                                });
                            } else {
                                // If the script is disabled or audio has already been played, proceed as normal
                                // Do not prevent default, allow the form to submit immediately
                            }
                        },
                        { capture: true }
                    );
                }
            }
        }

        function adjustParentContainers() {
            // Adjust parent containers to allow expansion
            var mainRow = document.querySelector('.main-row');
            if (mainRow) {
                mainRow.style.width = '100%';
                mainRow.style.maxWidth = '550px';
            }

            var mainColumn = document.querySelector('.main.column');
            if (mainColumn) {
                mainColumn.style.width = '100%';
                mainColumn.style.maxWidth = '550px';
            }

            var rowDiv = document.querySelector('.row.row-1');
            if (rowDiv) {
                rowDiv.style.display = 'flex';
                rowDiv.style.alignItems = 'center';
                rowDiv.style.width = '100%';
                rowDiv.style.maxWidth = '550px';
            }
        }

        function playAudio() {
            return new Promise(function(resolve, reject) {
                var audioButton = document.querySelector('.example-audio[data-audio]');
                if (audioButton) {
                    var dataAudio = audioButton.getAttribute('data-audio');
                    var dataVolume = parseFloat(audioButton.getAttribute('data-audio-volume') || "1.0");

                    // Construct the correct audio URL
                    var audioUrl = '/static/v/' + dataAudio;

                    // Create a new XMLHttpRequest to fetch the audio data
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', audioUrl, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.setRequestHeader('X-Access', 'please don\'t steal these files');
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            var audioData = xhr.response;
                            if (audioData) {
                                // Decrypt the first four bytes
                                var uint8Array = new Uint8Array(audioData);
                                uint8Array[0] ^= 0x06;
                                uint8Array[1] ^= 0x23;
                                uint8Array[2] ^= 0x54;
                                uint8Array[3] ^= 0x0f;
                                audioData = uint8Array.buffer;
                            }

                            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
                            audioContext.decodeAudioData(audioData, function(buffer) {
                                var source = audioContext.createBufferSource();
                                source.buffer = buffer;
                                var gainNode = audioContext.createGain();
                                gainNode.gain.value = dataVolume;
                                source.connect(gainNode);
                                gainNode.connect(audioContext.destination);
                                source.start(0);
                                source.onended = function() {
                                    audioPlayed = true; // Set audioPlayed to true after audio finishes
                                    resolve();
                                };
                            }, function(e) {
                                console.error('Error decoding audio data', e);
                                resolve();
                            });
                        } else {
                            console.error('Error fetching audio:', xhr.status);
                            resolve();
                        }
                    };
                    xhr.onerror = function() {
                        console.error('Network error while fetching audio');
                        resolve();
                    };
                    xhr.send();
                } else {
                    console.error('Audio button not found');
                    resolve();
                }
            });
        }


        function addButtons() {
            adjustParentContainers();

            var rowDiv = document.querySelector('.row.row-1');
            if (rowDiv) {
                // Ensure the rowDiv is displayed as flex
                rowDiv.style.display = 'flex';
                rowDiv.style.alignItems = 'center';

                // Insert the toggle button
                var toggleButton = createToggleButton();
                var showAnswerForm = rowDiv.querySelector('form[action="/review#a"]');
                if (showAnswerForm) {
                    rowDiv.insertBefore(toggleButton, showAnswerForm);
                } else {
                    rowDiv.insertBefore(toggleButton, rowDiv.firstChild);
                }

                // Insert the play button
                var playButton = createPlayButton();
                if (showAnswerForm) {
                    rowDiv.insertBefore(playButton, showAnswerForm.nextSibling);
                } else {
                    rowDiv.appendChild(playButton);
                }
            }
        }

        function createToggleButton() {
            // Create the toggle button
            var toggleButton = document.createElement('button');
            toggleButton.id = 'audio-toggle-button';

            // Style the toggle button
            toggleButton.style.padding = '0 10px';
            toggleButton.style.marginRight = '15px'; // Space between toggle button and "Show Answer" button
            toggleButton.style.height = '2.8rem'; // Match the height of "Show Answer" button
            toggleButton.style.backgroundColor = 'transparent';
            toggleButton.style.color = 'var(--button-text-color)';
            toggleButton.style.border = '1px solid var(--button-background-color)';
            toggleButton.style.borderRadius = '.7rem';
            toggleButton.style.cursor = 'pointer';
            toggleButton.style.lineHeight = '2.0rem'; // Vertically center the text
            toggleButton.style.fontSize = '1.0rem'; // Adjust emoji size here
            toggleButton.style.display = 'flex';
            toggleButton.style.alignItems = 'center';
            toggleButton.style.justifyContent = 'center';
            toggleButton.style.flexShrink = '0'; // Prevent the button from shrinking
            toggleButton.style.marginBottom = '8px';

            // Set the button content
            toggleButton.textContent = scriptEnabled ? '🔊' : '🔇';

            // Add click event listener to the toggle button
            toggleButton.addEventListener('click', function () {
                scriptEnabled = !scriptEnabled;
                localStorage.setItem('scriptEnabled', scriptEnabled);

                if (scriptEnabled) {
                    toggleButton.textContent = '🔊';
                } else {
                    toggleButton.textContent = '🔇';
                }
            });

            return toggleButton;
        }

        function createPlayButton() {
            // Create the audio play button
            var playButton = document.createElement('a');
            playButton.href = '#';
            playButton.className = 'icon-link example-audio';
            playButton.style.marginLeft = '15px'; // Adjust spacing as needed
            playButton.style.marginRight = '5px';
            playButton.style.height = '2.8rem'; // Match the height of the buttons
            playButton.style.display = 'flex';
            playButton.style.alignItems = 'center';
            playButton.style.justifyContent = 'center';
            playButton.style.flexShrink = '0'; // Prevent the button from shrinking
            playButton.style.marginBottom = '8px';

            // Create the icon element
            var icon = document.createElement('i');
            icon.className = 'ti ti-volume';
            // Allow easy modification of icon size
            icon.style.fontSize = '24px'; // Modify the size here

            // Append the icon to the play button
            playButton.appendChild(icon);

            // Add click event listener to the play button
            playButton.addEventListener('click', function (event) {
                event.preventDefault();
                playAudio();
            });

            return playButton;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // Inject the code into the page
    var script = document.createElement('script');
    script.textContent = '(' + injectedCode.toString() + ')();';
    document.head.appendChild(script);
})();
