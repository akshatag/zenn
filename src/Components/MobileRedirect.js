import React, { useState, useEffect, useMemo } from 'react';
import { Image, Input, Spinner, Center, Container, Button, VStack, Text, Spacer } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import Lotus from './Lotus.js';

function MobileRedirect() {

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const login = async(event) => {
    event.preventDefault()
    try {
      setLoading(true)
    } finally {
      setSent(true)
      setLoading(false);
    }
  }

  return (

    <Container maxW='sm' marginTop='30vh'> 
      <Center>
        <VStack padding='10px'>
          <Lotus/>
          <motion.div
            animate={{opacity: [0, 1], y: [-25, -25]}}
            transition={{delay: 2, duration: 0.5}}
          >
            <VStack alignContent='center' alignItems='center'>
              <Text textAlign='center'>
                  Zenn is still in beta and doesn't have a mobile optimized format yet. For the best experience, please visit Zenn on your desktop or laptop computer.
              </Text>
            </VStack>
          </motion.div>
        </VStack>
      </Center>
      <motion.div
        animate={{opacity: [0, 1]}}
        transition={{delay: 3, duration: 0.5}}
      >
        <Text position="fixed" bottom="25px" left="30px" color='gray.500'><Link to='/about'>what's zenn?</Link></Text>        
      </motion.div>
    </Container> 
  )
}

export default MobileRedirect;
