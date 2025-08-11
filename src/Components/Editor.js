import { useNumberInput, Flex, Box, Icon, Image, VStack, Input, HStack, Text, Textarea, Button, Container, Center, useToast, Modal, ModalBody, ModalHeader, ModalFooter, ModalOverlay, ModalContent } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Howl, Howler } from 'howler';
import { Transforms, createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history'
import mixpanel from 'mixpanel-browser';
import CryptoJS from 'crypto-js'; 
import React from 'react';
import waitForElementTransition from 'wait-for-element-transition';
import './Editor.css';

function Editor(props) {

  // readOnly prop indicates to component whether this is a new journal session (edit) or viewing a prior session (read)
  const readOnly = props.readOnly;

  // State for USER SETTINGS for the journal session
  const [durationMins, setDurationMins] = useState(5)

  // State that controls lifecycle of the editor - setup, tips, editing, timeup, etc.
  const [loading, setLoading] = useState(true) 
  const [setupModalShown, setSetupModalShown] = useState(readOnly)
  const [tipsModalShown, setTipsModalShown] = useState(readOnly)
  const [timeUp, setTimeUp] = useState(false)

  // State about the editor 
  const [postId, setPostId] = useState(useParams().postId)
  const [initValue, setInitValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    }
  ])
  const [editor] = useState(()=>withReact(withHistory(createEditor())))

  // Refs - some references are redundant with state because useEffect hooks can't access updated state and must use Refs
  const editorValue = useRef(initValue);
  const ghostInterval = useRef();
  const promptInterval = useRef();
  const autosaveInterval = useRef();
  const lastKeystrokeTimestamp = useRef();
  const timer = useRef();
  const durationSeconds = useRef();
  const journalStartTime = useRef();
  const sessionComplete = useRef(false);
  const GPTCompletions = useRef({})

  // Other effects
  const navigate = useNavigate();
  const postSavedToast = useToast();

  // State related to the increment/decrement UI to set the duration setting
  const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } =
  useNumberInput({
    step: 1,
    defaultValue: 5,
    min: 1,
    max: 60,
    precision: 0,
    onChange: (valueString) => setDurationMins(parseInt(valueString))
  })
  const durationInc = getIncrementButtonProps()
  const durationDec = getDecrementButtonProps()
  const durationInput = getInputProps()

  // Set up the typing sound effect
  const sound = new Howl({
    src: ['/clickLower.wav'],
    format: ['wav'],
    autoSuspend: false,
    preload: true,
    volume: 1,
    onloaderror: (id, msg)=>alert('loaderror, id: ' + id  + msg)
  });
  Howler.autoSuspend = false;

  // useEffect is called ONCE when component mounts and the function it returns is called before component unloads  
  useEffect(() => {
    
    //log basic analytics to mixpanel
    try { 
      mixpanel.init('62f060ede5004cdf8b70946f12ffb0a8', {debug: true}); 
    } catch(e) {}

    //fetch the content of the journal post
    fetchContent();

    if(readOnly) {
      startEditor()
    }

    return () => teardownEditor()
  }, [])

  // Set serif font and softer text color globally on component mount
  useEffect(() => {
    document.body.style.fontFamily = "'Times New Roman', Times, serif";
    document.body.style.color = "#333";
  }, [])

  // Create custom heartbeat cursor
  useEffect(() => {
    const createCustomCursor = () => {
      // Try multiple selectors to find the Slate editable element
      const editableElement = document.querySelector('[data-slate-editor="true"]') || 
                             document.querySelector('.parent [contenteditable]') ||
                             document.querySelector('[contenteditable="true"]');
                             
      console.log('Found editable element:', editableElement);
      if (!editableElement) {
        console.log('No editable element found, trying again in 1 second');
        setTimeout(createCustomCursor, 1000);
        return;
      }

      // Hide the real cursor completely - be very aggressive about this
      editableElement.style.caretColor = 'transparent';
      editableElement.style.setProperty('caret-color', 'transparent', 'important');
      
      // Also hide any child element cursors
      const allEditableChildren = editableElement.querySelectorAll('*');
      allEditableChildren.forEach(child => {
        child.style.caretColor = 'transparent';
        child.style.setProperty('caret-color', 'transparent', 'important');
      });

      // Create custom cursor element
      const customCursor = document.createElement('div');
      customCursor.className = 'custom-cursor';
      document.body.appendChild(customCursor);

      let isTyping = false;
      let typingTimeout;
      let heartbeatTimeouts = [];
      
      // Function to update cursor position (only when invisible to avoid jumps)
      const updateCursorPosition = (force = false) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Check if cursor is currently visible
          const currentOpacity = parseFloat(customCursor.style.backgroundColor.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)?.[1] || '0');
          
          if (force || currentOpacity === 0 || !customCursor.style.backgroundColor) {
            // Only move when invisible or forced
            if (rect.height === 0) {
              // Cursor at end of line, use line height
              customCursor.style.left = `${rect.left + 1}px`;
              customCursor.style.top = `${rect.top}px`;
              customCursor.style.height = '1.2em';
            } else {
              customCursor.style.left = `${rect.left + 1}px`;
              customCursor.style.top = `${rect.top}px`;
              customCursor.style.height = `${rect.height}px`;
            }
            console.log('Cursor position updated (invisible or forced)');
          } else {
            console.log('Cursor position update skipped (cursor is visible)');
          }
        }
      };

      const startHeartbeat = () => {
        if (isTyping) return;
        
        console.log('Starting heartbeat');
        heartbeatTimeouts.forEach(timeout => clearTimeout(timeout));
        heartbeatTimeouts = [];
        
        // Smooth fade in and out
        const fadeIn = () => {
          let opacity = 0;
          const fadeStep = () => {
            if (isTyping) return;
            opacity += 0.045; // Slightly faster fade in
            customCursor.style.backgroundColor = `rgba(51, 51, 51, ${Math.min(opacity, 1)})`;
            if (opacity < 1) {
              heartbeatTimeouts.push(setTimeout(fadeStep, 36)); // ~10% faster
            } else {
              // Start fade out after brief pause
              heartbeatTimeouts.push(setTimeout(fadeOut, 100));
            }
          };
          fadeStep();
        };
        
        const fadeOut = () => {
          let opacity = 1;
          const fadeStep = () => {
            if (isTyping) return;
            opacity -= 0.055; // Slightly faster fade out
            customCursor.style.backgroundColor = `rgba(51, 51, 51, ${Math.max(opacity, 0)})`;
            if (opacity > 0) {
              heartbeatTimeouts.push(setTimeout(fadeStep, 36)); // ~10% faster
            } else {
              // Wait before next heartbeat
              heartbeatTimeouts.push(setTimeout(startHeartbeat, 2000));
            }
          };
          fadeStep();
        };
        
        fadeIn();
      };
      
      const onKeyDown = () => {
        console.log('Key pressed, stopping heartbeat');
        isTyping = true;
        customCursor.style.backgroundColor = 'rgba(51, 51, 51, 1)';
        clearTimeout(typingTimeout);
        heartbeatTimeouts.forEach(timeout => clearTimeout(timeout));
        heartbeatTimeouts = [];
        
        typingTimeout = setTimeout(() => {
          console.log('Stopped typing, cursor stays at 100% for 0.2s then starts heartbeat');
          isTyping = false;
          // Cursor is already at 100% opacity, so just wait 0.2s then start fade out
          heartbeatTimeouts.push(setTimeout(() => {
            const fadeOut = () => {
              let opacity = 1;
              const fadeStep = () => {
                if (isTyping) return;
                opacity -= 0.055; // Slightly faster fade out
                customCursor.style.backgroundColor = `rgba(51, 51, 51, ${Math.max(opacity, 0)})`;
                if (opacity > 0) {
                  heartbeatTimeouts.push(setTimeout(fadeStep, 36)); // ~10% faster
                } else {
                  // Wait before next heartbeat
                  heartbeatTimeouts.push(setTimeout(startHeartbeat, 2000));
                }
              };
              fadeStep();
            };
            fadeOut();
          }, 200)); // Wait 0.2s at 100% opacity before starting fade out
        }, 800); // Fade out earlier after stopping typing
      };
      
      const onInput = () => {
        updateCursorPosition(true); // Force update on input
      };
      
      const onSelectionChange = () => {
        updateCursorPosition(true); // Force update on selection change
      };

      // Function to smoothly reposition cursor when ghost effect happens
      const handleGhostEffectChange = () => {
        if (isTyping) return; // Don't interfere if user is typing
        
        console.log('Ghost effect detected, smoothly repositioning cursor');
        
        // Clear any existing heartbeat
        heartbeatTimeouts.forEach(timeout => clearTimeout(timeout));
        heartbeatTimeouts = [];
        
        // Fade out cursor if visible
        const currentOpacity = parseFloat(customCursor.style.backgroundColor.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)?.[1] || '0');
        
        if (currentOpacity > 0) {
          // Quickly fade out
          let opacity = currentOpacity;
          const quickFadeOut = () => {
            opacity -= 0.1;
            customCursor.style.backgroundColor = `rgba(51, 51, 51, ${Math.max(opacity, 0)})`;
            if (opacity > 0) {
              heartbeatTimeouts.push(setTimeout(quickFadeOut, 18)); // ~10% faster
            } else {
              // Now cursor is invisible, update position and restart heartbeat
              setTimeout(() => {
                updateCursorPosition(false); // Don't force, cursor should be invisible now
                setTimeout(startHeartbeat, 500); // Brief pause before new heartbeat
              }, 100);
            }
          };
          quickFadeOut();
        } else {
          // Already invisible, just update position and restart heartbeat
          setTimeout(() => {
            updateCursorPosition(false);
            setTimeout(startHeartbeat, 500);
          }, 100);
        }
      };

      // Listen for ghost effect DOM changes
      const observeGhostEffect = () => {
        const parentElement = document.querySelector('.parent');
        if (parentElement) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                handleGhostEffectChange();
              }
            });
          });
          
          observer.observe(parentElement, {
            childList: true,
            subtree: true
          });
          
          return observer;
        }
        return null;
      };

      // Also listen for the phaseOut animation end events
      const listenForPhaseOutEnd = () => {
        document.addEventListener('animationend', (e) => {
          if (e.target.classList.contains('phaseOut')) {
            handleGhostEffectChange();
          }
        });
      };
      
      // Mobile touch handlers to ensure editor remains focusable
      const onTouch = (e) => {
        console.log('Touch detected, focusing editor');
        editableElement.focus();
        updateCursorPosition(true);
      };

      const onFocusLost = () => {
        console.log('Focus lost - editor may need manual refocus on mobile');
      };

      editableElement.addEventListener('keydown', onKeyDown);
      editableElement.addEventListener('input', onInput);
      editableElement.addEventListener('click', () => updateCursorPosition(true));
      editableElement.addEventListener('touchstart', onTouch);
      editableElement.addEventListener('touchend', onTouch);
      editableElement.addEventListener('blur', onFocusLost);
      document.addEventListener('selectionchange', onSelectionChange);
      
      const ghostObserver = observeGhostEffect();
      listenForPhaseOutEnd();
      
      // Periodic check to ensure no default cursors show up
      const ensureNoCursors = () => {
        const allContentEditable = document.querySelectorAll('[contenteditable="true"], [data-slate-editor="true"]');
        allContentEditable.forEach(element => {
          element.style.setProperty('caret-color', 'transparent', 'important');
          const children = element.querySelectorAll('*');
          children.forEach(child => {
            child.style.setProperty('caret-color', 'transparent', 'important');
          });
        });
      };
      
      // Run cursor suppression immediately and periodically
      ensureNoCursors();
      const cursorSuppressionInterval = setInterval(ensureNoCursors, 1000);

      // Initial position and heartbeat
      setTimeout(() => {
        updateCursorPosition(true); // Force initial position
        startHeartbeat();
      }, 100);
      
      return () => {
        if (editableElement) {
          editableElement.removeEventListener('keydown', onKeyDown);
          editableElement.removeEventListener('input', onInput);
          editableElement.removeEventListener('click', updateCursorPosition);
          editableElement.removeEventListener('touchstart', onTouch);
          editableElement.removeEventListener('touchend', onTouch);
          editableElement.removeEventListener('blur', onFocusLost);
        }
        document.removeEventListener('selectionchange', onSelectionChange);
        if (ghostObserver) {
          ghostObserver.disconnect();
        }
        clearInterval(cursorSuppressionInterval);
        heartbeatTimeouts.forEach(timeout => clearTimeout(timeout));
        clearTimeout(typingTimeout);
        if (customCursor && customCursor.parentNode) {
          customCursor.parentNode.removeChild(customCursor);
        }
      };
    };
    
    const cleanup = createCustomCursor();
    return cleanup;
  }, [tipsModalShown])


  // starts the editor and all the various effects
  const startEditor = () => { 
    if(!readOnly) {
      setTipsModalShown(true)
      startGhostEffect()
      startPromptEffect()
      startAutosave()
      startTimer()
    }
    Transforms.select(editor, {path: [0, 0], offset: 0});
    setTimeout(()=>{setPrompt('', 1)}, 5000)
  }

  // tears down the editor and write analytics before component unmounts
  const teardownEditor = () => {
    
    //log session to mixpanel
    mixpanel.track('journal_session', {
      'completed?' : sessionComplete.current,
      'session_length_intended' : durationSeconds.current,
      'session_length_actual' : Math.ceil((Date.now() - journalStartTime.current)/1000)
    })

    //cleaer intervals and timeouts
    console.debug(clearInterval(ghostInterval.current))
    console.debug(clearInterval(autosaveInterval.current))
    console.debug(clearInterval(promptInterval.current))
    console.debug(clearTimeout(timer.current))
  }

  // starts a timer that ends when the specified duration of the session is up
  const startTimer = () => {
    // console.log('starting timer for ' + durationMins + ' minutes')
    journalStartTime.current = Date.now()
    durationSeconds.current = durationMins*60
    timer.current = setTimeout(() => {
      sessionComplete.current = true;
      setTimeUp(true)
    }, durationMins*60000) 
  }

  // starts the ghost effect wherein the top block of text disappears periodically
  const startGhostEffect = () => {
    setTipsModalShown(true)
    const gLen = parseInt(localStorage.getItem('GHOST_LENGTH_MS')) || 5000
    var gInt = setInterval(() => {
      if(document.querySelector('.parent').childElementCount > 1 && !document.querySelector('.parent').firstChild.classList.contains('fade')) {
        
        var toRemove = [document.querySelector('.parent').firstChild]
        var i = 1;

        while(i < document.querySelector('.parent').childElementCount - 1) {
          var t = document.querySelector('.parent').children[i]
          // console.log('text: ' + t.innerText)
          if(t.querySelector('[data-slate-length="0"]')){
            toRemove.push(t)
          } else {
            break;
          }
          i += 1;
        }
        
        toRemove.forEach(element => {
          element.classList.add('phaseOut')
          element.addEventListener("animationend", ()=>{
            element.remove()
          })   
        })
      }
    }, gLen)
    // console.log(gInt)
    ghostInterval.current = gInt;
  }

  //Prompts the user to keep writing if they have been idle for more than 20 seconds
  const startPromptEffect = () => {
    lastKeystrokeTimestamp.current = Math.floor(Date.now()/1000)
    var pInt = setInterval(() => {
      if(Math.floor(Date.now()/1000) - lastKeystrokeTimestamp.current > 20) {
        lastKeystrokeTimestamp.current = Math.floor(Date.now()/1000)
        setPrompt('Keep writing...or press ctrl+i for help', 0, 5000)
      }
    }, 1000)
    promptInterval.current = pInt
  }

  /*
  What we would like the setPrompt function to do is give us fine grained control over the text at the top of the page. The use cases are
  0. Show priorty message that persists until setPrompt called again
    a. Show that journal is thinking
  1. Show priority message that persists until a certain key is pressed
    a. Show message response 
  2. Show best-effort message that disappears after a certain duration
  */
  const setPrompt = (prompt, priority, duration) => { 
    
    //first figure out current state of assistant text
    const el = document.querySelector('.promptText')

    //if there is assistant text and this is not a priority message, ignore
    if(el.innerText.length != 0 && !priority) {
      return;
    }

    //transition the assistant text out
    el.style.opacity = 0;

    waitForElementTransition(el).then(() => {
      document.querySelector('.promptText').innerText = prompt;
      document.querySelector('.promptText').style.opacity = 1;
      
      if(duration) {
        setTimeout(() => {
          //clear prompt
          if(document.querySelector('.promptText').innerText == prompt) {
            setPrompt('', 1)
          }
        }, duration)
      }
    })

    return
  }

  // Starts autosaving what is typed every 5 seconds
  const startAutosave = () => {
    // console.log("starting autosave")
    var gInt = setInterval(() => {
      saveData()
    }, 5000)
    // console.log(gInt)
    autosaveInterval.current = gInt;
  }
  
  // Either fetches the content of the post (view mode) or creates a new post in the database (edit mode)
  const fetchContent = async () => { 
    setLoading(false)
  }  

  const encryptString = async (str) => {
    let key = ''
    return CryptoJS.TripleDES.encrypt(str, key).toString()
  }

  const decryptString = async (hash) => {
    let key = ''
    return CryptoJS.TripleDES.decrypt(hash, key).toString(CryptoJS.enc.Utf8)
  }

  const playSoundEffect = async (event) => {    
    if(event.metaKey && event.key == 's') {
      event.preventDefault();
      saveData().then(
        postSavedToast({
          position: 'top-right',
          description: "Saved :)",
          status: 'success',
          duration: 1000,
          isClosable: false,
          render: () => (
            <Box bg='white' alignContent='center' marginRight='30px' marginTop='20px'>
              <Flex direction='row'>
                <Text flex={1} align='right' color='gray.600'>(autosaved)</Text>
              </Flex>
            </Box>
          )
        }));
      return  
    } 

    if(event.metaKey && event.key == 'i') {
      event.preventDefault();
      setPrompt("Assist isn't available in offline mode right now.", 1, 3000)
      return
    }

    const noSoundList = ['Enter', 'Backspace', 'Esc', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Shift']

    if(!noSoundList.includes(event.key) && !event.metaKey) {
      try{
        sound.play()
        lastKeystrokeTimestamp.current = Math.floor(Date.now()/1000)
      } catch (error) {
        alert(error.message)
      } 
    }
  }

  const saveData = async function() {
    return
  }

  const getPromptStateForGPT = () => {

    let convo = editorValue.current
    let messages = []
    let prompt = ""

    for (let i = 0; i < convo.length; i++) {
      try {   
        if (convo[i].children[0].text) {
          prompt += convo[i].children[0].text
          prompt += '\n'
        }

        if (GPTCompletions.current[i]) {
          messages.push({"role":"user", "content": prompt})

          // Threads Beta doesn't support assistant messages yet
          // messages.push({"role":"assistant", "content": GPTCompletions.current[i]})
          prompt = ""
        }

      } catch (error) {
        continue
      }
    }

    messages.push({"role":"user", "content": prompt})
    
    console.log("GPT Prompt: " + JSON.stringify(messages))
    return messages
  }


  return (
        <>
          <AnimatePresence>
            {!setupModalShown && (
              <motion.div 
                key="setup"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {duration: 0.5, delay: 1}}} 
                exit={{opacity: 0, transition: {duration: 0.5}}}
              >
                <Center marginTop='25vh'>  
                  <VStack w='sm' spacing={8}>
                    <Image boxSize='100px' src='./hourglass.svg'/>
                    <Text>
                      how many minutes do you want to write for? 
                    </Text>
                    <HStack maxW='200px'>
                      <Button variant="ghost" {...durationDec}>-</Button>
                      <Input readOnly variant="flushed" {...durationInput} style={{textAlign: "center"}} value={durationMins}/>
                      <Button variant="ghost" {...durationInc}>+</Button>
                    </HStack>
                    <Button variant="ghost" onClick={() => setSetupModalShown(true)}>continue</Button>
                  </VStack>
                </Center>
              </motion.div>
            )}

            {setupModalShown && !tipsModalShown && (
              <motion.div 
                key="tips"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {duration: 0.5, delay: 1.5}}} 
                exit={{opacity: 0, transition: {duration: 0.5}}}
              >
                <Center marginTop='25vh'>  
                  <VStack w='sm' spacing={8}>
                    <Image boxSize='100px' src='./headphones.svg'/>
                    <Text textAlign='center'>
                      for the best experience:<br/>
                      play some relaxing music and make this full screen.
                    </Text>
                    <Button variant="ghost" onClick={() => startEditor()}>begin</Button>
                  </VStack>
                </Center>
              </motion.div>
            )}

            {!loading && tipsModalShown && ( 
              <motion.div
                key="editor"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {duration: 0.5, delay: 1.5}}} 
                exit={{opacity: 0, transition: {duration: 0.5}}}
              >
                <Center>
                  <Container maxW='md' h="1000px" marginTop="10vh" className="editor-container"> 
                    <div class="promptTextContainer">
                      <text class="promptText"> 
                        Start writing...
                      </text>
                    </div>
                    <Slate height="1000px" width="50%"
                      editor={editor} 
                      value={initValue}
                      onChange={(_value)=>{
                        editorValue.current = _value
                      }}
                      >
                      <Editable
                        readOnly={readOnly}
                        spellCheck={false}
                        autoFocus
                        height="1000px"
                        className="parent"
                        onKeyDown={playSoundEffect} 
                      />
                    </Slate>
                    <audio src="click.wav"></audio>
                  </Container>
                </Center> 
              </motion.div>
            )}

            {timeUp && (
              <motion.div
                key="timesUp"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {duration: 0.5, delay: 0}}} 
              >
                <Modal isOpen={true} onClose={()=>navigate('/')}>
                  <ModalOverlay />
                  <ModalContent>
                  <ModalHeader>Modal Title</ModalHeader>
                  <ModalBody>
                    <p>
                      Time's up!
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={()=>navigate('/')}>
                      Close
                    </Button>
                  </ModalFooter>
                  </ModalContent>
                </Modal>
              </motion.div>

            )}
          </AnimatePresence>
        </>
      );
    }

export default Editor;
