import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link} from "react-router-dom";
import { Spinner, Center, Container, Button, VStack, Flex, Text } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import CryptoJS from 'crypto-js'; 
import './List.css'

function List() {

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])  

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
          <Container maxW='sm' marginTop='20vh'>
            <Center>
              <VStack>
                <Button variant='ghost' w='100%'>
                  <Link to="/editor">
                    Write
                  </Link>
                </Button>

                <Text as='i' casing='uppercase' style={{marginTop: '20vh', marginBottom: '2vh'}}>Previous entries...</Text>
                {posts.map((value, index) => {
                  return (
                    <motion.div
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      transition={{delay: 0.20*index, duration: 0.5}}
                    >
                      <Flex>
                        <Text style={{marginRight: '10px'}} flex='1' align='left' width='150px'><Link to={"/view/" + value.id}>{value.slug}</Link></Text>
                        <Text style={{marginRight: '10px'}}>{value.created_at.substring(0, 10)}</Text>
                        <Text style={{marginRight: '10px'}} as='i'>{value.duration + " mins"}</Text>
                        <div>
                          <Text as='i' onClick={() => deletePost(value.id, index)}>Delete</Text>
                        </div>
                      </Flex>
                    </motion.div>
                  )
                })}
              </VStack>
            </Center>
            <Button style={{position: 'fixed', top: '2vh', right: '2vh'}} variant='ghost' onClick={signOut}>Sign out</Button>
          </Container>
        )
      }
    </>
  );
}

export default List;
