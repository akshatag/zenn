import React from 'react';
import { Center, Container, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';


function About() {

  return (
    <Container maxW='sm' marginTop='30vh'> 
      <Center>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 1, delay: 0.5}}
        >
          <Text>
            Zenn is a scratchpad for your mind. Writing is proven to be an effective remedy for a restless mind. Zenn offers a quiet, distraction free place to spill your thoughts. Zenn also offers you the wisdom of prominent philosophers like the Buddha who can assist you on your meditative journey. 
            <br/><br/>
            The privacy of your writing is paramount. Zenn encrypts all of your writing at the browser level. This means only you, on this device and browser, can access your writing (test it out -- try accessing Zenn from a different device or browser. You'll find you can't access what you write here.)
          </Text>
        </motion.div>
      </Center>
    </Container> 
  )
}

export default About;