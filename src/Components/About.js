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
            Zenn is a distraction-free writing environment designed specifically for <a href='https://creativeprimer.com/stream-of-consciousness-journaling-guide/'>stream of consciousness journaling</a>. I find such journaling to be extremely meditative and stress-relieving. It's a great antidote for a restless mind. 
            <br/><br/>
            The privacy of your journal entries is of the utmost importance. Journal entries are protected with a combination of user-level encryption and row-level security. All of this is to say: <b>nobody except you on this specific device can read your journal entries</b>. Guaranteed.
          </Text>
        </motion.div>
      </Center>
    </Container> 
  )
}

export default About;