import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link} from "react-router-dom";
import { Spinner, Center, Container, Button, VStack, HStack, Flex, Spacer, Text } from '@chakra-ui/react';
import { Image, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

function List() {

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])  

  // Run exactly one time: fetch the Posts that belong to the authed user 
  useEffect(() => {
    fetchPosts()
  }, [])

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

  // Create a new Post belonging to the authed user
  const createPost = async () => {
    try {
      let { data, error } = await supabase
        .from('posts')
        .insert([
          {
            belongs_to: supabase.auth.user().id,
            contents: [{
              type: 'paragraph',
              children: [{ text: 'Don\'t think just write..' }],
            }]
          }
        ])

      if(error) {
        throw error
      }

      console.log(data)
      setPosts([...posts, data[0]])
    } catch (error) {
      console.log(error.message)
    }
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
                        <Text as='i'>{value.duration + " mins"}</Text>
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
