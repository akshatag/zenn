import { VStack, HStack, Text, Heading, Container, Image, Box, Center } from '@chakra-ui/react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { createEditor, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history'
import { supabase } from './supabaseClient';

function OldEditor(props) {

  console.log('rendering')

  const [editor] = useState(()=>withReact(withHistory(createEditor())))
  // const [value, setValue] = useState([]);
  const text = useRef('');


  const initValue = [
    {
      type: 'paragraph',
      children: [{ text: 'Don\'t think just write..' }],
    }
  ];

  const playSoundEffect = function(event) {    
    setTimeout(function(e) {
      var excludeKeys = ['Enter', 'Backspace']
      if(!excludeKeys.includes(event.key) && !event.metaKey){ 
        try{ 
          let sound = new Howl({
            autoplay: true,
            src: ['click.wav'],
            volume: .90
          });
          console.log("playing sound")
          sound.play();   
        } catch (error) {
          alert(error.message)
        }
      }
    }, 100)
  }

  return (
    <>
      <Center>
        <Container w="50%" h="1000px" marginTop="5%"> 
          <Slate height="1000px" width="50%" 
            editor={editor} 
            value={initValue}
            onChange={(value)=>{
              text.current=value;
            }}
            >
            <Editable
              spellCheck
              autoFocus
              height="1000px"
              className="parent"
              onKeyDown={playSoundEffect} 
            />
            <div className="border"></div>
          </Slate>
        </Container>
      </Center> 
    </>

  );
}

export default OldEditor;

    // old ghost effect
    // setInterval(() => {
    //   if(document.querySelector('.parent').childElementCount > 1 && !document.querySelector('.parent').firstChild.classList.contains('fadeout')) {
    //     const child = document.querySelector('.parent').firstChild
    //     child.classList.add('fade');
    //     child.addEventListener("animationend", ()=> {
    //       // Transforms.removeNodes(editor, { at: [0] })
    //       var toRemove = [child]
    //       var i = 1;
          
    //       while(i < document.querySelector('.parent').childElementCount - 1) {
    //         var t = document.querySelector('.parent').children[i]
    //         console.log('text: ' + t.innerText)
    //         if(t.querySelector('[data-slate-length="0"]')){
    //           toRemove.push(t)
    //         } else {
    //           break;
    //         }
    //         i += 1;
    //       }

    //       toRemove.forEach(element => {
    //         element.classList.add('shorten')
    //         element.addEventListener("transitionend", ()=>{
    //           element.remove()
    //         })   
    //       })
    //     }, false)
    //   }
    // }, 5000)