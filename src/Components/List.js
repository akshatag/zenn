import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link} from "react-router-dom";
import { Spinner, Center, Container, Button, VStack, HStack, Flex, Text, Box, useToast } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import CryptoJS from 'crypto-js'; 
import './List.css'

function List() {

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])  
  const nameUpdatedToast = useToast()

  // Run exactly one time: fetch the Posts that belong to the authed user 
  useEffect(() => {
    checkForEncryptionKey()
    fetchPosts()
  }, [])

  const checkForEncryptionKey = async () => {
    if(localStorage.getItem('ENC_KEY_' + supabase.auth.user().id )) {
      console.log(localStorage.getItem('ENC_KEY_' + supabase.auth.user().id ))
      return
    } else {
      let salt = CryptoJS.lib.WordArray.random(128/8);
      let pass = CryptoJS.lib.WordArray.random(512/8)
      let key = CryptoJS.PBKDF2(pass, salt, { keySize: 512/32, iterations: 1000})

      localStorage.setItem('ENC_KEY_' + supabase.auth.user().id, key)
      return
    }
  }

  // Fetch the Posts that belong to the authed user
  const fetchPosts = async () => { 
    console.log('fetching from db...')
    console.log(supabase.auth.user().id)

    // RLS on the Posts table ensures only the authed user's data is returned
    try { 
      let { data, error, status } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if(error) {
        throw error
      }      
      setPosts(data)
      setLoading(false)
    } catch (error) {
      console.log(error.message)
    } 
  }  

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const deletePost = async (id, index) => {
    try {
      let { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if(error) {
        throw error
      }

      console.log(data)
      setPosts([...posts.slice(0, index), ...posts.slice(index+1)])
    } catch (error) {
      console.log(error.message)
    }
  }

  const renamePost = async (event, id, index) => {
    if(posts[index].slug != event.target.textContent) {
      // alert(event.target.textContent + ' and ' + id + ' and ' + index)
      try {
        let { data, error } = await supabase
          .from('posts')
          .update({slug: event.target.textContent})
          .eq('id', id)
  
        if(error) {
          throw error
        }

        posts[index].slug = event.target.textContent;
        setPosts(posts)
        nameUpdatedToast({
          position: 'top-right',
          description: "Name updated",
          status: 'success',
          duration: 1000,
          isClosable: false,
          render: () => (
            <Box bg='white' alignContent='center' marginRight='30px' marginTop='20px'>
              <Flex direction='row'>
                <Text flex={1} align='right' color='gray.600'>Journal entry updated</Text>
              </Flex>
            </Box>
          )
        })

      } catch (error) {
        console.log(error.message)
      }
    } 
  }


  // If loading show the spinner else show the list of Posts for the user
  return (
    <>
      {loading? 
        (
          <Container maxW='sm' marginTop='50%'>
            <Center>
            <Spinner/>
            </Center>
          </Container>
        ) : 
        (
          <Container maxW='sm' marginTop='25vh'>
            <Center>
              <VStack>
                <Link to="/editor">
                  <Button w='300px'>
                      write
                  </Button>
                </Link>
                {
                  posts.length == 0 ? 
                  <Text as='i'>Journal is empty...</Text>
                  : 
                  <Container style={{marginTop: '40px'}} width='800px'>
                    {posts.map((value, index) => {
                      return (
                        <motion.div
                          initial={{opacity: 0}}
                          animate={{opacity: 1}}
                          transition={{delay: 0.20*index, duration: 0.5}}
                        >
                          <HStack className='listEntry'>
                            <Text style={{marginRight: '5px'}} align='right' width='308px'>{value.created_at.substring(0, 10)}</Text>
                            <Text contentEditable onBlur={(e)=>renamePost(e, value.id, index)} style={{marginRight: '5px', maxWidth: '250px', whiteSpace: 'nowrap', overflow:'hidden'}} align='left'>{value.slug}</Text>
                            <Text className='listMenuItem' color='gray.500'><Link to={"/view/" + value.id}>open</Link></Text>
                            <Text className='listMenuItem' color='gray.500' onClick={() => deletePost(value.id, index)}>discard</Text>
                            {/* <div>
                              
                            </div> */}
                          </HStack>
                        </motion.div>
                      )
                    })}
                  </Container>
                }
              </VStack>
            </Center>
            <Button style={{position: 'fixed', bottom: '2vh', right: '2vh'}} variant='ghost' onClick={signOut}>close journal</Button>
          </Container>
        )
      }
    </>
  );
}

export default List;
