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
                  <Container maxW='md' h="1000px" marginTop="10vh"> 
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
