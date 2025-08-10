import React, { useState, useEffect, useMemo } from 'react';
import { Image, Input, Spinner, Center, Container, Button, VStack, Text, Spacer } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import Lotus from './Lotus.js';

function Login() {

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const login = async(event) => {
    event.preventDefault()
    console.log(email)
    try {
      setLoading(true)
    } finally {
      setSent(true)
      setLoading(false);
    }
  }

  return (

    <Container marginTop='30vh'> 
      <Center>
        <VStack>
          <Lotus/>
          <motion.div
            animate={{opacity: [0, 1], y: [-25, -25]}}
            transition={{delay: 1, duration: 0.5}}
          >
            <Text style={{marginTop: '-15px'}}>
                  Zenn
            </Text>
          </motion.div>

          <motion.div
            animate={{opacity: [0, 1], y: [-25, -25]}}
            transition={{delay: 2, duration: 0.5}}
          >
            <VStack alignContent='center' alignItems='center'>
              <Input 
                style={{textAlign: 'center', marginTop: '50px'}}
                variant='flushed'
                id='input'
                type='text' 
                placeholder='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
              </Input>
              {!sent ? <Button size="sm" style={{color: "gray", marginTop: "2vh"}} onClick={login}>send magic link</Button> : <></>}
              {loading ? <Spinner /> : <></>}
              {(sent && !loading) ? <Text style={{fontSize: "16px", color: "gray", marginTop: "2vh"}}><i>check your inbox</i></Text> : <></>}
            </VStack>
          </motion.div>
        </VStack>
      </Center>
      <motion.div
        animate={{opacity: [0, 1]}}
        transition={{delay: 3, duration: 0.5}}
      >
        <Text position="fixed" bottom="25px" left="30px" color='gray.500'><Link to='/about'>what's zenn?</Link></Text>
        <Text position="fixed" bottom="25px" right="30px">
          made with &#x2665; at taro labs
        </Text>
        
      </motion.div>
    </Container> 
  )
}

export default Login;
