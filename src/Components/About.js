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
            Zenn is a distraction-free writing environment designed for <u><a href='https://creativeprimer.com/stream-of-consciousness-journaling-guide/'>stream of consciousness</a></u> journaling. I've found this kind of journaling to be extremely meditative and refreshing. It's a great remedy for a restless mind. 
            <br/><br/>
            The privacy of your journal entries is of the utmost importance. Journal entries are protected using user-level encryption and row-level security. In other words: <b>only you, on this specific device, can access the contents of your journal</b>. Nobody else, not even Zenn. Hopefully this gives you the peace of mind to utilize Zenn to its fullest extent.
          </Text>
        </motion.div>
      </Center>
    </Container> 
  )
}

export default About;