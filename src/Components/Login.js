import React, { useState, useEffect, useMemo } from 'react';
import { Image, Input, Spinner, Center, Container, Button, VStack, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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
      const { error } = await supabase.auth.signIn({ email })

      if(error) {
        throw error;
      }
    } catch(error) {
      alert(error.message)
    } finally {
      setSent(true)
      setLoading(false);
    }
  }

  return (

    <Container marginTop='20%'> 
      <Center>
        <VStack spacing={5}>
          <Lotus/>
          <motion.div
            animate={{opacity: [0, 1], y: [-25, -25]}}
            transition={{delay: 1, duration: 0.5}}
          >
            <VStack alignContent='center' alignItems='center' spacing={5}>
              <Input 
                style={{textAlign: 'center'}}
                variant='flushed'
                id='input'
                type='text' 
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
              </Input>
              {!sent ? <Button onClick={login}>Send Magic Link</Button> : <></>}
              {loading ? <Spinner /> : <></>}
              {(sent && !loading) ? <Text>Check your email for a login link</Text> : <></>}
            </VStack>
          </motion.div>
          <motion.div
            animate={{opacity: [0, 1]}}
            transition={{delay: 2, duration: 0.5}}
          >
            <Text size={1} as='i' color='gray.600'><Link to='/about'>Learn More</Link></Text>
          </motion.div>
        </VStack>
      </Center>
    </Container> 
  )
}

export default Login;