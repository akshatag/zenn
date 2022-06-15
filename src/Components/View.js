import { VStack, HStack, Text, Heading, Button, Container, Image, Box, Center, useToast, Modal, ModalBody, ModalCloseButton, ModalHeader, ModalFooter, ModalOverlay, ModalContent } from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { createEditor, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history'
import { Navigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Editor.css';


function View(props) {

  const [editor] = useState(()=>withReact(withHistory(createEditor())))
  const [loading, setLoading] = useState(true) 

  const navigate = useNavigate();
  
  let value;
  let { postId } = useParams();
  postId = postId ? postId : 1;

  const [initValue, setInitValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'Don\'t think just write..' }],
    },
  ])

  useEffect(() => {
    fetchContents();
  }, [])


  const fetchContents = async () => { 
    console.log('fetching from db...')
    
    let { data, error, status } = await supabase
      .from('posts')
      .select(`contents`)
      .eq('id', postId)
      .single()
    
    if(data.contents) {
      console.log(data.contents)
      setInitValue(data.contents)
      setLoading(false) 
    }
  }  

  const saveData = async function() {
    try {
      const updates = {
        id: postId,
        contents: JSON.stringify(value)
      }

      let { data, error } = await supabase
        .from('posts')
        .update({ contents: value })
        .match({ id: postId })

      console.log(data)

      if(error) {
        throw error
      }
    } catch(error) {
      alert(error.message)
    } finally {
      
    }

    return
  }

  return (
    <>
      {!loading ?
        ( <Center>
          <Container maxW='md' h="1000px" marginTop="20vh"> 
            <Slate height="1000px" width="50%" 
              editor={editor} 
              value={initValue}
              onChange={(_value)=>{
                value = _value
              }}
              >
              <Editable
                readOnly
                spellCheck
                autoFocus
                height="1000px"
                className="parent"
              />
            </Slate>
            <audio src="click.wav"></audio>
          </Container>
        </Center> )
      : 
      <></>}
    </>
  );
}

export default View;
