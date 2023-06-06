import React from 'react';
import { Center, Container, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';


function About() {

  return (
    <Container maxW='sm' marginTop='20vh'> 
      <Center padding="10px">
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 1, delay: 0.5}}
        >
          <Text>
            Writing is a proven remedy for a restless mind. Zenn offers a quiet, distraction free environment to quiet your thoughts. Zenn also arms you with the wisdom of prominent philosophers who can council you on your meditative journey.             
            <br/><br/>
            The privacy of your writing is paramount. Zenn encrypts all of your writing at the device & browser level. While this has drawbacks (you won't be able to access your journal entries from a different device or browser), it guarantees that only you can accesss your writing. 
          </Text>
        </motion.div>
      </Center>
     
      <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 1, delay: 1.5}}
        >
        <Text position="fixed" bottom="25px" left="30px" color='gray.500'><Link to='/'>home</Link></Text>
      </motion.div>
    </Container> 
  )
}

export default About;