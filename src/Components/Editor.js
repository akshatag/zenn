import { useNumberInput, Flex, Box, Icon, Image, VStack, Input, HStack, Text, Button, Container, Center, useToast, Modal, ModalBody, ModalHeader, ModalFooter, ModalOverlay, ModalContent } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Howl, Howler } from 'howler';
import { generateSlug, totalUniqueSlugs } from "random-word-slugs";
import { Transforms, createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history'
import { supabase } from '../supabaseClient';
import CryptoJS from 'crypto-js'; 
import './Editor.css';



function Editor(props) {

  const readOnly = props.readOnly;

  const [durationMins, setDurationMins] = useState(5)
  const [postId, setPostId] = useState(useParams().postId)
  const [timeUp, setTimeUp] = useState(false)

  const [setupModalShown, setSetupModalShown] = useState(readOnly)
  const [tipsModalShown, setTipsModalShown] = useState(readOnly)
  const [loading, setLoading] = useState(true) 

  const [initValue, setInitValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'Just start writing...' }],
    },
  ])

  const [editor] = useState(()=>withReact(withHistory(createEditor())))

  const editorValue = useRef(initValue);
  const navigate = useNavigate();
  const postSavedToast = useToast();
  const ghostInterval = useRef();
  const autosaveInterval = useRef();
  const timer = useRef();

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
  
  const sound = new Howl({
    src: ['/clickLow.wav'],
    format: ['wav'],
    autoSuspend: false,
    preload: true,
    volume: 1,
    onloaderror: (id, msg)=>alert('loaderror, id: ' + id  + msg)
  });

  Howler.autoSuspend = false;

  useEffect(() => {
    fetchContent();
    if(readOnly) {
      startEditor()
    }
    return () => teardownEditor()
  }, [])

  const startEditor = () => { 
    if(!readOnly) {
      setTipsModalShown(true)
      startGhostEffect()
      startAutosave()
      startTimer()
    }
    Transforms.select(editor, {path: [0, 0], offset: 21});
  }

  const teardownEditor = () => {
    console.log("removing interval " + ghostInterval.current)
    console.log(clearInterval(ghostInterval.current))
    console.log(clearInterval(autosaveInterval.current))
    console.log(clearTimeout(timer.current))
  }

  const startTimer = () => {
    console.log('starting timer for ' + durationMins + ' minutes')

    timer.current = setTimeout(() => {
      setTimeUp(true)
    }, durationMins*60000) 
  }

  const startGhostEffect = () => {
    setTipsModalShown(true)
    console.log("setting interval")
    var gInt = setInterval(() => {
      if(document.querySelector('.parent').childElementCount > 1 && !document.querySelector('.parent').firstChild.classList.contains('fade')) {
        
        var toRemove = [document.querySelector('.parent').firstChild]
        var i = 1;

        while(i < document.querySelector('.parent').childElementCount - 1) {
          var t = document.querySelector('.parent').children[i]
          console.log('text: ' + t.innerText)
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
    }, 10000)
    console.log(gInt)
    ghostInterval.current = gInt;
  }

  const startAutosave = () => {
    console.log("starting autosave")
    var gInt = setInterval(() => {
      saveData()
    }, 5000)
    console.log(gInt)
    autosaveInterval.current = gInt;
  }
  
  const fetchContent = async () => { 

    if(postId) {
      console.log('fetching from db...')
    
      let { data, error, status } = await supabase
        .from('posts')
        .select(`content`)
        .eq('id', postId)
        .single()
      
      if(data.content) {
        let decryptedContent = await decryptString(data.content)
        setInitValue(JSON.parse(decryptedContent))
        setLoading(false) 
      }
    } else {
      console.log('inserting new post')
      let slug = generateSlug(2, {format: 'kebab', partsOfSpeech: ['noun', 'noun']})
      let encryptedContent = await encryptString(JSON.stringify(editorValue.current));

      let { data, error, status } = await supabase
        .from('posts')
        .insert({  
          slug: slug,
          belongs_to: supabase.auth.user().id,
          content: encryptedContent,
          duration: durationMins,
          finished: false
        })
    
      if(error) {
        throw error
      }

      console.log('new post id ' + data[0].id)
      setPostId(data[0].id)
      setLoading(false)
    }

  }  

  const encryptString = async (str) => {
    let key = localStorage.getItem('ENC_KEY_' + supabase.auth.user().id)
    return CryptoJS.TripleDES.encrypt(str, key).toString()
  }

  const decryptString = async (hash) => {
    let key = localStorage.getItem('ENC_KEY_' + supabase.auth.user().id)
    return CryptoJS.TripleDES.decrypt(hash, key).toString(CryptoJS.enc.Utf8)
  }

  const playSoundEffect = function(event) {    
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

    const noSoundList = ['Enter', 'Backspace', 'Esc', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']

    if(!noSoundList.includes(event.key) && !event.metaKey) {
      try{
        sound.play()
      } catch (error) {
        alert(error.message)
      } 
    }
  }

  const saveData = async function() {
    console.log('post id ' + postId)
    console.log('editor value: ' + JSON.stringify(editorValue.current))

    let encryptedContent = await encryptString(JSON.stringify(editorValue.current))

    if(postId) {
      try {
        const updates = {
          content: encryptedContent
        }
  
        let { data, error } = await supabase
          .from('posts')
          .update(updates)
          .eq('id', postId)
  
        console.log('saved data: ' + JSON.stringify(data))
  
        if(error) {
          throw error
        }
      } catch(error) {
        console.log(error)
      }
    }
    return
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
                      How many minutes do you want to write for? 
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
                      For the best experience, wear some headphones. <br/>
                      Play some relaxing music. <br/>
                      Make this full screen.
                    </Text>
                    <Button variant="ghost" onClick={() => startEditor()}>start</Button>
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
                  <Container maxW='md' h="1000px" marginTop="20vh"> 
                    <Slate height="1000px" width="50%" 
                      editor={editor} 
                      value={initValue}
                      onChange={(_value)=>{
                        editorValue.current = _value
                      }}
                      >
                      <Editable
                        readOnly={readOnly}
                        spellCheck
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
                <Modal isOpen={true} onClose={()=>navigate('/posts')}>
                  <ModalOverlay />
                  <ModalContent>
                  <ModalHeader>Modal Title</ModalHeader>
                  <ModalBody>
                    <p>
                      Time's up!
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={()=>navigate('/posts')}>
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
