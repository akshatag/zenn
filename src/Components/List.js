import { Spinner, Center, Container, Button, VStack, HStack, Flex, Text, Box, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Link} from "react-router-dom";
import { motion } from 'framer-motion';
import React from 'react';
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
    return
  }

  // Fetch the Posts that belong to the authed user
  const fetchPosts = async () => { 
    setPosts([])
    setLoading(false)
  }  

  const signOut = async () => {
    return
  }

  const deletePost = async (id, index) => {
    setPosts([...posts.slice(0, index), ...posts.slice(index+1)])
  }

  const renamePost = async (event, id, index) => {
    if(posts[index].slug != event.target.textContent) {
      posts[index].slug = event.target.textContent;
      setPosts([...posts])
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
                  <Container style={{marginTop: '40px', marginLeft: '100px'}} width='800px'>
                    {posts.map((value, index) => {
                      return (
                        <motion.div
                          initial={{opacity: 0}}
                          animate={{opacity: 1}}
                          transition={{delay: 0.20*index, duration: 0.5}}
                        >
                          <HStack className='listEntry' align='left'>
                            <Text style={{marginLeft: '70px'}} align='right' width='100px'>{value.created_at.substring(0, 10)}</Text>
                            <Text contentEditable onBlur={(e)=>renamePost(e, value.id, index)} style={{marginRight: '5px', maxWidth: '500px', whiteSpace: 'nowrap', overflow:'hidden'}} align='left'>{value.slug}</Text>
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
            <Link to="/settings">
              <Button style={{position: 'fixed', bottom: '2vh', left: '2vh'}} variant='ghost'>settings</Button>
            </Link>
            <Button style={{position: 'fixed', bottom: '2vh', right: '2vh'}} variant='ghost' onClick={signOut}>close journal</Button>
          </Container>
        )
      }
    </>
  );
}

export default List;
